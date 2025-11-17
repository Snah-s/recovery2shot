// ─────────────────────────────────────────────
// Tipos para elementos de comparación
// ─────────────────────────────────────────────

export interface ZonaComparada {
  zona: string;
  probabilidad_equipo_a: number;
  probabilidad_equipo_b: number;
  observaciones: string;
}

export interface ContrasteTactico {
  aspecto: string;
  equipo_a: string;
  equipo_b: string;
  observaciones: string;
}

// ─────────────────────────────────────────────
// Recomendaciones estratégicas
// ─────────────────────────────────────────────

export interface RecommendationStrategy {
  para_equipo_a: string[];
  para_equipo_b: string[];
}

// ─────────────────────────────────────────────
// Estructura interna principal
// ─────────────────────────────────────────────

export interface ComparisonData {
  patrones_comunes: ZonaComparada[];
  zonas_donde_se_anulan: ZonaComparada[];
  ventajas_equipo_a: ZonaComparada[];
  ventajas_equipo_b: ZonaComparada[];
  contrastes_tácticos: ContrasteTactico[];
  recomendaciones_estratégicas: RecommendationStrategy;
}

// ─────────────────────────────────────────────
// Estructura raíz (JSON completo)
// ─────────────────────────────────────────────

export interface ComparisonJSON {
  comparación: ComparisonData;
}
