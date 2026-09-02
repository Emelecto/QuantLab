"""Tests de Fase 2: persistencia, endpoints y scheduler de torneos ML.

Todo offline: se mockea Supabase (conftest.mock_supabase) y se stubbea ml_storage
para no tocar Storage. El scoring sí usa datos REALES generados en memoria.
"""
import io
import sys
from unittest.mock import MagicMock, patch

import numpy as np
import pandas as pd
import pytest

import dataset_builder as db
import scoring_ml as sc
import ml_persist
import ml_endpoints
import ml_storage


class _Table:
    """Mock de tabla Supabase con encadenamiento y filtros reales usados por el código.

    Soporta .select().eq().in_().gte().lte().neq().order().limit().execute() y
    .insert()/.update()/.upsert()/.delete(). Los filtros se aplican sobre el
    store en memoria para que los tests reflejen el comportamiento real.
    """
    def __init__(self, store, name):
        self._store = store
        self._name = name
        self._reset()
        self._last_insert = None

    def _reset(self):
        self._filters = []
        self._order = None
        self._limit = None
        self._offset = None
        self._pk = None
        if self._name == "ml_datasets":
            self._pk = ("tournament_id", "round_number", "kind")
        elif self._name == "prediction_submissions":
            self._pk = ("dataset_id", "user_id")

    def select(self, *a, **k):
        self._reset()
        return self

    def insert(self, payload):
        rows = payload if isinstance(payload, list) else [payload]
        for r in rows:
            r.setdefault("id", f"{self._name}-{len(self._store.get(self._name, [])) + 1}")
        self._store.setdefault(self._name, []).extend(rows)
        self._last_insert = rows
        return self

    def update(self, payload):
        self._reset()  # limpia filtros de selects previos en la misma tabla
        data = self._store.get(self._name, [])
        target = self._apply_filters(data)
        for row in (target if self._filters else data):
            row.update(payload)
        return self

    def upsert(self, payload):
        return self.insert(payload)

    def delete(self):
        self._reset()
        data = self._store.get(self._name, [])
        keep = [r for r in data if not self._matches(r)]
        self._store[self._name] = keep
        return self

    def eq(self, col, val):
        self._filters.append(("eq", col, val))
        return self

    def neq(self, col, val):
        self._filters.append(("neq", col, val))
        return self

    def in_(self, col, vals):
        self._filters.append(("in", col, vals))
        return self

    def gte(self, col, val):
        self._filters.append(("gte", col, val))
        return self

    def lte(self, col, val):
        self._filters.append(("lte", col, val))
        return self

    def order(self, col, desc=False):
        self._order = (col, desc)
        return self

    def limit(self, n):
        self._limit = n
        return self

    def offset(self, n):
        self._offset = n
        return self

    def _matches(self, row):
        for op, col, val in self._filters:
            if op == "eq" and row.get(col) != val:
                return False
            if op == "neq" and row.get(col) == val:
                return False
            if op == "in" and row.get(col) not in val:
                return False
            if op == "gte" and not (row.get(col) is not None and row.get(col) >= val):
                return False
            if op == "lte" and not (row.get(col) is not None and row.get(col) <= val):
                return False
        return True

    def _apply_filters(self, data):
        out = [r for r in data if self._matches(r)]
        if self._order:
            col, desc = self._order
            out = sorted(out, key=lambda r: r.get(col) or 0, reverse=desc)
        if self._offset:
            out = out[self._offset:]
        if self._limit:
            out = out[: self._limit]
        return out

    def execute(self):
        if self._last_insert is not None and not self._filters and self._order is None:
            data = list(self._last_insert)
            self._last_insert = None
            return MagicMock(data=data)
        self._last_insert = None
        data = self._store.get(self._name, [])
        out = self._apply_filters(data)
        return MagicMock(data=out)


@pytest.fixture
def sb(mock_supabase):
    """Supabase mockeado con encadenamiento y filtros reales."""
    store = {}
    created = {}

    def make_table(name):
        if name not in created:
            created[name] = _Table(store, name)
        return created[name]

    mock_supabase.table.side_effect = make_table
    mock_supabase._store = store
    yield mock_supabase


