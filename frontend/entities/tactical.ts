export interface ZonaDetalle {
  zona: string;
  probabilidad: number;
  explicación: string;
}

export interface RiesgoDefensivo {
  zonas_alto_riesgo: ZonaDetalle[];
  zonas_bajo_riesgo: ZonaDetalle[];
}

export interface PeligroOfensivo {
  zonas_alto_peligro: ZonaDetalle[];
  zonas_bajo_peligro: ZonaDetalle[];
}

export interface ZonasTransito {
  zonas_clave: ZonaDetalle[];
}

export interface ZonasRival {
  zonas_contrincantes: ZonaDetalle[];
}

export interface FortalezasDebilidades {
  fortalezas: ZonaDetalle[];
  debilidades: ZonaDetalle[];
}

export interface Analisis {
  riesgo_defensivo: RiesgoDefensivo;
  peligro_ofensivo: PeligroOfensivo;
  zonas_de_tránsito: ZonasTransito;
  zonas_activas_del_rival: ZonasRival;
  fortalezas_y_debilidades: FortalezasDebilidades;
}

export interface AjusteDefensivo {
  zona: string;
  acción: string;
}

export interface AjusteOfensivo {
  zona: string;
  acción: string;
}

export interface SalidaBalon {
  estilo: string;
}

export interface Presion {
  nivel: string;
  justificación: string;
}

export interface MovimientoClave {
  [key: string]: {
    zona: string;
    movimiento: string;
  };
}

export interface RecomendacionesTacticas {
  ajustes_defensivos: AjusteDefensivo[];
  ajustes_ofensivos: AjusteOfensivo[];
  salida_de_balón: SalidaBalon;
  presion: Presion;
  movimientos_clave: MovimientoClave;
}

export interface TacticalJSON {
  análisis: Analisis;
  recomendaciones_tácticas: RecomendacionesTacticas;
}
