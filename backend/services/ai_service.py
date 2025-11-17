from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()


class GPTTacticalService:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("BASE_URL"),
        )

        self.model = "gpt-4o-mini"

    def generate_tactical_recommendations(self, model_output: dict):
        
        schema = open("templates/tactical_schema.json").read()
        
        
        prompt = f"""
Quiero que actúes como analista táctico profesional. RESPONDE EN ESPAÑOL.
Aquí están las probabilidades de mi modelo por zona (formato x_y):

{model_output}

Tareas:
1. Interpreta las probabilidades como indicadores de:
- riesgo defensivo
- peligro ofensivo
- zonas de tránsito
- zonas más activas del rival
- fortalezas y debilidades de mi equipo

2. Dame recomendaciones tácticas concretas organizadas en:
- Ajustes defensivos
- Ajustes ofensivos
- Salida de balón / construcción
- Presión (alta, media o baja)
- Movimientos clave por línea o jugador

3. Usa tono profesional y directo, como staff técnico.

4. Si una zona tiene valores muy altos o bajos, explícalo y propón un ajuste específico.

5. Si es pertinente, sugiere:
- cambios de formación
- ajustes de roles
- comportamientos del bloque
- transiciones
- coberturas y basculaciones

Formato: claro, ordenado y **en JSON limpio**.
que tenga este formato tu respuesta
{schema}
"""

        response = self.client.chat.completions.create(
            model=self.model, messages=[{"role": "user", "content": prompt}]
        )

        return response.choices[0].message.content
    
    
    def generate_comparison_analysis(self, equipo_a: dict, equipo_b: dict):

        team_a_name = equipo_a.get("team_name", "Equipo A")
        team_b_name = equipo_b.get("team_name", "Equipo B")

        schema = """
{
  "comparación": {
    "patrones_comunes": [
      {
        "zona": "",
        "probabilidad_equipo_a": 0,
        "probabilidad_equipo_b": 0,
        "observaciones": ""
      }
    ],
    "zonas_donde_se_anulan": [
      {
        "zona": "",
        "probabilidad_equipo_a": 0,
        "probabilidad_equipo_b": 0,
        "observaciones": ""
      }
    ],
    "ventajas_equipo_a": [
      {
        "zona": "",
        "probabilidad_equipo_a": 0,
        "probabilidad_equipo_b": 0,
        "observaciones": ""
      }
    ],
    "ventajas_equipo_b": [
      {
        "zona": "",
        "probabilidad_equipo_a": 0,
        "probabilidad_equipo_b": 0,
        "observaciones": ""
      }
    ],
    "contrastes_tácticos": [
      {
        "aspecto": "",
        "equipo_a": "",
        "equipo_b": "",
        "observaciones": ""
      }
    ],
    "recomendaciones_estratégicas": {
      "para_equipo_a": [""],
      "para_equipo_b": [""]
    }
  }
}
""".strip()

        prompt = f"""


Quiero que actúes como analista táctico profesional. RESPONDE EN ESPAÑOL.

Los equipos comparados son:

🔵 Equipo A = **{team_a_name}**
🔴 Equipo B = **{team_b_name}**

Aquí están sus mapas de probabilidad:

EQUIPO A — {team_a_name}:
{equipo_a["zonas"]}

EQUIPO B — {team_b_name}:
{equipo_b["zonas"]}


===========================================================
🧠 **INTERPRETACIÓN DE ZONAS (OBLIGATORIO)**

Cada zona viene como "x_y", pero en el JSON FINAL el campo `"zona"` 
**NO debe contener "2_2", "4_5", etc.**

En su lugar, DEBE incluir una descripción táctica humana según las reglas:

- y = 0–1 → zona defensiva / salida
- y = 2–3 → mediocampo
- y = 4–5 → tres cuartos / creación
- y = 6–7 → ofensiva / área rival

Carriles:
- x = 0–3 → carril izquierdo
- x = 4–7 → carril central
- x = 8–11 → carril derecho

Ejemplos correctos:
- "zona ofensiva derecha (10_6)"
- "mediocampo central (2_2)"
- "zona defensiva izquierda (1_1)"

❗ **EN EL JSON FINAL, el campo `"zona"` DEBE contener la descripción táctica + el ID entre paréntesis.**
===========================================================


👉 IMPORTANTE:
El JSON final debe conservar las claves originales (`equipo_a`, `equipo_b`),
pero en texto usa siempre los nombres reales: "{team_a_name}" y "{team_b_name}".

Tu tarea:

1. Patrones comunes  
2. Zonas donde se anulan  
3. Ventajas comparativas  
4. Contrastes tácticos  
5. Recomendaciones estratégicas personalizadas

Devuelve la respuesta **en JSON limpio**, usando exactamente este esquema:



{schema}
"""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.choices[0].message.content