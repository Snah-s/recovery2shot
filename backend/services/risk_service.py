import pandas as pd
import numpy as np
import joblib
import os
from typing import Any

# =============================
#   CONFIGURACIÓN Y MODELO
# =============================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))
JOBLIB_DIR = os.path.join(PROJECT_ROOT, "models", "joblib")

MODEL_REGISTRY = {
    # Modelo original entrenado con pérdidas (trainModel1.py / transformData1.py)
    "turnover": os.path.join(JOBLIB_DIR, "risk_model_rf.joblib"),
    # Modelo nuevo entrenado con recuperaciones (trainModel2.py / transformData2.py)
    "recovery": os.path.join(JOBLIB_DIR, "recovery_risk_model_rf.joblib"),
}

_MODEL_CACHE: dict[str, Any] = {}


def _resolve_model_key(model_key: str) -> str:
    key = (model_key or "").strip().lower() or "turnover"
    if key not in MODEL_REGISTRY:
        raise ValueError(f"Modelo '{model_key}' no soportado")
    return key


def _load_model(model_key: str):
    key = _resolve_model_key(model_key)
    if key not in _MODEL_CACHE:
        model_path = MODEL_REGISTRY[key]
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"No se encontró el archivo del modelo en {model_path}"
            )
        _MODEL_CACHE[key] = joblib.load(model_path)
    return _MODEL_CACHE[key]

NUM = ["ax", "ay", "zx", "zy", "a_minute", "period", "pass_length", "pass_angle"]
CAT = [
    "a_type",
    "play_pattern",
    "pass_height",
    "pass_type",
    "pass_outcome",
    "dribble_outcome",
    "duel_type",
    "duel_outcome",
    "zone_id",
    "team_id",
]
BIN = [
    "under_pressure",
    "counterpress",
    "dribble_overrun",
    "dribble_no_touch",
    "pass_cross",
    "pass_cut_back",
    "pass_switch",
    "pass_through_ball",
    "pass_straight",
]
FEATURES = NUM + CAT + BIN


# =============================
#   FUNCIÓN 1: PREDICCIÓN INDIVIDUAL
# =============================
def predict_risk(event: dict, model_key: str = "turnover") -> float:
    """Predice riesgo (0-1) para un solo evento."""
    clf = _load_model(model_key)
    df = pd.DataFrame([event])
    df = df.reindex(columns=FEATURES, fill_value=-1)
    proba = clf.predict_proba(df[FEATURES])[:, 1][0]
    return round(float(proba), 4)


# =============================
#   FUNCIÓN 2: MAPA DE RIESGO POR EQUIPO
# =============================
def team_zone_risk(
        df: pd.DataFrame,
    team_id: int,
    filter_expr: str | None = None,
    model_key: str = "turnover",
) -> pd.DataFrame:
    """Calcula riesgo medio (p_model) y frecuencia (freq) por zona para el equipo."""
    clf = _load_model(model_key)
    d = df.copy()
    if filter_expr:
        d = d.query(filter_expr)

    d = d[d["team_id"] == team_id]
    if d.empty:
        return pd.DataFrame(columns=["zone_id", "zx", "zy", "p_model", "n", "freq"])

    # Completar columnas faltantes
    for c in FEATURES:
        if c not in d.columns:
            d[c] = -1

    # Predicciones
    p = clf.predict_proba(d[FEATURES])[:, 1]
    out = (
        pd.DataFrame({"zone_id": d["zone_id"].values, "p": p})
        .groupby("zone_id", as_index=False)
        .agg(p_model=("p", "mean"), n=("p", "size"))
        .sort_values("p_model", ascending=False)
    )
    out["freq"] = out["n"] / len(d)
    coords = out["zone_id"].str.split("_", expand=True)
    out["zx"] = pd.to_numeric(coords[0], errors="coerce")
    out["zy"] = pd.to_numeric(coords[1], errors="coerce")

    out = out.dropna(subset=["zx", "zy"])
    out["zx"] = out["zx"].astype(int)
    out["zy"] = out["zy"].astype(int)

    return out[["zone_id", "zx", "zy", "p_model", "n", "freq"]]
