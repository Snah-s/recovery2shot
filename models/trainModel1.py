import pandas as pd
import numpy as np

from sklearn.model_selection import GroupKFold, train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score, average_precision_score
from sklearn.utils.class_weight import compute_class_weight
import joblib
import os

# === 1) Cargar datos ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "source", "train_outfield_K8_T15s.csv")

df = pd.read_csv(DATA_PATH)   # <-- ajusta al nombre real

# --- Features: num / cat / flags (todas robustas) ---
num = [c for c in ["ax","ay","zx","zy","a_minute","period","pass_length","pass_angle"] if c in df.columns]
cat = [c for c in ["a_type","play_pattern","pass_height","pass_type","pass_outcome",
                   "dribble_outcome","duel_type","duel_outcome","zone_id","team_id"] if c in df.columns]
binf= [c for c in ["under_pressure","counterpress","dribble_overrun","dribble_no_touch",
                   "pass_cross","pass_cut_back","pass_switch","pass_through_ball","pass_straight"] if c in df.columns]

# Target y grupos (para CV por partido)
y = df["y_shot"].astype(int).values
groups = df["match_id"].values if "match_id" in df.columns else np.arange(len(df))

# === 2) Preprocesador ===
pre = ColumnTransformer([
    ("num", SimpleImputer(strategy="median"), num),
    ("cat", Pipeline([
        ("imp", SimpleImputer(strategy="most_frequent")),
        ("ohe", OneHotEncoder(handle_unknown="ignore"))
    ]), cat),
    ("bin", SimpleImputer(strategy="constant", fill_value=0), binf)
], remainder="drop")

# === 3) Clasificador con pesos (clase positiva es rara) ===
classes = np.array([0,1])
cw = compute_class_weight(class_weight="balanced", classes=classes, y=y)
class_weight = {0: float(cw[0]), 1: float(cw[1])}

clf = Pipeline([
    ("prep", pre),
    ("mdl", RandomForestClassifier(
        n_estimators=500,
        max_depth=None,
        min_samples_leaf=2,
        n_jobs=-1,
        class_weight=class_weight,
        random_state=7
    ))
])

# === 4) Validación cruzada por partido ===
gkf = GroupKFold(n_splits=5)
aucs, aps = [], []
for tr, te in gkf.split(df, y, groups):
    clf.fit(df.iloc[tr][num+cat+binf], y[tr])
    p = clf.predict_proba(df.iloc[te][num+cat+binf])[:,1]
    aucs.append(roc_auc_score(y[te], p))
    aps.append(average_precision_score(y[te], p))

print(f"CV (GroupKFold, 5 folds)  AUC: {np.mean(aucs):.3f} ± {np.std(aucs):.3f} | AP: {np.mean(aps):.3f} ± {np.std(aps):.3f}")

# === 5) Entrenar modelo final y guardar ===
X = df[num+cat+binf]
clf.fit(X, y)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "joblib")
os.makedirs(OUTPUT_DIR, exist_ok=True)

model_name = "risk_model_rf.joblib"
model_path = os.path.join(OUTPUT_DIR, model_name)

joblib.dump(clf, model_path)
print("Modelo guardado en:", model_path)