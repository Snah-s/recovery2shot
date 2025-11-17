# Recovery2Shot

**Analytical Model to Assess Loss Risk and Opportunity After Recovery in Football**

Recovery2Shot is a comprehensive advanced football analytics project that allows **estimating the risk of the opponent generating a shot within the next 15 seconds after a loss**, as well as **analyzing the probability of your team producing a shot after recovering possession**.

The system combines **statistical modeling, machine learning, event-based data processing**, and an **interactive dashboard** to visualize heat maps, critical zones, and automatic tactical recommendations based on the model results.

---

## Key Features

### 1. Predictive Models

The project includes two main models:

#### **Model A — Loss Risk (Loss-to-Shot Model)**

Predicts the probability of the opponent generating a shot within ≤15 seconds after your team loses possession.

#### **Model B — Recovery to Shot (Recovery-to-Shot Model)**

Predicts the probability of your team generating a shot within ≤15 seconds after recovering possession.

Both models are built with:

* StatsBomb events (WSL 2021)
* Spatial features based on a 12x8 grid
* First *K* events of the possession (K_LOOKBACK)
* Categorical, numerical variables and event flags
* Binary target defined by configurable time window

---

### 2. Interactive Dashboard (Next.js 16 + TurboPack)

![alt text](images/image.png)

The dashboard allows:

* Selecting **own team** and **opponent team**
* Switching between *loss model* and *recovery model*
* Visualizing:

  * Match average risk
  * Highest risk zone
  * Lowest risk zone
  * 120x80 field heat map
  * Most dangerous zones (Top-N)
  * Safest zones with lowest probability

It also generates **automatic recommendations**:

* Defensive adjustments
* Offensive adjustments
* Key movements by sectors (defense - midfield - key players)

---

## Model Logic

### 1. Possession Definition

Possession is defined by:

* `team` changes → new possession
* **First K field events** are taken to characterize the start

### 2. Target Definitions

#### **Losses → opponent shot**

```
y_shot = 1 if the opponent takes a shot within T seconds from the loss
```

#### **Recoveries → own shot**

```
y_shot = 1 if your team generates a shot within T seconds from the recovery
```

Configurable time window (`TIME_WINDOW_S = 15` by default).

### 3. Created Features

* Normalized coordinates
* 12x8 zone (`zone_id = f"{xb}_{yb}"`)
* Temporal sequence of events (lookback)
* Event categorical variables (play_pattern, pass_type, duel_type…)
* Flags (under_pressure, counterpress)
* Numerical variables (pass_length, pass_angle)
* Aggregated spatial indicators

---

## Dashboard Visualizations

### Risk Heat Map

120x80 field representation with estimated probability by zone.

### Key Metrics

* **Average Risk**
* **Analyzed Zones**
* **Highest Risk Zone**
* **Lowest Risk Zone**

### High Risk Zones

Shows zones with highest shot probability (p_model).

### Defensive and Offensive Recommendations

Automatically generated based on:

* Dangerous zone location
* Team role
* Spatial context (right / left / center)
* Risk intensity

---

## How to Run the Project

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Build datasets

```bash
python data_and_modeling/build_dataset_loss.py
python data_and_modeling/build_dataset_recovery.py
```

### 3. Train models

```bash
python data_and_modeling/train_modelo1.py
python data_and_modeling/train_modelo2.py
```

### 4. Start backend

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Start frontend

```bash
cd frontend
npm install -g pnpm   # only once
pnpm install
pnpm run dev
```

---

## 🛠️ Technologies Used

### Backend / Data

* Python 3.10
* pandas, numpy
* scikit-learn
* pyarrow
* StatsBomb event data

### Frontend

* Next.js 16 (Turbopack)
* React
* TailwindCSS
* Recharts