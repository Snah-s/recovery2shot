# Bitácora Eda

## Primera parte: Análisis general del dataset

Se cargan las librerías necesarias y el dataset a analizar.

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
```

Vamos a analizar el dataset `events_all_wsl2021.parquet` cargado previamente en un DataFrame de pandas.

```python
df = pd.read_parquet('data/events_all_wsl2021.parquet')
```

El dataset contiene información detallada sobre eventos en partidos de fútbol, incluyendo pases, tiros, faltas, entre otros de la liga Barclays Women's Super League 2020/2021. Contiene los eventos de los 121 partidos jugados en esa temporada.

```python
df.shape
```

```output
(443304, 116)
```

Tenemos 443,304 filas y 116 columnas en total.

Ahora necesitamos un resumen de las columnas del DataFrame, incluyendo el tipo de dato, la cantidad de valores únicos y la cantidad de valores faltantes en cada columna.

```python
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
```

A continuación, se presenta un resumen de las columnas del DataFrame, incluyendo el tipo de dato, la cantidad de valores únicos y la cantidad de valores faltantes en cada columna.

| Column | Type | Unique values | Missing values |
|---|---:|---:|---:|
| 50_50 | object | 5 | 443110 |
| ball_receipt_outcome | object | 1 | 421569 |
| ball_recovery_recovery_failure | object | 1 | 441927 |
| block_deflection | object | 1 | 443168 |
| block_offensive | object | 1 | 443201 |
| carry_end_location | object | 87902 | 348937 |
| clearance_aerial_won | object | 1 | 442201 |
| clearance_body_part | object | 4 | 436383 |
| clearance_head | object | 1 | 440085 |
| clearance_left_foot | object | 1 | 442013 |
| clearance_right_foot | object | 1 | 440955 |
| counterpress | object | 1 | 427786 |
| dribble_nutmeg | object | 1 | 443079 |
| dribble_outcome | object | 2 | 438559 |
| dribble_overrun | object | 1 | 443029 |
| duel_outcome | object | 5 | 437923 |
| duel_type | object | 2 | 434359 |
| duration | float64 | 243381 | 112383 |
| foul_committed_advantage | object | 1 | 443069 |
| foul_committed_card | object | 3 | 443038 |
| foul_won_advantage | object | 1 | 443074 |
| foul_won_defensive | object | 1 | 442559 |
| goalkeeper_body_part | object | 7 | 442364 |
| goalkeeper_end_location | object | 1409 | 441235 |
| goalkeeper_outcome | object | 16 | 441434 |
| goalkeeper_position | object | 3 | 440048 |
| goalkeeper_technique | object | 2 | 442105 |
| goalkeeper_type | object | 13 | 439365 |
| id | object | 443304 | 0 |
| index | int64 | 4152 | 0 |
| interception_outcome | object | 5 | 439781 |
| location | object | 256131 | 3222 |
| match_id | int64 | 131 | 0 |
| minute | int64 | 103 | 0 |
| off_camera | object | 1 | 440658 |
| out | object | 1 | 438828 |
| pass_aerial_won | object | 1 | 441264 |
| pass_angle | float64 | 72610 | 321922 |
| pass_assisted_shot_id | object | 2214 | 441090 |
| pass_body_part | object | 7 | 331323 |
| pass_cross | object | 1 | 440429 |
| pass_cut_back | object | 1 | 443008 |
| pass_deflected | object | 1 | 443163 |
| pass_end_location | object | 110828 | 321922 |
| pass_goal_assist | object | 1 | 443050 |
| pass_height | object | 3 | 321922 |
| pass_inswinging | object | 1 | 442692 |
| pass_length | float64 | 38166 | 321922 |
| pass_outcome | object | 5 | 412570 |
| pass_recipient | object | 272 | 330921 |
| pass_recipient_id | float64 | 272 | 330921 |
| pass_shot_assist | object | 1 | 441344 |
| pass_switch | object | 1 | 440642 |
| pass_technique | object | 4 | 441634 |
| pass_through_ball | object | 1 | 442669 |
| pass_type | object | 7 | 415653 |
| period | int64 | 2 | 0 |
| play_pattern | object | 9 | 0 |
| player | object | 272 | 1926 |
| player_id | float64 | 272 | 1926 |
| position | object | 24 | 1926 |
| possession | int64 | 244 | 0 |
| possession_team | object | 12 | 0 |
| possession_team_id | int64 | 12 | 0 |
| related_events | object | 404962 | 20790 |
| second | int64 | 60 | 0 |
| shot_aerial_won | object | 1 | 443010 |
| shot_body_part | object | 4 | 440056 |
| shot_deflected | object | 1 | 443274 |
| shot_end_location | object | 3094 | 440056 |
| shot_first_time | object | 1 | 442192 |
| shot_freeze_frame | object | 3220 | 440085 |
| shot_key_pass_id | object | 2214 | 441090 |
| shot_one_on_one | object | 1 | 443161 |
| shot_outcome | object | 8 | 440056 |
| shot_statsbomb_xg | float64 | 3211 | 440056 |
| shot_technique | object | 7 | 440056 |
| shot_type | object | 4 | 440056 |
| substitution_outcome | object | 2 | 442459 |
| substitution_outcome_id | float64 | 2 | 442459 |
| substitution_replacement | object | 213 | 442459 |
| substitution_replacement_id | float64 | 213 | 442459 |
| tactics | object | 472 | 442818 |
| team | object | 12 | 0 |
| team_id | int64 | 12 | 0 |
| timestamp | object | 286396 | 0 |
| type | object | 33 | 0 |
| under_pressure | object | 1 | 348461 |
| clearance_other | object | 1 | 443242 |
| foul_committed_offensive | object | 1 | 443232 |
| foul_committed_type | object | 4 | 443146 |
| injury_stoppage_in_chain | object | 1 | 443167 |
| miscontrol_aerial_won | object | 1 | 443177 |
| dribble_no_touch | object | 1 | 443286 |
| goalkeeper_shot_saved_off_target | object | 1 | 443266 |
| pass_outswinging | object | 1 | 443018 |
| pass_straight | object | 1 | 443167 |
| shot_open_goal | object | 1 | 443264 |
| shot_saved_off_target | object | 1 | 443266 |
| ball_recovery_offensive | object | 1 | 443271 |
| block_save_block | object | 1 | 443277 |
| pass_miscommunication | object | 1 | 443240 |
| pass_no_touch | object | 1 | 443221 |
| foul_committed_penalty | object | 1 | 443268 |
| foul_won_penalty | object | 1 | 443278 |
| goalkeeper_success_in_play | object | 1 | 443298 |
| goalkeeper_punched_out | object | 1 | 443269 |
| bad_behaviour_card | object | 3 | 443285 |
| half_start_late_video_start | object | 1 | 443300 |
| goalkeeper_shot_saved_to_post | object | 1 | 443294 |
| shot_saved_to_post | object | 1 | 443295 |
| shot_redirect | object | 1 | 443296 |
| goalkeeper_saved_to_post | object | 1 | 443303 |
| shot_follows_dribble | object | 1 | 443300 |
| goalkeeper_lost_in_play | object | 1 | 443303 |
| goalkeeper_lost_out | object | 1 | 443303 |

Podemos observar que muchas columnas tienen una gran cantidad de valores faltantes, lo cual es común en datasets deportivos debido a la naturaleza específica de ciertos eventos. Por ejemplo, columnas relacionadas con tiros tendrán muchos valores faltantes para eventos que no son tiros.
Además, algunas columnas tienen un número limitado de valores únicos, lo que indica que son categóricas o binarias, mientras que otras tienen una amplia variedad de valores, lo que sugiere que son numéricas o de texto libre.
