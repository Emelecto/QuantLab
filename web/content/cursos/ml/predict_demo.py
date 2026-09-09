"""C5-L8 · predict_demo.py — demo de inferencia con validación de esquema.

Patrón mínimo de deployment cuantitativo: cargar → validar (falla cerrada) →
featurizar con EL MISMO código de entrenamiento → predecir → emitir JSON.
Uso:
    python predict_demo.py --input ../data/c5_l8.csv
"""
import argparse
import json
import sys

import numpy as np
import pandas as pd

REQUIRED = ["dia", "close", "high", "low", "volumen"]
FEATURES = ["rango", "lag_1", "lag_2", "lag_3", "lag_5", "mom5"]
MIN_FILAS = 30


def fail(msg: str) -> None:
    print(json.dumps({"ok": False, "error": msg}))
    sys.exit(2)


def featurizar(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["ret"] = df["close"].pct_change()
    df["rango"] = (df["high"] - df["low"]) / df["close"]
    for k in (1, 2, 3, 5):
        df[f"lag_{k}"] = df["ret"].shift(k)
    df["mom5"] = df["close"] / df["close"].shift(5) - 1
    return df.dropna().reset_index(drop=True)


def main() -> None:
    ap = argparse.ArgumentParser(description="Demo de inferencia C5-L8")
    ap.add_argument("--input", required=True, help="CSV OHLCV con columnas dia,close,high,low,volumen")
    args = ap.parse_args()

    try:
        df = pd.read_csv(args.input)
    except Exception as e:  # noqa: BLE001 — falla cerrada ante cualquier IO
        fail(f"no se pudo leer el CSV: {e}")

    faltantes = [c for c in REQUIRED if c not in df.columns]
    if faltantes:
        fail(f"columnas faltantes: {faltantes}")
    if len(df) < MIN_FILAS:
        fail(f"muy pocas filas ({len(df)} < {MIN_FILAS})")
    if df[REQUIRED[1:]].isna().any().any():
        fail("nulos en OHLCV: no se predice con datos corruptos")

    data = featurizar(df)
    X = data[FEATURES].values
    # Etiqueta de entrenamiento: dirección del retorno siguiente (solo para la demo;
    # en producción el modelo llega serializado y versionado, no se reentrena aquí).
    y = (data["ret"].shift(-1).fillna(0) > 0).astype(int).values[:-1]
    X_train = X[:-1]

    from sklearn.linear_model import RidgeClassifier

    modelo = RidgeClassifier().fit(X_train, y)
    x_last = X[[-1]]
    pred = int(modelo.predict(x_last)[0])

    print(json.dumps({
        "ok": True,
        "pred": pred,  # 1 = largo, 0 = plano/corto según tu regla
        "mom5": round(float(x_last[0, 5]), 6),
        "filas": len(data),
    }))


if __name__ == "__main__":
    main()