@pytest.fixture
def stub_storage(monkeypatch):
    """ml_storage no toca red: guarda/lee archivos en memoria."""
    mem = {}

    def up_csv(csv_text, path):
        # Almacenar como bytes para simular download_csv real
        mem[path] = csv_text.encode("utf-8") if isinstance(csv_text, str) else csv_text
        return path

    def up_parquet(df, path):
        mem[path] = df
        return path

    def down(path):
        return mem[path]

    def url(path):
        return f"https://fake.storage/{path}"

    monkeypatch.setattr(ml_storage, "upload_csv", up_csv)
    monkeypatch.setattr(ml_storage, "upload_parquet", up_parquet)
    monkeypatch.setattr(ml_storage, "download_parquet", down)
    monkeypatch.setattr(ml_storage, "public_url", url)
    return mem


def _dataset_real(n_activos=120, n_eras=60, seed=1):
    panel, cols, meta = db.generar_mercado_sintetico(
        n_activos=n_activos, n_eras=n_eras, n_features=12, n_features_utiles=5,
        ic_objetivo=0.06, seed=seed,
    )
    return panel, cols, meta


# ---------------------------------------------------------------------------
def test_crear_dataset_guarda_holdout_y_no_sube_live(sb, stub_storage, monkeypatch):
    """El live NO se sube a Storage; su holdout sí se guarda en dataset_targets."""
    import tournaments as _t
    monkeypatch.setattr(_t, "get_supabase", lambda: sb)
    panel, cols, meta = _dataset_real()

    with patch.object(db, "generar_mercado_sintetico", return_value=(panel, cols, meta)):
        live = ml_persist.crear_dataset("tid", 1, mode="sintetico", n_activos=120,
                                         n_eras=60, n_features=12, n_features_utiles=5,
                                         ic_objetivo=0.06, seed=1)

    # live registrado
    lives = [r for r in sb._store.get("ml_datasets", []) if r["kind"] == "live"]
    assert len(lives) == 1
    assert lives[0]["bucket_path"] is None, "el live NO debe subirse a Storage"

    # train/validation SÍ subidos
    train_paths = [r["bucket_path"] for r in sb._store["ml_datasets"] if r["kind"] in ("train", "validation")]
    assert len(train_paths) == 2
    assert all(p in stub_storage for p in train_paths)
    # El parquet público NO debe contener el target real
    for p in train_paths:
        assert "target" not in stub_storage[p].columns, "el target NO debe subirse a Storage"

    # holdout guardado en dataset_targets (tantas filas como el live)
    live_rec = [r for r in sb._store["ml_datasets"] if r["kind"] == "live"][0]
    targets = sb._store.get("dataset_targets", [])
    assert len(targets) == live_rec["row_count"]
    assert targets[0]["dataset_id"] == live["id"]


def test_endpoints_lista_datasets_no_expone_holdout(sb, monkeypatch):
    import tournaments as _t
    monkeypatch.setattr(_t, "get_supabase", lambda: sb)
    monkeypatch.setattr(ml_storage, "public_url", lambda p: f"https://fake.storage/{p}")
    sb._store.setdefault("ml_datasets", [
        {"id": "d1", "tournament_id": "t", "round_number": 1, "mode": "sintetico",
         "kind": "train", "status": "ready", "bucket_path": "s/train.parquet",
         "n_assets": 10, "n_eras": 5, "n_features": 3, "row_count": 50,
         "feature_cols": ["f1"], "closes_at": None},
        {"id": "d2", "tournament_id": "t", "round_number": 1, "mode": "sintetico",
         "kind": "live", "status": "ready", "bucket_path": None,
         "n_assets": 10, "n_eras": 5, "n_features": 3, "row_count": 50,
         "feature_cols": ["f1"], "closes_at": None},
    ])
    # Evita que descargue de Storage en list_datasets (usa public_url del stub ya)
    from fastapi.testclient import TestClient
    import main
    client = TestClient(main.app)
    r = client.get("/ml/datasets")
    assert r.status_code == 200
    ds = {d["kind"]: d for d in r.json()["datasets"]}
    assert ds["train"]["download_url"].startswith("https://fake.storage/")
    assert ds["live"]["download_url"] is None  # holdout nunca expuesto


