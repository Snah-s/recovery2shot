# %%
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from colorama import Fore, Style
import ast
# %%
df = pd.read_parquet('data/events_all_wsl2021.parquet')
# %%
# Mostramos información básica de cada columna
for col in df.columns:
  s = df[col]
  dtype = s.dtype
  missing = s.isnull().sum()
  
  try:
    unique_vals = s.nunique()
  except TypeError:
    unique_vals = s.astype(str).nunique()
  
  print(
    f'{Fore.GREEN}Column:{Style.RESET_ALL} {col}, '
    f'{Fore.GREEN}Type:{Style.RESET_ALL} {dtype}, '
    f'{Fore.GREEN}Unique values:{Style.RESET_ALL} {unique_vals}, '
    f'{Fore.GREEN}Missing values:{Style.RESET_ALL} {missing}'
  )
# %%
# Vemos todos los valores unicos de cada columna si y solo si el numero de valores unicos es menor a 35
for col in df.columns:
  s = df[col]
  try:
    unique_vals = s.nunique()
  except TypeError:
    unique_vals = s.astype(str).nunique()
  
  if unique_vals < 35:
    print(f'{Fore.GREEN}Column:{Style.RESET_ALL} {col}, {Fore.GREEN}Unique values:{Style.RESET_ALL} {unique_vals}')
    try:
      print(s.unique())
    except TypeError:
      print(s.astype(str).unique())
    print('\n')
  else:
    print(f'{Fore.GREEN}Column:{Style.RESET_ALL} {col}, {Fore.GREEN}Unique values:{Style.RESET_ALL} {unique_vals}')
    print('Lee el titulo')
# %%
# columnas tipo flag: unique values <=2 y uno de ellos es True
flag_cols = []
for col in df.columns:
  s = df[col].dropna()
  try:
    unique_count = int(s.nunique())
  except Exception:
    unique_count = int(s.astype(str).nunique())

  if unique_count <= 2:
    try:
      vals = s.unique()
    except Exception:
      vals = pd.unique(s.astype(str))

    has_true = any((v is True) or (str(v).lower() == 'true') for v in vals)
    if has_true:
      flag_cols.append(col)
# %%
# Convertimos las columnas tipo flag a boolean
df[flag_cols] = df[flag_cols].astype(bool)
# %%
# Columnas de coordenadas geográficas

def parse_xy(cell):
  try:
    if pd.isna(cell):
      return pd.Series({'x': None, 'y': None})
  except Exception:
    pass

  if isinstance(cell, (list, tuple, np.ndarray)):
    try:
      return pd.Series({'x': cell[0], 'y': cell[1]})
    except Exception:
      return pd.Series({'x': None, 'y': None})

  if isinstance(cell, str):
    try:
      arr = ast.literal_eval(cell)
      if isinstance(arr, (list, tuple, np.ndarray)) and len(arr) >= 2:
        return pd.Series({'x': arr[0], 'y': arr[1]})
    except Exception:
      pass

  return pd.Series({'x': None, 'y': None})


df[['location_x', 'location_y']] = df['location'].apply(parse_xy)
df[['pass_end_x', 'pass_end_y']] = df['pass_end_location'].apply(parse_xy)
df[['shot_end_x', 'shot_end_y']] = df['shot_end_location'].apply(parse_xy)
# %%
event_counts = df['type'].value_counts().sort_values(ascending=False)
# %%
event_pct = (event_counts / len(df) * 100).round(2)
event_summary = pd.DataFrame({
    'eventos': event_counts,
    'porcentaje': event_pct
})
event_summary.head(10)
# %%
passes = df[df['type'] == 'Pass'].copy()

passes['is_completed'] = passes['pass_outcome'].isna()  # en StatsBomb, NaN = completado
team_pass_stats = passes.groupby('team').agg(
    pases_totales=('id', 'count'),
    pases_completos=('is_completed', 'sum')
).reset_index()
team_pass_stats['precision'] = team_pass_stats['pases_completos'] / team_pass_stats['pases_totales']

team_pass_stats.sort_values('pases_totales', ascending=False)
# %%
shots = df[df['type'] == 'Shot'].copy()

team_shot_stats = shots.groupby('team').agg(
    tiros=('id', 'count'),
    goles=('shot_outcome', lambda x: (x == 'Goal').sum()),
    xg_total=('shot_statsbomb_xg', 'sum')
).reset_index()

team_shot_stats['xg_por_tiro'] = team_shot_stats['xg_total'] / team_shot_stats['tiros']

team_shot_stats.sort_values('xg_total', ascending=False)
# %%
df1 = pd.read_parquet('train_recovery_matchup_T15s.parquet')
df1.head()