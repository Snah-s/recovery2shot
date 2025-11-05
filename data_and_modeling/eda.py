# %%
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from colorama import Fore, Style
# %%
df = pd.read_parquet('data/events_all_wsl2021.parquet')
df.head()
# %%
df.shape
# %%
df.describe()
# %%
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