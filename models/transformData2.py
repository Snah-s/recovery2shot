import pandas as pd
import numpy as np
import re
import os

#Config 
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "source", "events_all_37_90.csv")
TIME_WINDOW_S = 15      # ventana para el target (tiro propio tras recuperación)
XBINS, YBINS  = 12, 8   # grilla 12x8 (campo 120x80)
K_LOOKBACK    = 8       # nº de primeros eventos de CAMPO por posesión

# Features extra (igual estilo que en tu script de pérdidas)
NUMERIC_KEEP = ["pass_length","pass_angle"]
CAT_KEEP     = ["play_pattern","pass_height","pass_type","pass_outcome",
                "dribble_outcome","duel_type","duel_outcome"]
FLAG_KEEP    = ["under_pressure","counterpress","dribble_overrun","dribble_no_touch",
                "pass_cross","pass_cut_back","pass_switch","pass_through_ball","pass_straight"]

# load
df = pd.read_csv(DATA_PATH,low_memory=False)
df = df.sort_values(["match_id","period","index"], kind="mergesort").reset_index(drop=True)

# tipos y tiempo absoluto
for c in ["match_id","period","team_id","possession","possession_team_id","player_id","index"]:
  if c in df.columns:
    df[c] = pd.to_numeric(df[c], errors="coerce")

df["minute"] = pd.to_numeric(df["minute"], errors="coerce")
df["second"] = pd.to_numeric(df["second"], errors="coerce")
df["t"] = df["minute"]*60 + df["second"]

