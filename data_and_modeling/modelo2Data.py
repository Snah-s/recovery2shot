# %%
import pandas as pd, numpy as np, re, ast

DATA_PATH = "data/events_all_wsl2021.parquet"   # o parquet si prefieres
TIME_WINDOW_S = 15
XBINS, YBINS = 12, 8
# %%
df = pd.read_parquet(DATA_PATH)
df = df.sort_values(["match_id","period","index"], kind="mergesort").reset_index(drop=True)
# %%
# tipos básicos
for c in ["match_id","period","team_id","possession","possession_team_id","player_id","index"]:
  if c in df.columns:
    df[c] = pd.to_numeric(df[c], errors="coerce")

df["minute"] = pd.to_numeric(df["minute"], errors="coerce")
df["second"] = pd.to_numeric(df["second"], errors="coerce")
df["t"] = df["minute"]*60 + df["second"]
# %%
float_re = re.compile(r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?")

def parse_xy(val):
    # 1) numpy array / lista / tupla: caso más común en tu parquet
    if isinstance(val, (list, tuple, np.ndarray)):
        if len(val) >= 2:
            try:
                return float(val[0]), float(val[1])
            except Exception:
                return (np.nan, np.nan)

    # 2) diccionario {'x': 65, 'y': 40} por si acaso
    if isinstance(val, dict):
        if "x" in val and "y" in val:
            try:
                return float(val["x"]), float(val["y"])
            except Exception:
                return (np.nan, np.nan)

    # 3) string: '[61.0, 40.1]' o similar
    if isinstance(val, str):
        try:
            parsed = ast.literal_eval(val)
            if isinstance(parsed, (list, tuple, np.ndarray)) and len(parsed) >= 2:
                return float(parsed[0]), float(parsed[1])
            if isinstance(parsed, dict) and "x" in parsed and "y" in parsed:
                return float(parsed["x"]), float(parsed["y"])
        except Exception:
            pass

        # fallback regex
        nums = float_re.findall(val)
        if len(nums) >= 2:
            try:
                return float(nums[0]), float(nums[1])
            except Exception:
                return (np.nan, np.nan)

    # 4) nada encaja
    return (np.nan, np.nan)

xy = df.get("location", pd.Series([None]*len(df))).apply(parse_xy)
df["x"] = [a for a,b in xy]
df["y"] = [b for a,b in xy]

# %%
pos_str = df.get("position", pd.Series(index=df.index, dtype="object")).astype(str).str.lower()
df["is_gk_event"]  = pos_str.str.contains("goalkeeper", na=False)
is_gk_by_player = df.groupby("player_id")["is_gk_event"].max().rename("is_gk_player")
df["is_gk_player"] = df["player_id"].map(is_gk_by_player).fillna(False)
df["is_gk"] = df["is_gk_event"] | df["is_gk_player"]

gpos = df.groupby(["match_id","period","possession"], sort=False, observed=True)
# %%
pos_core = gpos.agg(
  start_index=("index","min"),
  start_time=("t","min"),
  pos_team=("possession_team_id","first")
).reset_index()
# %%
# primer evento de CAMPO con coords válidas en la posesión = "recuperación"
def first_outfield_with_xy(gr):
  out = gr[~gr["is_gk"]].sort_values("index")
  if out.empty:
    return pd.Series({"idx_outfield": np.nan, "start_x": np.nan, "start_y": np.nan, "start_minute_evt": np.nan, "a_type": np.nan})
  # tomamos el PRIMER evento de campo con coords
  for _, r in out.iterrows():
    if pd.notna(r.get("x")) and pd.notna(r.get("y")):
      return pd.Series({
        "idx_outfield": r["index"],
        "start_x": float(r["x"]),
        "start_y": float(r["y"]),
        "start_minute_evt": r["minute"],
        "a_type": r["type"]
      })
  # si nadie tiene coords, al menos usamos el primer evento de campo
  r0 = out.iloc[0]
  return pd.Series({
    "idx_outfield": r0["index"],
    "start_x": np.nan,
    "start_y": np.nan,
    "start_minute_evt": r0["minute"],
    "a_type": r0["type"]
  })

pos_start = gpos.apply(first_outfield_with_xy).reset_index()

pos_tbl = pos_core.merge(pos_start, on=["match_id","period","possession"], how="left")
# %%
match_teams = (df.groupby("match_id")["team_id"]
                 .agg(lambda s: sorted(s.dropna().unique().tolist()))
                 .to_dict())

def get_opp_team(row):
  teams = match_teams.get(row["match_id"], [])
  if len(teams) < 2 or pd.isna(row["pos_team"]):
    return np.nan
  for t in teams:
    if t != row["pos_team"]:
      return t
  return np.nan

pos_tbl["opp_team_id"] = pos_tbl.apply(get_opp_team, axis=1)
# %%
shots = df[df["type"].eq("Shot")][["match_id","period","team_id","t"]].rename(
    columns={"team_id":"shot_team_id","t":"t_shot"}
)
# %%
def first_own_shot_after(group_pos, group_shots):
  """Para cada posesión (inicio), primer tiro DEL MISMO EQUIPO tras start_time."""
  if group_pos.empty:
    return group_pos.assign(t_shot=np.nan, shot_team_id=np.nan)
  if group_shots.empty:
    return group_pos.assign(t_shot=np.nan, shot_team_id=np.nan)

  gp = group_pos.sort_values("start_time", kind="mergesort").reset_index(drop=True)
  gs = group_shots.sort_values("t_shot",   kind="mergesort").reset_index(drop=True)

  t0   = gp["start_time"].to_numpy()
  team = pd.to_numeric(gp["pos_team"], errors="coerce").to_numpy()
  tS   = gs["t_shot"].to_numpy()
  tmS  = pd.to_numeric(gs["shot_team_id"], errors="coerce").to_numpy()

  idx = np.searchsorted(tS, t0, side="left")

  out_t = np.full(len(gp), np.nan); out_tm = np.full(len(gp), np.nan)

  for i in range(len(gp)):
    j = idx[i]
    # avanzar hasta encontrar un tiro DEL MISMO equipo que recuperó
    while j < len(tS) and (tmS[j] != team[i] or np.isnan(tmS[j])):
      j += 1
    if j < len(tS):
      out_t[i]  = tS[j]
      out_tm[i] = tmS[j]

  return gp.assign(t_shot=out_t, shot_team_id=out_tm)
# %%
res = []
for key, gp in pos_tbl.groupby(["match_id","period"], sort=False):
  gs = shots[(shots["match_id"]==key[0]) & (shots["period"]==key[1])]
  res.append(first_own_shot_after(gp, gs))

recov_df = pd.concat(res, ignore_index=True) if res else pd.DataFrame(columns=list(pos_tbl.columns)+["t_shot","shot_team_id"])
recov_df["dt"] = recov_df["t_shot"] - recov_df["start_time"]
recov_df["y_shot_for"] = ((recov_df["dt"] >= 0) & (recov_df["dt"] <= TIME_WINDOW_S)).astype(int)
# %%
xbins = np.linspace(0,120, XBINS+1)
ybins = np.linspace(0, 80, YBINS+1)

recov_df["zx"] = pd.cut(recov_df["start_x"], xbins, labels=False, include_lowest=True)
recov_df["zy"] = pd.cut(recov_df["start_y"], ybins, labels=False, include_lowest=True)
recov_df["zone_id"] = recov_df["zx"].astype("Int64").astype(str) + "_" + recov_df["zy"].astype("Int64").astype(str)
# %%
# traemos play_pattern del evento idx_outfield
if "play_pattern" in df.columns:
  recov_df = recov_df.merge(
    df[["match_id","period","possession","index","play_pattern"]],
    left_on=["match_id","period","possession","idx_outfield"],
    right_on=["match_id","period","possession","index"],
    how="left"
  ).drop(columns=["index"])
# %%
final_cols = [
    "match_id","period","possession",
    "pos_team","opp_team_id",
    "start_x","start_y","zx","zy","zone_id","start_minute_evt","a_type",
    "y_shot_for"
]
recov_train = recov_df[final_cols].copy()
# %%
# Limpieza mínima
num_cols = ["start_x","start_y","zx","zy","start_minute_evt","period"]
for c in num_cols:
    recov_train[c] = pd.to_numeric(recov_train[c], errors="coerce")

recov_train = recov_train.dropna(subset=["start_x","start_y","zx","zy"])  # si quieres

recov_train["pos_team"] = recov_train["pos_team"].astype("Int64")
recov_train["opp_team_id"] = recov_train["opp_team_id"].astype("Int64")
# %%
recov_train.to_parquet(f"train_recovery_matchup_T{TIME_WINDOW_S}s.parquet", index=False)
print(recov_train.head())