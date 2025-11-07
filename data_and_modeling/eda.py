# %%
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from colorama import Fore, Style
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