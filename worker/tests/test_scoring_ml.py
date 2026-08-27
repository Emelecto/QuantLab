"""Tests del scoring de torneos ML.

Verifican las propiedades que sostienen la integridad del torneo:
 - el scoring NO tiene sesgo (predicciones aleatorias -> ~0)
 - detecta señal real por encima del azar
 - FNC castiga a quien solo replica una feature
 - el meta-modelo agrega valor
 - se detecta el plagio
 - una submission con pocas eras se marca invalida
"""
import numpy as np
import pandas as pd
import pytest

import scoring_ml as sc


@pytest.fixture
def datos():
    rng = np.random.default_rng(42)
    n, f = 1200, 6
    feats = pd.DataFrame(
        rng.random((n, f)), columns=[f"feature_{i+1:02d}" for i in range(f)]
    )
    senal = feats["feature_01"] * 0.5 + feats["feature_02"] * 0.3
    target = pd.Series(senal + rng.normal(0, 0.5, n), name="target")
    return feats, target, senal, rng


def test_scoring_sin_sesgo():
    """200 predicciones aleatorias deben promediar ~0 (medido: +0.0015, t=1.22)."""
    rng = np.random.default_rng(1)
    n = 3000
    target = pd.Series(np.floor(rng.random(n) * 5) / 4, name="target")
    scores = [
        sc.numerai_corr(pd.DataFrame({"p": rng.random(n)}), target)["p"]
        for _ in range(200)
    ]
    scores = np.array(scores)
    t_stat = scores.mean() / (scores.std() / np.sqrt(len(scores)))
    assert abs(t_stat) < 3, f"scoring sesgado: t={t_stat:.2f}"


def test_detecta_senal_sobre_azar(datos):
    feats, target, senal, rng = datos
    preds = pd.DataFrame({
        "buena": senal * 0.7 + rng.random(len(feats)) * 0.3,
        "azar": rng.random(len(feats)),
    })
    corr = sc.numerai_corr(preds, target)
    assert corr["buena"] > corr["azar"]
    assert corr["buena"] > 0.1


def test_fnc_castiga_replicar_una_feature(datos):
    """Un modelo que solo copia una feature puntua en corr pero se hunde en FNC."""
    feats, target, senal, rng = datos
    preds = pd.DataFrame({
        "honesto": senal * 0.7 + rng.random(len(feats)) * 0.3,
        "una_feature": feats["feature_01"] + rng.random(len(feats)) * 0.05,
    })
    corr = sc.numerai_corr(preds, target)
    fnc = sc.feature_neutral_corr(preds, feats, target)
    # En corr son comparables...
    assert corr["una_feature"] > 0.1
    # ...pero el tramposo pierde mas al neutralizar.
    caida_tramposo = corr["una_feature"] - fnc["una_feature"]
    caida_honesto = corr["honesto"] - fnc["honesto"]
    assert caida_tramposo > caida_honesto


def test_neutralize_incluye_intercepto(datos):
    """Sin intercepto el resultado cambia: es un requisito, no un detalle."""
    feats, target, senal, rng = datos
    preds = pd.DataFrame({"p": senal + rng.random(len(feats)) * 0.2})
    con = sc.neutralize(preds, feats)
    a = feats.values  # sin columna de 1s
    sin = preds.values - a @ np.linalg.lstsq(a, preds.values, rcond=1e-6)[0]
    assert not np.allclose(con.values, sin, atol=1e-9)


def test_meta_modelo_agrega_valor(datos):
    feats, target, senal, rng = datos
    n = len(feats)
    preds = pd.DataFrame({
        "a": senal * 0.5 + rng.random(n) * 0.5,
        "b": senal * 0.4 + rng.random(n) * 0.6,
        "c": senal * 0.45 + rng.random(n) * 0.55,
    })
    pesos = pd.Series({"a": 1.0, "b": 1.0, "c": 1.0})
    meta = sc.stake_weight(preds, pesos)
    corr = sc.numerai_corr(preds, target)
    corr_meta = sc.numerai_corr(pd.DataFrame({"meta": meta}), target)["meta"]
    assert corr_meta > corr.mean()


def test_churn_distingue_estabilidad():
    rng = np.random.default_rng(0)
    n = 500
    a = pd.Series(rng.random(n))
    casi_igual = a * 0.98 + rng.random(n) * 0.02
    distinto = pd.Series(rng.random(n))
    assert sc.churn(a, casi_igual) < 0.1
    assert sc.churn(a, distinto) > 0.7