# coordenadas robustas
float_re = re.compile(r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?")
def parse_xy(val):
  if isinstance(val,(list,tuple)) and len(val)>=2:
    return float(val[0]), float(val[1])
  if isinstance(val,str):
    nums = float_re.findall(val)
    if len(nums)>=2:
      try:
        return float(nums[0]), float(nums[1])
      except:
        return (np.nan,np.nan)
  return (np.nan,np.nan)

if "x" not in df.columns or "y" not in df.columns:
  xy = df.get("location", pd.Series([None]*len(df))).apply(parse_xy)
  df["x"] = [a for a,b in xy]
  df["y"] = [b for a,b in xy]

# identificar porteras/os para quedarnos con eventos de campo
pos_str = df.get("position", pd.Series(index=df.index, dtype="object")).astype(str).str.lower()
df["is_gk_event"]  = pos_str.str.contains("goalkeeper", na=False)
is_gk_by_player = df.groupby("player_id")["is_gk_event"].max().rename("is_gk_player")
df["is_gk_player"] = df["player_id"].map(is_gk_by_player).fillna(False)
df["is_gk"] = df["is_gk_event"] | df["is_gk_player"]

# limpiar columnas específicas de portería si existen
df = df.drop(columns=[c for c in df.columns if c.startswith("goalkeeper_")], errors="ignore")

# resumen por posesión: INICIO de posesión
gpos = df.groupby(["match_id","period","possession"], sort=False, observed=True)

pos_core = gpos.agg(
  start_index=("index","min"),
  start_time=("t","min"),
  pos_team=("possession_team_id","first")
).reset_index()

# definir recuperaciones
# Una recuperación = cambio de equipo respecto a la posesión anterior en mismo partido/periodo
pos_tbl = pos_core.sort_values(["match_id","period","possession"], kind="mergesort")
pos_tbl["prev_pos_team"] = pos_tbl.groupby(["match_id","period"])["pos_team"].shift(1)

recoveries = pos_tbl[(pos_tbl["prev_pos_team"].notna()) &
                     (pos_tbl["prev_pos_team"] != pos_tbl["pos_team"])].copy()

print("Posesiones totales:", len(pos_tbl))
print("Posesiones que empiezan en recuperación (cambio de equipo):", len(recoveries))

# primer TIRO PROPIO tras la recuperación
shots = df[df["type"].eq("Shot")][["match_id","period","team_id","t"]].rename(
  columns={"team_id":"shot_team_id","t":"t_shot"}
)

def first_own_shot_after(gt: pd.DataFrame, gs: pd.DataFrame) -> pd.DataFrame:
  if gt.empty:
      return gt.assign(t_shot=np.nan, shot_team_id=np.nan)
  if gs.empty:
      return gt.assign(t_shot=np.nan, shot_team_id=np.nan)

  gt = gt.sort_values("start_time", kind="mergesort").reset_index(drop=True)
  gs = gs.sort_values("t_shot",   kind="mergesort").reset_index(drop=True)

  t0   = gt["start_time"].to_numpy()
  team = pd.to_numeric(gt["pos_team"], errors="coerce").to_numpy()
  tS   = gs["t_shot"].to_numpy()
  tmS  = pd.to_numeric(gs["shot_team_id"], errors="coerce").to_numpy()

  idx = np.searchsorted(tS, t0, side="left")
  out_t  = np.full(len(gt), np.nan)
  out_tm = np.full(len(gt), np.nan)

  for i in range(len(gt)):
    j = idx[i]
    # buscar PRIMER tiro del MISMO equipo que recuperó
    while j < len(tS) and (tmS[j] != team[i] or np.isnan(tmS[j])):
      j += 1
    if j < len(tS):
      out_t[i]  = tS[j]
      out_tm[i] = tmS[j]

  return gt.assign(t_shot=out_t, shot_team_id=out_tm)

res = []
g_rec = recoveries.groupby(["match_id","period"], sort=False)
gshot = shots.groupby(["match_id","period"], sort=False)

for key, gt in g_rec:
  gs = gshot.get_group(key) if key in gshot.groups else pd.DataFrame(columns=["t_shot","shot_team_id"])
  res.append(first_own_shot_after(gt, gs))

rec_df = pd.concat(res, ignore_index=True) if res else pd.DataFrame(columns=list(recoveries.columns)+["t_shot","shot_team_id"])

rec_df["dt"] = rec_df["t_shot"] - rec_df["start_time"]
rec_df["y_shot"] = ((rec_df["dt"] >= 0) & (rec_df["dt"] <= TIME_WINDOW_S)).astype(int)

print("Recuperaciones etiquetadas:", len(rec_df),
      "| Positivas (tiro propio <= %ds):" % TIME_WINDOW_S, int(rec_df["y_shot"].sum()))

# construir anchors: primeros K eventos de CAMPO de esas posesiones
# columnas base para cada evento "anchor"
cols_for_anchor = ["match_id","period","possession","index","team_id","t","minute","x","y","type"] \
                  + [c for c in NUMERIC_KEEP if c in df.columns] \
                  + [c for c in CAT_KEEP     if c in df.columns] \
                  + [c for c in FLAG_KEEP    if c in df.columns]

outfield = df[~df["is_gk"]][cols_for_anchor].copy()

anchors = []
for (mid, per, pos), g in outfield.groupby(["match_id","period","possession"], sort=False):
  g = g.sort_values("index")
  head = g.head(K_LOOKBACK)       # primeros K eventos de CAMPO
  if head.empty:
      continue
  anchors.append(head)

anchors = pd.concat(anchors, ignore_index=True) if anchors else pd.DataFrame(columns=cols_for_anchor)
print("Anchors totales (todas posesiones, K primeros toques):", len(anchors))

# Unir anchors con info de recuperación y target y_shot
anchor_tbl = anchors.merge(
  rec_df[["match_id","period","possession","y_shot"]],
  on=["match_id","period","possession"],
  how="inner"   # solo posesiones que empiezan tras recuperación
)

print("Anchors tras filtrar a posesiones de recuperación:", len(anchor_tbl))

# construcción de features del anchor
anchor_tbl = anchor_tbl.rename(columns={"x":"ax","y":"ay","minute":"a_minute","type":"a_type"})

# bins espaciales
xbins = np.linspace(0,120, XBINS+1)
ybins = np.linspace(0,80,  YBINS+1)
anchor_tbl["zx"] = pd.cut(anchor_tbl["ax"], xbins, labels=False, include_lowest=True)
anchor_tbl["zy"] = pd.cut(anchor_tbl["ay"], ybins, labels=False, include_lowest=True)
anchor_tbl["zone_id"] = anchor_tbl["zx"].astype("Int64").astype(str) + "_" + anchor_tbl["zy"].astype("Int64").astype(str)

# selección final de columnas + RELLENO de NaNs
final_cols = [
  "match_id","period","possession","team_id",
  "ax","ay","zx","zy","zone_id","a_minute","a_type","y_shot"
]
final_cols += [c for c in NUMERIC_KEEP if c in anchor_tbl.columns]
final_cols += [c for c in CAT_KEEP     if c in anchor_tbl.columns]
final_cols += [c for c in FLAG_KEEP    if c in anchor_tbl.columns]

df_train = anchor_tbl[final_cols].copy()

# rellenar NaNs para que el CSV quede limpio
num_cols = ["ax","ay","zx","zy","a_minute"] + [c for c in NUMERIC_KEEP if c in df_train.columns]
for c in num_cols:
    df_train[c] = pd.to_numeric(df_train[c], errors="coerce").fillna(-1)

for c in [c for c in CAT_KEEP + ["a_type"] if c in df_train.columns]:
    df_train[c] = df_train[c].astype(str)
    df_train.loc[df_train[c].isin(["nan","None","NaN"]) | df_train[c].isna(), c] = "Missing"

for c in [c for c in FLAG_KEEP if c in df_train.columns]:
    df_train[c] = pd.to_numeric(df_train[c], errors="coerce").fillna(0).astype(int)

df_train["y_shot"] = df_train["y_shot"].fillna(0).astype(int)

print("Recuperaciones únicas (posesiones):", len(rec_df))
print("K_LOOKBACK:", K_LOOKBACK,
      "=> filas esperadas ≈", len(rec_df) * K_LOOKBACK)
print("Filas finales reales:", len(df_train),
      "| Positivas:", int(df_train["y_shot"].sum()))

# guardar
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "source")
os.makedirs(OUTPUT_DIR, exist_ok=True)

out_csv_name = f"train_recoveries_K{K_LOOKBACK}_T{TIME_WINDOW_S}s.csv"
out_csv_path = os.path.join(OUTPUT_DIR, out_csv_name)
df_train.to_csv(out_csv_path, index=False)

print("Guardado en:", out_csv_path)