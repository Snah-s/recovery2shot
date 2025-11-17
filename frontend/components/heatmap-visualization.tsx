"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { Shape } from "plotly.js";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface TeamRiskData {
  team_id: number;
  team_name: string;
  average_risk: number;
  heatmap_data: number[][];
  zones: Array<{
    zone_id: string;
    risk_level: number;
    description: string;
  }>;
}

export default function HeatmapVisualization({
  data,
  highlightZone,
  color,
}: {
  data: TeamRiskData;
  highlightZone?: string | null;
  color: string;
}) {
  // === Tamaño del campo y bins ===
  const xBins = 12;
  const yBins = 8;
  const xScale = 120 / xBins;
  const yScale = 80 / yBins;

  // === Heatmap principal ===
  const plotData = useMemo(() => {
    return [
      {
        z: data.heatmap_data,
        x: Array.from({ length: xBins }, (_, i) => (i + 0.5) * xScale),
        y: Array.from({ length: yBins }, (_, i) => (i + 0.5) * yScale),
        type: "heatmap",
        colorscale: [
          [0, "#0369a1"],
          [0.33, "#06b6d4"],
          [0.66, "#eab308"],
          [1, "#dc2626"],
        ],
        colorbar: {
          title: "Probabilidad<br>de Tiro",
          thickness: 20,
          len: 0.7,
          x: 1.02,
        },
        hovertemplate:
          "Zona: (%{x:.1f}m, %{y:.1f}m)<br>Riesgo: %{z:.2%}<extra></extra>",
        showscale: true,
        zsmooth: "best",
        opacity: 0.9,
      },
    ];
  }, [data.heatmap_data]);

  // === Líneas del campo ===
  const pitchShapes = [
    {
      type: "rect",
      x0: 0,
      y0: 0,
      x1: 120,
      y1: 80,
      line: { color: "white", width: 2 },
    },
    {
      type: "line",
      x0: 60,
      y0: 0,
      x1: 60,
      y1: 80,
      line: { color: "white", width: 2 },
    },
    {
      type: "circle",
      x0: 60 - 9.15,
      y0: 40 - 9.15,
      x1: 60 + 9.15,
      y1: 40 + 9.15,
      line: { color: "white", width: 2 },
    },
    {
      type: "circle",
      x0: 60 - 0.5,
      y0: 40 - 0.5,
      x1: 60 + 0.5,
      y1: 40 + 0.5,
      fillcolor: "white",
      line: { color: "white" },
    },
    {
      type: "rect",
      x0: 0,
      y0: 18,
      x1: 18,
      y1: 62,
      line: { color: "white", width: 2 },
    },
    {
      type: "rect",
      x0: 102,
      y0: 18,
      x1: 120,
      y1: 62,
      line: { color: "white", width: 2 },
    },
    {
      type: "rect",
      x0: 0,
      y0: 30,
      x1: 6,
      y1: 50,
      line: { color: "white", width: 2 },
    },
    {
      type: "rect",
      x0: 114,
      y0: 30,
      x1: 120,
      y1: 50,
      line: { color: "white", width: 2 },
    },
  ];

  // === Cuadrícula (12x8) ===
  const gridLines = [];
  for (let i = 1; i < xBins; i++) {
    const x = i * xScale;
    gridLines.push({
      type: "line",
      x0: x,
      y0: 0,
      x1: x,
      y1: 80,
      line: { color: "rgba(255,255,255,0.2)", width: 1 },
    });
  }
  for (let j = 1; j < yBins; j++) {
    const y = j * yScale;
    gridLines.push({
      type: "line",
      x0: 0,
      y0: y,
      x1: 120,
      y1: y,
      line: { color: "rgba(255,255,255,0.2)", width: 1 },
    });
  }

  // === 🔹 Resaltado dinámico (hover) ===
  const highlightShape = useMemo(() => {
    if (!highlightZone) return null;

    // El zone_id es del tipo "2_2"
    const [xIndex, yIndex] = highlightZone.split("_").map(Number);
    if (isNaN(xIndex) || isNaN(yIndex)) return null;

    const xCenter = (xIndex + 0.5) * xScale;
    const yCenter = (yIndex + 0.5) * yScale;

    const colorDict = {
      "text-success": { hex: "#d1fc35", rgb: "rgba(209, 252, 53, 0.7)" },
      "text-warning": { hex: "#414afa", rgb: "rgba(65, 74, 250, 0.7)" },
    };

    const getColor = (color: string) => {
      return (
        colorDict[color as keyof typeof colorDict] || "rgba(209, 252, 53, 0.7)"
      );
    };

    // 🔸 círculo amarillo para resaltar la zona
    const shape: Partial<Shape> = {
      type: "circle",
      x0: xCenter - xScale / 2.5,
      x1: xCenter + xScale / 2.5,
      y0: yCenter - yScale / 2.5,
      y1: yCenter + yScale / 2.5,
      line: { color: getColor(color).hex, width: 3 },
      fillcolor: getColor(color).rgb,
      opacity: 0.9,
    };

    return shape;
  }, [highlightZone, xScale, yScale]);

  // === Combinar todas las formas ===
  const shapes = [...pitchShapes, ...gridLines];
  if (highlightShape) shapes.push(highlightShape);

  // === Layout general ===
  const layout = {
    title: {
      text: `${data.team_name} - Mapa de Riesgo de Pérdidas`,
      font: { size: 16, color: "var(--foreground)" },
    },
    xaxis: {
      title: "Ancho del Campo (m)",
      showgrid: false,
      zeroline: false,
      range: [0, 120],
      scaleanchor: "y",
    },
    yaxis: {
      title: "Largo del Campo (m)",
      showgrid: false,
      zeroline: false,
      range: [0, 80],
    },
    shapes,
    plot_bgcolor: "#0a0a0a",
    paper_bgcolor: "#0a0a0a",
    font: { color: "white", family: "inherit" },
    margin: { l: 60, r: 60, t: 60, b: 60 },
    height: 550,
  };

  return (
    <div className="w-full overflow-x-auto">
      <Plot
        data={plotData}
        layout={layout}
        config={{ responsive: true, displayModeBar: false }}
      />
    </div>
  );
}
