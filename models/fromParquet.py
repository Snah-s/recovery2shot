import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

PARQUET_PATH = os.path.join(
    BASE_DIR,
    "..",
    "data", "source", "events_all_37_90.parquet"
)
PARQUET_PATH = os.path.abspath(PARQUET_PATH)

OUTPUT_DIR = os.path.join(BASE_DIR, "source")
os.makedirs(OUTPUT_DIR, exist_ok=True)

OUTPUT_CSV = os.path.join(OUTPUT_DIR, "events_all_37_90.csv")

print("Leyendo:", PARQUET_PATH)
df = pd.read_parquet(PARQUET_PATH)

print("Guardando CSV en:", OUTPUT_CSV)
df.to_csv(OUTPUT_CSV, index=False)

print("Archivo convertido correctamente.")
