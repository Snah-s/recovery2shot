"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CircularProgress } from "@heroui/react";

import HeatmapVisualization from "./heatmap-visualization";
import TacticalRecommendations from "./tactical-recommendations";
import TacticalRecommendations1 from "./tactical-recommendations1";

export default function TeamPanel({
  typeTeam,
  teamData,
  loading,
  highlightZone,
  setHighlightZone,
  colorHighLight,
  setColorHighLight,
  tacticalAdvice,
}: any) {
  if (!teamData)
    return (
      <div className="text-white/40 text-sm">No hay datos del equipo.</div>
    );

  return (
    <>
      {/* === FOOTER ESTADÍSTICO === */}
      {teamData && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Riesgo Promedio"
            value={`${(teamData.average_risk * 100).toFixed(1)}%`}
            percent={teamData.average_risk * 100}
          />
          <StatCard
            title="Zonas Analizadas"
            value={teamData.zones.length.toString()}
          />
          <StatCard
            title="Zona de Mayor Riesgo"
            value={
              teamData.zones.reduce((max, z) =>
                z.risk_level > max.risk_level ? z : max
              ).zone_id
            }
            color="text-warning"
            onHover={setHighlightZone}
            setColor={setColorHighLight}
          />
          <StatCard
            title="Zona de Menor Riesgo"
            value={
              teamData.zones.reduce((min, z) =>
                z.risk_level < min.risk_level ? z : min
              ).zone_id
            }
            color="text-success"
            onHover={setHighlightZone}
            setColor={setColorHighLight}
          />
        </div>
      )}
      <div className="grid grid-cols-3 gap-6 py-4">
        {/* === LADO IZQUIERDO === */}

        {/* === HEATMAP === */}
        <Card className="col-span-2 h-full w-full border-border/50 shadow-lg">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              Mapa de Calor del Campo
            </CardTitle>
            <CardDescription>
              Probabilidad de tiro rival por zona (120x80 m)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">Cargando datos...</div>
              </div>
            ) : teamData ? (
              <HeatmapVisualization
                data={teamData}
                highlightZone={highlightZone}
                color={colorHighLight}
              />
            ) : (
              <div className="text-muted-foreground text-center">Sin datos</div>
            )}
          </CardContent>
        </Card>

        {/* === LADO DERECHO === */}
        <div className="flex flex-col gap-6">
          {/* Recomendaciones tácticas */}
          <Card className="border-border/50 shadow-lg flex-1">
            <CardHeader className="border-b border-border/50 m-0 p-0">
              <CardTitle className="text-lg flex items-center gap-2 m-0 p-0">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                Zonas de Alto Riesgo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {teamData ? (
                <TacticalRecommendations teamData={teamData} />
              ) : (
                <div className="text-muted-foreground text-sm">
                  Sin datos tácticos
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {typeTeam === "A" && (
        <>
          <div className="my-8 border-1 border-white/20"></div>
          <TacticalRecommendations1 recommendations={tacticalAdvice} />
        </>
      )}
    </>
  );
}

// === COMPONENTE AUXILIAR PARA EL FOOTER ===
function StatCard({
  title,
  value,
  color = "text-foreground",
  onHover,
  setColor,
  percent,
}: {
  title: string;
  value: string;
  color?: string;
  percent?: number;
  onHover?: (zoneId: string | null) => void;
  setColor?: (color: string) => void;
}) {
  // 🎨 Color dinámico según riesgo
  const getColor = (value: number) => {
    if (value > 50) return "red"; // alto riesgo
    if (value > 12) return "yellow"; // riesgo medio
    return "green"; // seguro
  };

  const colors = getColor(percent ?? 0);
  const colorMap: Record<string, string> = {
    red: "stroke-red-500 text-red-400",
    yellow: "stroke-yellow-400 text-yellow-300",
    green: "stroke-green-400 text-green-300",
  };

  return (
    <Card
      className="border-border/50 h-44 bg-gray-500/25"
      onMouseEnter={() => {
        onHover?.(value);
        setColor?.(color ?? "");
      }}
      onMouseLeave={() => {
        onHover?.(null);
        setColor?.("");
      }}
    >
      <CardContent className="flex flex-col items-center">
        <div className="text-sm text-muted-foreground mb-1">{title}</div>
        {percent && (
          <CircularProgress
            aria-label={`Nivel de riesgo ${percent}%`}
            value={percent}
            showValueLabel={true}
            strokeWidth={4}
            classNames={{
              svg: "w-28 h-28 drop-shadow-md",
              indicator: colorMap[colors].split(" ")[0], // stroke color
              track: "stroke-white/20",
              value: `text-2xl font-semibold ${colorMap[colors].split(" ")[1]}`, // text color
            }}
          />
        )}
        {!percent && (
          <div
            className={`font-bold ${color} w-full h-24 flex items-center justify-center text-3xl`}
          >
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
