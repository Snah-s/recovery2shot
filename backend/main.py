from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict
from services.risk_service import predict_risk, team_zone_risk
from services.ai_service import GPTTacticalService
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import json
import re
import os

# ==============================
# CONFIGURACIÓN DEL SERVIDOR
# ==============================
app = FastAPI(
    title="Football Recovery Risk API",
    description="Predice el riesgo de que una pérdida derive en un tiro rival en ≤15s",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gpt_service = GPTTacticalService()

# === Carga del dataset una sola vez ===

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Ruta absoluta hacia models/source/
SOURCE_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "models", "source"))

# Construcción del nombre del archivo
MODEL_VARIANTS = {
    "turnover": {
        "dataset": "train_outfield_K8_T15s.csv",
        "description": "Modelo basado en pérdidas (transformData1/trainModel1)",
    },
    "recovery": {
        "dataset": "train_recoveries_K8_T15s.csv",
        "description": "Modelo basado en recuperaciones (transformData2/trainModel2)",
    },
}

DEFAULT_MODEL_TYPE = "turnover"

TEAMS_PATH = os.path.join(BASE_DIR, "data", "teams_map.csv")
teams_map = pd.read_csv(TEAMS_PATH).set_index("team_id")["team_name"].to_dict()

dataframes: dict[str, pd.DataFrame | None] = {}
for key, config in MODEL_VARIANTS.items():
    csv_path = os.path.join(SOURCE_DIR, config["dataset"])
    if os.path.exists(csv_path):
        dataframes[key] = pd.read_csv(csv_path)
    else:
        dataframes[key] = None


def _normalize_model_type(model_type: str) -> str:
    mt = (model_type or "").strip().lower() or DEFAULT_MODEL_TYPE
    if mt not in MODEL_VARIANTS:
        raise HTTPException(status_code=400, detail=f"Modelo '{model_type}' no soportado")
    return mt


def _get_dataset(model_type: str) -> pd.DataFrame:
    df = dataframes.get(model_type)
    if df is None:
        dataset_name = MODEL_VARIANTS[model_type]["dataset"]
        raise HTTPException(
            status_code=500,
            detail=(
                f"El dataset '{dataset_name}' no está disponible en el servidor. "
                "Genera los datos con transformData2.py o colócalos en models/source/."
            ),
        )
    return df

# ==============================
#  SCHEMA DE ENTRADA /predict_risk
# ==============================
class RiskInput(BaseModel):
    ax: float
    ay: float
    zx: int
    zy: int
    a_minute: float
    period: int
    team_id: int
    zone_id: str
    pass_length: float | None = -1
    pass_angle: float | None = -1
    a_type: str | None = "Missing"
    play_pattern: str | None = "Missing"
    pass_height: str | None = "Missing"
    pass_type: str | None = "Missing"
    pass_outcome: str | None = "Missing"
    dribble_outcome: str | None = "Missing"
    duel_type: str | None = "Missing"
    duel_outcome: str | None = "Missing"
    under_pressure: int | None = 0
    counterpress: int | None = 0
    dribble_overrun: int | None = 0
    dribble_no_touch: int | None = 0
    pass_cross: int | None = 0
    pass_cut_back: int | None = 0
    pass_switch: int | None = 0
    pass_through_ball: int | None = 0
    pass_straight: int | None = 0
    model_type: str = DEFAULT_MODEL_TYPE


class ModelOutput(BaseModel):
    data: dict
    
class ComparisonInput(BaseModel):
    equipo_a: Dict
    equipo_b: Dict




# ==============================
#         ENDPOINTS
# ==============================

@app.post("/tactical-recommendations")
def tactical_recommendations(payload: ModelOutput):
    raw_text = gpt_service.generate_tactical_recommendations(payload.data)

    # 1. Quitar bloque de markdown ```json ... ```
    cleaned = re.sub(r"```json|```", "", raw_text).strip()

    # 2. Intentar convertir a JSON
    try:
        parsed_json = json.loads(cleaned)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500, detail="La respuesta del modelo no contiene JSON válido."
        )

    print(parsed_json)
    # 3. Retornar JSON limpio
    return {"recommendations": parsed_json}

