import pandas as pd, numpy as np, re, os

#Config
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "source", "events_all_37_90.csv")
TIME_WINDOW_S = 15      # ventana para el target (tiro rival tras pérdida)
XBINS, YBINS   = 12, 8  # grilla 12x8 (campo 120x80)
BACK_LOOK      = 6      # rescate de coords dentro de posesión si faltan
K_LOOKBACK     = 8      # <-- # de últimos eventos de CAMPO por posesión para ampliar dataset

# Features cortas y robustas (si no existen, se ignoran)
NUMERIC_KEEP = ["pass_length","pass_angle"]
CAT_KEEP     = ["play_pattern","pass_height","pass_type","pass_outcome",
                "dribble_outcome","duel_type","duel_outcome"]
FLAG_KEEP    = ["under_pressure","counterpress","dribble_overrun","dribble_no_touch",
                "pass_cross","pass_cut_back","pass_switch","pass_through_ball","pass_straight"]

# ---------- 1) Cargar + ordenar ----------
df = pd.read_csv(DATA_PATH, low_memory=False)
df = df.sort_values(["match_id","period","index"], kind="mergesort").reset_index(drop=True)

# tipos y tiempo absoluto
for c in ["match_id","period","team_id","possession","possession_team_id","player_id","index"]:
  if c in df.columns:
    df[c] = pd.to_numeric(df[c], errors="coerce")
df["minute"] = pd.to_numeric(df["minute"], errors="coerce")
df["second"] = pd.to_numeric(df["second"], errors="coerce")
df["t"] = df["minute"]*60 + df["second"]

