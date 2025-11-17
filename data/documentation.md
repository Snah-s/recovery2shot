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

El dataset contiene información detallada sobre eventos en partidos de fútbol, incluyendo pases, tiros, faltas, entre otros de la liga Barclays Women's Super League 2020/2021. Contiene los eventos de los 131 partidos jugados en esa temporada.

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

Los valores de cada columna son:

1. Column: `50_50`, values: [`'Lost'`, `'Won'`, `'Success To Opposition'`, `'Success To Team'`, None]
2. Column: `ball_receipt_outcome`, values: [None, `'Incomplete'`]
3. Column: `ball_recovery_recovery_failure`, values: [None, True]
4. Column: `block_deflection`, values: [None, True]
5. Column: `block_offensive`, values: [None, True]
6. Column: `carry_end_location`, values: `"Location coordinates"`
7. Column: `clearance_aerial_won`, values: [None, True]
8. Column: `clearance_body_part`, values: [None, `'Head'`, `'Right Foot'`, `'Left Foot'`, `'Other'`]
9. Column: `clearance_head`, values: [None, True]
10. Column: `clearance_left_foot`, values: [None, True]
11. Column: `clearance_right_foot`, values: [None, True]
12. Column: `counterpress`, values: [None, True]
13. Column: `dribble_nutmeg`, values: [None, True]
14. Column: `dribble_outcome`, values: [None, `'Incomplete'`, `'Complete'`]
15. Column: `dribble_overrun`, values: [None, True]
16. Column: `duel_outcome`, values: [None, `'Won'`, `'Success In Play'`, `'Lost Out'`, `'Lost In Play'`, `'Success Out'`]
17. Column: `duel_type`, values: [None, `'Aerial Lost'`, `'Tackle'`]
18. Column: `duration`, values: `"Time of the event"`
19. Column: `foul_committed_advantage`, values: [None, True]
20. Column: `foul_committed_card`, values: [None, `'Yellow Card'`, `'Second Yellow'`, `'Red Card'`]
21. Column: `foul_won_advantage`, values: [None, True]
22. Column: `foul_won_defensive`, values: [None, True]
23. Column: `goalkeeper_body_part`, values: [None, `'Both Hands'`, `'Left Foot'`, `'Right Foot'`, `'Chest'`, `'Right Hand'`, `'Left Hand'`, `'Head'`]
24. Column: `goalkeeper_end_location`, values: `"Location coordinates"`
25. Column: `goalkeeper_outcome`, values: [None, `'Success'`, `'Saved Twice'`, `'Touched Out'`, `'No Touch'`, `'Clear'`, `'Claim'`, `'In Play Danger'`, `'In Play Safe'`, `'Touched In'`, `'Fail'`, `'Success In Play'`, `'Punched out'`, `'Collected Twice'`, `'Won'`, `'Lost In Play'`, `'Lost Out'`]
26. Column: `goalkeeper_position`, values: [None, `'Set'`, `'Moving'`, `'Prone'`]
27. Column: `goalkeeper_technique`, values: [None, `'Standing'`, `'Diving'`]
28. Column: `goalkeeper_type`, values: [None, `'Shot Saved'`, `'Shot Faced'`, `'Goal Conceded'`, `'Collected'`, `'Keeper Sweeper'`, `'Punch'`, `'Shot Saved Off Target'`, `'Penalty Conceded'`, `'Smother'`, `'Save'`, `'Shot Saved to Post'`, `'Saved to Post'`, `'Penalty Saved'`]
29. Column: `id`, values: `"Unique event identifier"`
30. Column: `index`, values: `"Row index in the DataFrame"`
31. Column: `interception_outcome`, values: [None, `'Won'`, `'Success In Play'`, `'Lost In Play'`, `'Lost Out'`, `'Success Out'`]
32. Column: `location`, values: `"Location coordinates"`
33. Column: `match_id`, values: `"Unique match identifier"`
34. Column: `minute`, values: [1, 2, 3, ..., 90]
35. Column: `off_camera`, values: [None, True]
36. Column: `out`, values: [None, True]
37. Column: `pass_aerial_won`, values: [None, True]
38. Column: `pass_angle`, values: `"Angle of the pass"`
39. Column: `pass_assisted_shot_id`, values: `"Unique shot identifier for assisted shots"`
40. Column: `pass_body_part`, values: [None, `'Right Foot'`, `'Left Foot'`, `'Head'`, `'Keeper Arm'`, `'Other'`, `'Drop Kick'`, `'No Touch'`]
41. Column: `pass_cross`, values: [None, True]
42. Column: `pass_cut_back`, values: [None, True]
43. Column: `pass_deflected`, values: [None, True]
44. Column: `pass_end_location`, values: `"End location coordinates of the pass"`
45. Column: `pass_goal_assist`, values: [None, True]
46. Column: `pass_height`, values: [None, `'Ground Pass'`, `'High Pass'`, `'Low Pass'`]
47. Column: `pass_inswinging`, values: [None, True]
48. Column: `pass_length`, values: `"Length of the pass"`
49. Column: `pass_outcome`, values: [None, `'Incomplete'`, `'Out'`, `'Pass Offside'`, `'Unknown'`, `'Injury Clearance'`]
50. Column: `pass_recipient`, values: `"Name of the pass recipient"`
51. Column: `pass_recipient_id`, values: `"Unique identifier of the pass recipient"`
52. Column: `pass_shot_assist`, values: [None, True]
53. Column: `pass_switch`, values: [None, True]
54. Column: `pass_technique`, values: [None, `'Inswinging'`, `'Through Ball'`, `'Outswinging'`, `'Straight'`]
55. Column: `pass_through_ball`, values: [None, True]
56. Column: `pass_type`, values: [None, `'Kick Off'`, `'Free Kick'`, `'Recovery'`, `'Throw-in'`, `'Goal Kick'`, `'Corner'`, `'Interception'`]
57. Column: `period`, values: [1, 2]
58. Column: `play_pattern`, values: [`'Regular Play'`, `'From Free Kick'`, `'From Kick Off'`, `'From Throw In'`, `'From Keeper'`, `'From Goal Kick'`, `'From Counter'`, `'From Corner'`, `'Other'`]
59. Column: `player`, values: `"Player name"`
60. Column: `player_id`, values: `"Unique player identifier"`
61. Column: `position`, values: [None, `'Left Wing'`, `'Left Center Back'`, `'Right Defensive Midfield'`, `'Left Back'`, `'Center Forward'`, `'Right Center Back'`, `'Center Attacking Midfield'`, `'Goalkeeper'`, `'Right Back'`, `'Left Center Midfield'`, `'Left Defensive Midfield'`, `'Right Wing'`, `'Center Defensive Midfield'`, `'Right Center Midfield'`, `'Right Center Forward'`, `'Left Center Forward'`, `'Left Midfield'`, `'Right Midfield'`, `'Center Back'`, `'Right Wing Back'`, `'Left Wing Back'`, `'Center Midfield'`, `'Left Attacking Midfield'`, `'Right Attacking Midfield'`]
62. Column: `possession`, values: `"Possession sequence identifier"`
63. Column: `possession_team`, values: [`'Tottenham Hotspur Women'`, `'West Ham United LFC'`, `'Brighton & Hove Albion WFC'`, `'Birmingham City WFC'`, `'Manchester United'`, `'Chelsea FCW'`, `'Arsenal WFC'`, `'Reading WFC'`, `'Aston Villa'`, `'Manchester City WFC'`, `'Bristol City WFC'`, `'Everton LFC'`]
64. Column: `possession_team_id`, values: [749, 972, 965, 969, 1475, 971, 968, 974, 2647, 746, 973, 967]
65. Column: `related_events`, values: `"List of related event identifiers"`
66. Column: `second`, values: `"Second of the event within the minute"`
67. Column: `shot_aerial_won`, values: [None, True]
68. Column: `shot_body_part`, values: [None, `'Left Foot'`, `'Right Foot'`, `'Head'`, `'Other'`]
69. Column: `shot_deflected`, values: [None, True]
70. Column: `shot_end_location`, values: `"End location coordinates of the shot"`
71. Column: `shot_first_time`, values: [None, True]
72. Column: `shot_freeze_frame`, values: `"Freeze-frame data for the shot"`
73. Column: `shot_key_pass_id`, values: `"Unique identifier of the key pass leading to the shot"`
74. Column: `shot_one_on_one`, values: [None, True]
75. Column: `shot_outcome`, values: [None, `'Saved'`, `'Off T'`, `'Post'`, `'Goal'`, `'Blocked'`, `'Wayward'`, `'Saved Off Target'`, `'Saved to Post'`]
76. Column: `shot_statsbomb_xg`, values: `"Expected goals (xG) value of the shot"`
77. Column: `shot_technique`, values: [None, `'Normal'`, `'Half Volley'`, `'Volley'`, `'Overhead Kick'`, `'Diving Header'`, `'Backheel'`, `'Lob'`]
78. Column: `shot_type`, values: [None, `'Open Play'`, `'Free Kick'`, `'Penalty'`, `'Corner'`]
79. Column: `substitution_outcome`, values: [None, `'Tactical'`, `'Injury'`]
80. Column: `substitution_outcome_id`, values: [None, 103.0, 102.0]
81. Column: `substitution_replacement`, values: `"Name of the replacement player"`
82. Column: `substitution_replacement_id`, values: `"Unique identifier of the replacement player"`
83. Column: `tactics`, values: `"Tactical information (formation, lineup, etc.)"`
84. Column: `team`, values: [`'Tottenham Hotspur Women'`, `'West Ham United LFC'`, `'Brighton & Hove Albion WFC'`, `'Birmingham City WFC'`, `'Manchester United'`, `'Chelsea FCW'`, `'Arsenal WFC'`, `'Reading WFC'`, `'Aston Villa'`, `'Manchester City WFC'`, `'Bristol City WFC'`, `'Everton LFC'`]
85. Column: `team_id`, values: [749, 972, 965, 969, 1475, 971, 968, 974, 2647, 746, 973, 967]
86. Column: `timestamp`, values: `"Match clock timestamp of the event"`
87. Column: `type`, values: [`'Starting XI'`, `'Half Start'`, `'Pass'`, `'Ball Receipt*'`, `'Carry'`, `'Duel'`, `'Clearance'`, `'Ball Recovery'`, `'Pressure'`, `'Interception'`, `'Dribbled Past'`, `'Dribble'`, `'Foul Committed'`, `'Foul Won'`, `'Miscontrol'`, `'Block'`, `'Dispossessed'`, `'Shield'`, `'Shot'`, `'Goal Keeper'`, `'50/50'`, `'Injury Stoppage'`, `'Half End'`, `'Substitution'`, `'Error'`, `'Own Goal Against'`, `'Own Goal For'`, `'Tactical Shift'`, `'Referee Ball-Drop'`, `'Offside'`, `'Player Off'`, `'Player On'`, `'Bad Behaviour'`]
88. Column: `under_pressure`, values: [None, True]
89. Column: `clearance_other`, values: [None, True]
90. Column: `foul_committed_offensive`, values: [None, True]
91. Column: `foul_committed_type`, values: [None, `'Handball'`, `'Dangerous Play'`, `'Foul Out'`, `'Dive'`]
92. Column: `injury_stoppage_in_chain`, values: [None, True]
93. Column: `miscontrol_aerial_won`, values: [None, True]
94. Column: `dribble_no_touch`, values: [None, True]
95. Column: `goalkeeper_shot_saved_off_target`, values: [None, True]
96. Column: `pass_outswinging`, values: [None, True]
97. Column: `pass_straight`, values: [None, True]
98. Column: `shot_open_goal`, values: [None, True]
99. Column: `shot_saved_off_target`, values: [None, True]
100. Column: `ball_recovery_offensive`, values: [None, True]
101. Column: `block_save_block`, values: [None, True]
102. Column: `pass_miscommunication`, values: [None, True]
103. Column: `pass_no_touch`, values: [None, True]
104. Column: `foul_committed_penalty`, values: [None, True]
105. Column: `foul_won_penalty`, values: [None, True]
106. Column: `goalkeeper_success_in_play`, values: [None, True]
107. Column: `goalkeeper_punched_out`, values: [None, True]
108. Column: `bad_behaviour_card`, values: [None, `'Second Yellow'`, `'Yellow Card'`, `'Red Card'`]
109. Column: `half_start_late_video_start`, values: [None, True]
110. Column: `goalkeeper_shot_saved_to_post`, values: [None, True]
111. Column: `shot_saved_to_post`, values: [None, True]
112. Column: `shot_redirect`, values: [None, True]
113. Column: `goalkeeper_saved_to_post`, values: [None, True]
114. Column: `shot_follows_dribble`, values: [None, True]
115. Column: `goalkeeper_lost_in_play`, values: [None, True]
116. Column: `goalkeeper_lost_out`, values: [None, True]