def test_submit_csv_valida_columnas(sb, monkeypatch):
    """CSV sin columna prediction -> 422."""
    import tournaments as _t
    monkeypatch.setattr(_t, "get_supabase", lambda: sb)
    sb._store.setdefault("ml_datasets", [
        {"id": "live1", "kind": "live", "status": "ready", "closes_at": None},
    ])
    from fastapi.testclient import TestClient
    import main
    client = TestClient(main.app)
    bad = io.BytesIO(b"id,something\n1,0.3\n")
    r = client.post("/ml/datasets/live1/predictions",
                    files={"file": ("p.csv", bad, "text/csv")},
                    headers={"Authorization": "Bearer x"})
    assert r.status_code == 422


def test_submit_reemplaza_sin_duplicar(sb, monkeypatch, stub_storage):
    """Segundo envío del mismo usuario actualiza, no inserta duplicado."""
    import tournaments as _t
    monkeypatch.setattr(_t, "get_supabase", lambda: sb)
    sb._store.setdefault("ml_datasets", [
        {"id": "live1", "kind": "live", "status": "ready", "closes_at": None},
    ])
    sb._store.setdefault("prediction_submissions", [
        {"id": "prev", "dataset_id": "live1", "user_id": "u1", "file_path": "old.csv"},
    ])
    from fastapi.testclient import TestClient
    import main
    client = TestClient(main.app)

    good = io.BytesIO(b"id,prediction\n1,0.3\n2,0.7\n3,-0.1\n")
    r = client.post("/ml/datasets/live1/predictions",
                    files={"file": ("p.csv", good, "text/csv")},
                    headers={"Authorization": "Bearer x"})
    assert r.status_code == 200
    subs = sb._store["prediction_submissions"]
    assert len([s for s in subs if s["dataset_id"] == "live1" and s["user_id"] == "u1"]) == 1
    assert subs[-1]["row_count"] == 3


def test_scoring_end_to_end_con_datos_reales(sb, monkeypatch, stub_storage):
    """Flujo completo: generar dataset -> enviar predicciones -> puntuar."""
    import tournaments as _t
    monkeypatch.setattr(_t, "get_supabase", lambda: sb)
    panel, cols, meta = _dataset_real(n_activos=200, n_eras=80, seed=7)
    with patch.object(db, "generar_mercado_sintetico", return_value=(panel, cols, meta)):
        ml_persist.crear_dataset("t", 1, mode="sintetico", n_activos=200, n_eras=80,
                                 n_features=12, n_features_utiles=5, ic_objetivo=0.06, seed=7)
    live = [r for r in sb._store["ml_datasets"] if r["kind"] == "live"][0]
    feat = live["feature_cols"]
    targets = pd.DataFrame(sb._store["dataset_targets"])

    # Usuario entrena un modelo real sobre el live (en memoria) y predice.
    # Ojo: debe usar la MISMA sal que crear_dataset para que los 'id' coincidan.
    interna = db.obfuscar(panel, cols, salt=ml_persist._SALT, seed=meta.get("seed", 0))[1]
    partes = db.partir(interna)
    tr, lv = partes["train"], partes["live"].copy()
    from sklearn.ensemble import HistGradientBoostingRegressor
    m = HistGradientBoostingRegressor(max_iter=120, learning_rate=0.08, max_depth=4, random_state=0)
    m.fit(tr[feat], tr["target"])
    lv["prediction"] = m.predict(lv[feat])
    preds = lv[["id", "prediction"]]

    # Insertar submission con el df embebido (tests)
    sb._store.setdefault("prediction_submissions", [])
    sb._store["prediction_submissions"].append({
        "id": "sub1", "dataset_id": live["id"], "user_id": "u1",
        "file_path": "sub.csv", "_predicciones_df": preds,
    })
    # _leer_predicciones debe usar el df embebido
    res = ml_persist.puntuar_submission_en_bd("sub1")
    assert res["valida"] is True
    assert res["corr_mean"] > 0, "el modelo debe puntuar positivo"
    # La submission quedó scored (lo verificamos consultando el mock como lo haría el código)
    st = sb.table("prediction_submissions").select("status").eq("id", "sub1").execute()
    assert st.data[0]["status"] == "scored"


