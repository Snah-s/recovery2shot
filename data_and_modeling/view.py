import joblib
import numpy as np
import pandas as pd
DATA_PATH = "data/events_all_wsl2021.parquet"   # o parquet si prefieres
TIME_WINDOW_S = 15
XBINS, YBINS = 12, 8

# Cargar solo lo necesario (acelera lectura)
events = pd.read_parquet(DATA_PATH, columns=["team_id","team"])

# Limpiar y asegurar tipos
events = events.dropna(subset=["team_id","team"])
events["team_id"] = pd.to_numeric(events["team_id"], errors="coerce").astype("Int64")
events["team"] = events["team"].astype(str).str.strip()

# Mapeo: id → nombre
id2name = (events.groupby("team_id")["team"]
                 .agg(lambda s: s.mode().iat[0] if not s.mode().empty else s.iloc[0])
                 .astype(str)
                 .to_dict())

# Mapeo inverso: nombre (en minúsculas) → id
name2id = {v.lower(): int(k) for k, v in id2name.items()}

print("Equipos disponibles:")
for k, v in id2name.items():
    print(f"{k}: {v}")


df_rec = pd.read_parquet(f"train_recovery_matchup_T{TIME_WINDOW_S}s.parquet")
clf_rec = joblib.load("recovery_matchup_model_rf.joblib")

# ids
# ej: name2id["arsenal wfc".lower()], name2id["chelsea fcw".lower()]
arsenal_id =  name2id["arsenal wfc".lower()]
chelsea_id =  name2id["chelsea fcw".lower()]

num = ["start_x","start_y","zx","zy","start_minute_evt","period"]
cat = [c for c in ["a_type","play_pattern","zone_id","pos_team","opp_team_id"] if c in df_rec.columns]
feature_cols = num + cat

def matchup_zone_risk(model, data, team_id, opp_id, filter_expr=None):
    d = data.copy()
    if filter_expr:
        d = d.query(filter_expr)
    d = d[(d["pos_team"] == team_id) & (d["opp_team_id"] == opp_id)]
    if d.empty:
        return pd.DataFrame(columns=["zone_id","p_model","n"])
    p = model.predict_proba(d[feature_cols])[:,1]
    t = pd.DataFrame({"zone_id": d["zone_id"].values, "p": p})
    out = (t.groupby("zone_id")
             .agg(p_model=("p","mean"), n=("p","size"))
             .reset_index()
             .sort_values("p_model", ascending=False))
    return out

# Ejemplo: Arsenal recuperando vs Chelsea
zt_ars_vs_che = matchup_zone_risk(clf_rec, df_rec, arsenal_id, chelsea_id)
print(zt_ars_vs_che.head(15))
