# %%
import numpy as np
from sklearn.model_selection import GroupKFold
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score, average_precision_score
from sklearn.utils.class_weight import compute_class_weight
import joblib
import pandas as pd
TIME_WINDOW_S = 15
XBINS, YBINS = 12, 8

df_rec = pd.read_parquet(f"train_recovery_matchup_T{TIME_WINDOW_S}s.parquet")
# %%
num = ["start_x","start_y","zx","zy","start_minute_evt","period"]
cat = ["a_type","play_pattern","zone_id","pos_team","opp_team_id"]
cat = [c for c in cat if c in df_rec.columns]

y = df_rec["y_shot_for"].astype(int).values
groups = df_rec["match_id"].values

# %%
pre = ColumnTransformer([
    ("num", SimpleImputer(strategy="median"), num),
    ("cat", Pipeline([
        ("imp", SimpleImputer(strategy="most_frequent")),
        ("ohe", OneHotEncoder(handle_unknown="ignore"))
    ]), cat),
], remainder="drop")

classes = np.array([0,1])
cw = compute_class_weight(class_weight="balanced", classes=classes, y=y)
class_weight = {0: float(cw[0]), 1: float(cw[1])}
# %%
clf_rec = Pipeline([
    ("prep", pre),
    ("mdl", RandomForestClassifier(
        n_estimators=400,
        max_depth=None,
        min_samples_leaf=2,
        n_jobs=-1,
        class_weight=class_weight,
        random_state=7
    ))
])

gkf = GroupKFold(n_splits=5)
aucs, aps = [], []
feature_cols = num + cat
# %%
for tr, te in gkf.split(df_rec, y, groups):
    clf_rec.fit(df_rec.iloc[tr][feature_cols], y[tr])
    p = clf_rec.predict_proba(df_rec.iloc[te][feature_cols])[:,1]
    aucs.append(roc_auc_score(y[te], p))
    aps.append(average_precision_score(y[te], p))
# %%
print(f"CV AUC: {np.mean(aucs):.3f} ± {np.std(aucs):.3f} | AP: {np.mean(aps):.3f} ± {np.std(aps):.3f}")

clf_rec.fit(df_rec[feature_cols], y)
joblib.dump(clf_rec, "recovery_matchup_model_rf.joblib")
print("Modelo guardado: recovery_matchup_model_rf.joblib")