def test_create_ml_round_en_scheduler(sb, monkeypatch, stub_storage):
    """create_ml_round inserta torneo + datasets y no duplica si hay reciente."""
    import tournaments as _t
    monkeypatch.setattr(_t, "get_supabase", lambda: sb)
    # Sin rondas previas -> crea
    r1 = ml_scheduler_crear(sb, monkeypatch, seed=11)
    assert r1 is not None
    # Simular ronda reciente para que no duplique
    n_ds_antes = len(sb._store.get("ml_datasets", []))
    r2 = ml_scheduler_crear(sb, monkeypatch, seed=12, reciente=True)
    assert r2 is None
    assert len(sb._store.get("ml_datasets", [])) == n_ds_antes


def ml_scheduler_crear(sb, monkeypatch, seed=1, reciente=False):
    """Helper: llama create_ml_round con stub de generador y (opcional) ronda reciente."""
    import dataset_builder as _db
    panel, cols, meta = _dataset_real(seed=seed)
    monkeypatch.setattr(_db, "generar_mercado_sintetico", lambda **k: (panel, cols, meta))
    if reciente:
        sb._store.setdefault("ml_datasets", [{
            "id": "old", "kind": "live", "status": "ready",
            "created_at": "2099-01-01T00:00:00+00:00",
        }])
    import ml_scheduler
    return ml_scheduler.create_ml_round(sb, mode="sintetico", now=__import__("datetime").datetime(2026, 1, 1),
                                       round_days=4, n_activos=120, n_eras=60,
                                       n_features=12, n_features_utiles=5, ic_objetivo=0.06, seed=seed)


def test_metamodelo_penaliza_clon(sb, monkeypatch, stub_storage):
    """Con 2 subs idénticas (clon), el meta-modelo marca una con plagio o meta_corr>0.95."""
    import tournaments as _t
    import ml_scheduler
    monkeypatch.setattr(_t, "get_supabase", lambda: sb)
    panel, cols, meta = _dataset_real(n_activos=200, n_eras=80, seed=3)
    with patch.object(db, "generar_mercado_sintetico", return_value=(panel, cols, meta)):
        ml_persist.crear_dataset("t", 1, mode="sintetico", n_activos=200, n_eras=80,
                                 n_features=12, n_features_utiles=5, ic_objetivo=0.06, seed=3)
    live = [r for r in sb._store["ml_datasets"] if r["kind"] == "live"][0]
    feat = live["feature_cols"]
    interna = db.obfuscar(panel, cols, salt=ml_persist._SALT, seed=meta.get("seed", 0))[1]
    partes = db.partir(interna)
    from sklearn.ensemble import HistGradientBoostingRegressor
    m = HistGradientBoostingRegressor(max_iter=120, learning_rate=0.08, max_depth=4, random_state=0)
    m.fit(partes["train"][feat], partes["train"]["target"])
    partes["live"]["prediction"] = m.predict(partes["live"][feat])
    preds = partes["live"][["id", "prediction"]]
    # Dos usuarios envían el MISMO modelo (clon)
    sb._store.setdefault("prediction_submissions", [])
    for uid in ("u1", "u2"):
        sb._store["prediction_submissions"].append({
            "id": f"sub_{uid}", "dataset_id": live["id"], "user_id": uid,
            "file_path": f"{uid}.csv", "_predicciones_df": preds.copy(),
        })
    # Puntuar ambas (is_valid=True, score>0)
    ml_persist.puntuar_submission_en_bd("sub_u1")
    ml_persist.puntuar_submission_en_bd("sub_u2")
    # Construir meta-modelo y re-puntuar con penalización por falta de originalidad
    ml_scheduler._distribute_ml_qp(sb, live["id"])
    # Una de las dos debe quedar marcada (plagio o meta_corr alto)
    st = sb.table("prediction_submissions").select("id,plagio_flag,meta_corr").eq(
        "dataset_id", live["id"]
    ).execute()
    assert any(
        (s.get("plagio_flag") is True)
        or (s.get("meta_corr") is not None and s["meta_corr"] > 0.95)
        for s in st.data
    )