@app.post("/compare-teams")
def compare_teams(payload: ComparisonInput):
    print( "payload team",payload.equipo_a, payload.equipo_b)
    raw_text = gpt_service.generate_comparison_analysis(
        payload.equipo_a, 
        payload.equipo_b
    )

    # 1) Remover ```json ... ```
    cleaned = re.sub(r"```json|```", "", raw_text).strip()
    

    # 2) Intentar parsear JSON
    try:
        parsed_json = json.loads(cleaned)
    except json.JSONDecodeError as e:
        print("⛔ ERROR JSON:", cleaned)
        raise HTTPException(
            status_code=500,
            detail="La respuesta del modelo no contiene JSON válido."
        )

    # 3) Retornar JSON limpio
    print("comparison",parsed_json)
    return {"comparison": parsed_json}


@app.post("/predict_risk")
def predict_single(event: RiskInput):
    """
    Predice la probabilidad de que una pérdida (evento)
    termine en tiro rival en ≤15s.
    """
    model_type = _normalize_model_type(event.model_type)
    payload = event.dict()
    payload.pop("model_type", None)
    prob = predict_risk(payload, model_type)
    return {"predicted_risk": prob, "model_type": model_type}


@app.get("/team_risk_map/{team_id}")
def team_risk_map(team_id: int, model_type: str = DEFAULT_MODEL_TYPE):
    """
    Devuelve el mapa de riesgo medio por zonas (12x8) para el equipo solicitado.
    Usa el dataset local del backend (no requiere subir archivo).
    """
    model_variant = _normalize_model_type(model_type)
    df = _get_dataset(model_variant)
    risk_df = team_zone_risk(df, team_id, model_key=model_variant)
    team_name = teams_map.get(team_id, f"Equipo {team_id}")
    return {
        "team_id": team_id,
        "team_name": team_name,
        "zones": risk_df.to_dict(orient="records"),
        "model_type": model_variant,
    }


@app.get("/teams")
def get_all_teams(model_type: str = DEFAULT_MODEL_TYPE):
    """
    Devuelve todos los equipos únicos con su cantidad de eventos.
    """
    model_variant = _normalize_model_type(model_type)
    df = _get_dataset(model_variant)
    team_counts = (
        df.groupby("team_id")
        .size()
        .reset_index(name="events")
        .sort_values("team_id")
    )
    team_counts["team_name"] = (
        team_counts["team_id"].map(teams_map).fillna("Desconocido")
    )

    return team_counts.to_dict(orient="records")


@app.get("/team_summary/{team_id}")
def team_summary(team_id: int, model_type: str = DEFAULT_MODEL_TYPE):
    """
    Devuelve un resumen táctico del equipo:
    - Riesgo promedio
    - Zonas de alto y bajo riesgo
    - Recomendación principal
    """
    model_variant = _normalize_model_type(model_type)
    df = _get_dataset(model_variant)
    risk_df = team_zone_risk(df, team_id, model_key=model_variant)
    if risk_df.empty:
        return {"error": "No hay datos para este equipo"}

    avg_risk = risk_df["p_model"].mean()
    top_zones = risk_df.nlargest(2, "p_model")[["zone_id", "p_model", "zx", "zy"]]
    safe_zones = risk_df.nsmallest(1, "p_model")[["zone_id", "p_model", "zx", "zy"]]

    recommendation = (
        f"Mayor peligro al recuperar en zona {top_zones.iloc[0]['zone_id']}. "
        f"Sugerir presión en salida y cobertura defensiva reforzada en estas áreas."
    )

    return {
        "team_id": team_id,
        "team_name": f"Equipo {team_id}",
        "average_risk": round(avg_risk, 4),
        "high_risk_zones": top_zones.to_dict(orient="records"),
        "safe_zones": safe_zones.to_dict(orient="records"),
        "main_recommendation": recommendation,
    }