# ---------- 2) Coordenadas robustas ----------
float_re = re.compile(r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?")
def parse_xy(val):
  if isinstance(val,(list,tuple)) and len(val)>=2: return float(val[0]), float(val[1])
  if isinstance(val,str):
    nums = float_re.findall(val)
    if len(nums)>=2:
      try: return float(nums[0]), float(nums[1])
      except: return (np.nan,np.nan)
  return (np.nan,np.nan)

if "x" not in df.columns or "y" not in df.columns:
  xy = df.get("location", pd.Series([None]*len(df))).apply(parse_xy)
  df["x"] = [a for a,b in xy]; df["y"] = [b for a,b in xy]

# ---------- 3) Quitar porteras/os para ubicar pérdida ----------
pos_str = df.get("position", pd.Series(index=df.index, dtype="object")).astype(str).str.lower()
df["is_gk_event"]  = pos_str.str.contains("goalkeeper", na=False)
is_gk_by_player = df.groupby("player_id")["is_gk_event"].max().rename("is_gk_player")
df["is_gk_player"] = df["player_id"].map(is_gk_by_player).fillna(False)
df["is_gk"] = df["is_gk_event"] | df["is_gk_player"]

# borrar todas las columnas de portería de una vez
df = df.drop(columns=[c for c in df.columns if c.startswith("goalkeeper_")], errors="ignore")

# ---------- 4) Resumen por posesión + último evento de CAMPO ----------
gpos = df.groupby(["match_id","period","possession"], sort=False, observed=True)

pos_core = gpos.agg(
    end_index=("index","max"),
    end_time=("t","max"),
    pos_team=("possession_team_id","first")
).reset_index()

def last_outfield_with_xy(gr):
  out = gr[~gr["is_gk"]].sort_values("index")
  if out.empty:
    return pd.Series({"idx_outfield": np.nan, "loss_x": np.nan, "loss_y": np.nan, "end_minute_evt": np.nan})
  tail = out.tail(BACK_LOOK).iloc[::-1]  # final -> atrás
  idx_used = np.nan; lx = ly = np.nan
  for _, r in tail.iterrows():
    if pd.notna(r.get("x")) and pd.notna(r.get("y")):
      lx, ly = float(r["x"]), float(r["y"]); idx_used = r["index"]; break
  if np.isnan(idx_used):  # sin coords, usa igualmente el último idx de campo
    idx_used = float(out["index"].iloc[-1])
  end_minute_evt = out[out["index"]==idx_used]["minute"].iloc[-1] if not np.isnan(idx_used) else np.nan
  return pd.Series({"idx_outfield": idx_used, "loss_x": lx, "loss_y": ly, "end_minute_evt": end_minute_evt})

pos_out = gpos.apply(last_outfield_with_xy).reset_index()
pos_tbl = pos_core.merge(pos_out, on=["match_id","period","possession"], how="left")

# ---------- 5) Pérdidas (cambio de equipo) ----------
pos_tbl = pos_tbl.sort_values(["match_id","period","possession"], kind="mergesort")
pos_tbl["next_pos_team"] = pos_tbl.groupby(["match_id","period"])["pos_team"].shift(-1)
turn = pos_tbl[(pos_tbl["next_pos_team"].notna()) &
               (pos_tbl["next_pos_team"] != pos_tbl["pos_team"])].copy()

# ---------- 6) Primer tiro rival tras la pérdida ----------
shots = df[df["type"].eq("Shot")][["match_id","period","team_id","t"]].rename(
    columns={"team_id":"shot_team_id","t":"t_shot"}
)

def first_opp_shot(gt, gs):
  if gt.empty: return gt.assign(t_shot=np.nan, shot_team_id=np.nan)
  if gs.empty: return gt.assign(t_shot=np.nan, shot_team_id=np.nan)
  gt = gt.sort_values("end_time", kind="mergesort").reset_index(drop=True)
  gs = gs.sort_values("t_shot",   kind="mergesort").reset_index(drop=True)
  t0  = gt["end_time"].to_numpy()
  tm0 = pd.to_numeric(gt["pos_team"], errors="coerce").to_numpy()
  tS  = gs["t_shot"].to_numpy()
  tmS = pd.to_numeric(gs["shot_team_id"], errors="coerce").to_numpy()
  idx = np.searchsorted(tS, t0, side="left")
  out_t = np.full(len(gt), np.nan); out_tm = np.full(len(gt), np.nan)
  for i in range(len(gt)):
    j = idx[i]
    while j < len(tS) and (tmS[j] == tm0[i] or np.isnan(tmS[j])): j += 1
    if j < len(tS): out_t[i], out_tm[i] = tS[j], tmS[j]
  return gt.assign(t_shot=out_t, shot_team_id=out_tm)

res = []
for key, gt in turn.groupby(["match_id","period"], sort=False):
  gs = shots[(shots["match_id"]==key[0]) & (shots["period"]==key[1])]
  res.append(first_opp_shot(gt, gs))
losses = pd.concat(res, ignore_index=True) if res else pd.DataFrame(columns=list(turn.columns)+["t_shot","shot_team_id"])
losses["dt"] = losses["t_shot"] - losses["end_time"]
losses["y_shot"] = ((losses["dt"] >= 0) & (losses["dt"] <= TIME_WINDOW_S)).astype(int)

# ---------- 7) Ampliación K_LOOKBACK: últimos K eventos de CAMPO por posesión ----------
# Tomamos del DF original sólo eventos de CAMPO (no GK) por cada posesión.
cols_for_anchor = ["match_id","period","possession","index","team_id","t","minute","x","y","type"] \
                  + [c for c in NUMERIC_KEEP if c in df.columns] \
                  + [c for c in CAT_KEEP     if c in df.columns] \
                  + [c for c in FLAG_KEEP    if c in df.columns]
outfield = df[~df["is_gk"]][cols_for_anchor].copy()

anchors = []
for (mid, per, pos), g in outfield.groupby(["match_id","period","possession"], sort=False):
  g = g.sort_values("index")
  tail = g.tail(K_LOOKBACK)              # <= K últimos toques de CAMPO
  if tail.empty:
      continue
  anchors.append(tail.assign(match_id=mid, period=per, possession=pos))

anchors = pd.concat(anchors, ignore_index=True) if anchors else pd.DataFrame(columns=cols_for_anchor)

# Unimos anchors con la tabla de pérdidas para saber si ESA posesión terminó en pérdida y su etiqueta y_shot
anchor_tbl = anchors.merge(
  losses[["match_id","period","possession","y_shot"]],
  on=["match_id","period","possession"], how="inner"  # sólo posesiones que terminan en pérdida
)

# ---------- 8) Construcción de features del anchor (punto candidato) ----------
# coords del anchor
anchor_tbl = anchor_tbl.rename(columns={"x":"ax","y":"ay","minute":"a_minute","type":"a_type"})
xbins = np.linspace(0,120, XBINS+1); ybins = np.linspace(0,80, YBINS+1)
anchor_tbl["zx"] = pd.cut(anchor_tbl["ax"], xbins, labels=False, include_lowest=True)
anchor_tbl["zy"] = pd.cut(anchor_tbl["ay"], ybins, labels=False, include_lowest=True)
anchor_tbl["zone_id"] = anchor_tbl["zx"].astype("Int64").astype(str) + "_" + anchor_tbl["zy"].astype("Int64").astype(str)

# ---------- 9) Selección final de columnas + RELLENO de NaNs (¡para que el CSV no tenga NaNs!) ----------
final_cols = [
  "match_id","period","possession","team_id",
  "ax","ay","zx","zy","zone_id","a_minute","a_type","y_shot"
]
final_cols += [c for c in NUMERIC_KEEP if c in anchor_tbl.columns]
final_cols += [c for c in CAT_KEEP     if c in anchor_tbl.columns]
final_cols += [c for c in FLAG_KEEP    if c in anchor_tbl.columns]
df_train = anchor_tbl[final_cols].copy()

# rellenar para que no queden NaNs visibles en el CSV:
#   num -> -1, cat -> 'Missing', flags ya son 0/1 (si hubiera NaN, a 0)
num_cols = ["ax","ay","zx","zy","a_minute"] + [c for c in NUMERIC_KEEP if c in df_train.columns]
for c in num_cols:
  df_train[c] = pd.to_numeric(df_train[c], errors="coerce").fillna(-1)

for c in [c for c in CAT_KEEP + ["a_type"] if c in df_train.columns]:
  df_train[c] = df_train[c].astype(str)
  df_train.loc[df_train[c].isin(["nan","None","NaN"]) | df_train[c].isna(), c] = "Missing"

for c in [c for c in FLAG_KEEP if c in df_train.columns]:
  df_train[c] = pd.to_numeric(df_train[c], errors="coerce").fillna(0).astype(int)

df_train["y_shot"] = df_train["y_shot"].astype(int)

print("Filas (pérdidas):", len(losses), " | K_LOOKBACK:", K_LOOKBACK, " => filas finales esperadas ≈", len(losses)*K_LOOKBACK)
print("Filas finales reales:", len(df_train), " | Positivas:", int(df_train["y_shot"].sum()))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "source")
os.makedirs(OUTPUT_DIR, exist_ok=True)

out_csv_name = f"train_outfield_K{K_LOOKBACK}_T{TIME_WINDOW_S}s.csv"
out_csv_path = os.path.join(OUTPUT_DIR, out_csv_name)
df_train.to_csv(out_csv_path, index=False)

print("Guardado en:", out_csv_path)