def test_detecta_plagio(datos):
    feats, target, senal, rng = datos
    n = len(feats)
    base = senal * 0.7 + rng.random(n) * 0.3
    preds = pd.DataFrame({
        "original": base,
        "clon": base * 0.99 + rng.random(n) * 0.01,
        "independiente": rng.random(n),
    })
    sospechosos = sc.matriz_similitud(preds, umbral=0.95)
    pares = {frozenset((s["a"], s["b"])) for s in sospechosos}
    assert frozenset(("original", "clon")) in pares
    assert frozenset(("original", "independiente")) not in pares


def test_submission_con_pocas_eras_es_invalida(datos):
    """Nadie debe ganar con 3 predicciones afortunadas."""
    feats, target, senal, rng = datos
    n = len(feats)
    eras = pd.Series([f"era_{i % 3:04d}" for i in range(n)])  # solo 3 eras
    res = sc.puntuar_submission(
        pd.Series(senal + rng.random(n) * 0.3), target, eras, feats
    )
    assert res["n_eras"] <= 3
    assert res["valida"] is False


def test_puntuar_submission_completa(datos):
    feats, target, senal, rng = datos
    n = len(feats)
    eras = pd.Series([f"era_{i % 40:04d}" for i in range(n)])
    buena = sc.puntuar_submission(
        pd.Series(senal * 0.8 + rng.random(n) * 0.2), target, eras, feats
    )
    mala = sc.puntuar_submission(pd.Series(rng.random(n)), target, eras, feats)
    assert buena["valida"] is True
    assert buena["n_eras"] >= sc.MIN_ERAS
    assert buena["score"] > mala["score"]
    for k in ("corr_mean", "fnc_mean", "consistencia", "score", "n_eras"):
        assert k in buena


def test_penaliza_clon_del_meta_modelo(datos):
    """Copiar el consenso reduce el score a la mitad."""
    feats, target, senal, rng = datos
    n = len(feats)
    eras = pd.Series([f"era_{i % 40:04d}" for i in range(n)])
    meta = pd.Series(senal * 0.7 + rng.random(n) * 0.3)
    clon = pd.Series(meta.values * 0.995 + rng.random(n) * 0.005)
    con_meta = sc.puntuar_submission(clon, target, eras, feats, meta_modelo=meta)
    sin_meta = sc.puntuar_submission(clon, target, eras, feats)
    assert con_meta["meta_corr"] > sc.UMBRAL_PLAGIO
    assert con_meta["score"] < sin_meta["score"]


def test_puntuar_con_indice_no_contiguo(datos):
    """REGRESION: un slice de panel trae indice no contiguo.

    El bug real: groupby preservaba el indice original y `features.loc[idx]`
    lanzaba KeyError. Aparecio en el e2e del modo real, no en los tests
    iniciales porque estos usaban indices 0..n-1.
    """
    feats, target, senal, rng = datos
    n = len(feats)
    # Indice salteado, como al filtrar un panel por era_idx
    idx = pd.Index(range(1000, 1000 + n * 3, 3))
    f2 = feats.set_index(idx)
    t2 = pd.Series(target.values, index=idx, name="target")
    p2 = pd.Series(senal.values * 0.8 + rng.random(n) * 0.2, index=idx)
    e2 = pd.Series([f"era_{i % 30:04d}" for i in range(n)], index=idx)

    res = sc.puntuar_submission(p2, t2, e2, f2)
    assert res["valida"] is True
    assert res["n_eras"] >= sc.MIN_ERAS
    assert res["score"] is not None
    assert res["fnc_mean"] is not None


def test_puntuar_acepta_arrays_sin_indice(datos):
    """Debe funcionar con numpy arrays, no solo Series indexadas."""
    feats, target, senal, rng = datos
    n = len(feats)
    eras = np.array([f"era_{i % 30:04d}" for i in range(n)])
    res = sc.puntuar_submission(
        pd.Series(senal.values + rng.random(n) * 0.3),
        pd.Series(target.values, name="target"),
        pd.Series(eras),
        feats,
    )
    assert res["score"] is not None
    assert res["n_eras"] >= sc.MIN_ERAS
