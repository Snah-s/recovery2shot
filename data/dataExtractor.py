# %%
from statsbombpy import sb
import pandas as pd
import time
import os

# CONFIG
BASE_DIR = os.path.dirname(os.path.abspath(__file__))   # carpeta donde está este script
SOURCE_DIR = os.path.join(BASE_DIR, "source")          # data/source/
OUT_FILE = os.path.join(SOURCE_DIR, "events_all_37_90.parquet")

os.makedirs(SOURCE_DIR, exist_ok=True)

COMPETITION_ID = 37
SEASON_ID      = 90
SLEEP_BETWEEN  = 1.5

# %%
# listar partidos
matches = sb.matches(COMPETITION_ID, SEASON_ID)
match_ids = matches.match_id.tolist()

print(f"Partidos encontrados: {len(match_ids)}")
all_events = []  # buffer para unificar todo en memoria
# %%
# descargar eventos y guardarlos
for i, match_id in enumerate(match_ids, start=1):
    home = matches.iloc[i-1]["home_team"]
    away = matches.iloc[i-1]["away_team"]

    print(f"[{i}/{len(match_ids)}] {home} vs {away} (match_id={match_id})")

    ok = False
    for attempt in range(1, 4):
        try:
            df = sb.events(match_id=match_id)
            all_events.append(df)
            print(f"   ✅ {len(df)} eventos descargados")
            ok = True
            break
        except Exception as e:
            print(f"Error intento {attempt}: {e}")
            time.sleep(5)

    if not ok:
        print(f"   ❌ No se pudo descargar match_id={match_id}, se continúa.")
    
    time.sleep(SLEEP_BETWEEN)

# %%
# unir todo en un solo archivo
if all_events:
    full_df = pd.concat(all_events, ignore_index=True)
    full_df.to_parquet(OUT_FILE, index=False)
    print(f"\n🎉 Listo. Archivo final guardado: {OUT_FILE}")
    print(f"Total de eventos: {len(full_df)}")
else:
    print("No se descargó ningún evento")
