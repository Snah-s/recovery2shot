"use client";

import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Card, CardBody, CircularProgress, Chip } from "@heroui/react";

import HeatmapVisualization from "./heatmap-visualization";
import TacticalRecommendations from "./tactical-recommendations";
import TacticalRecommendations1 from "./tactical-recommendations1";

interface Zone {
  zone_id: string;
  risk_level: number;
  description: string;
}

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
    return <div className="text-white/40 text-sm">No team data available.</div>;

  return (
    <>
      {/* === FOOTER ESTADÍSTICO === */}
      {teamData && (
        <div className="mt-6 grid grid-cols-1 gap-4">
          {teamData ? (
            <TacticalRecommendations
              teamData={teamData}
              title="Average Risk"
              percent={teamData.average_risk * 100}
            />
          ) : (
            <div className="text-muted-foreground text-sm">
              No tactical data
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-3 gap-6 py-4 mt-8">
        {/* === HEATMAP === */}
        <Card className="col-span-2 h-full w-full border-border/50 shadow-lg">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              Field Heatmap
            </CardTitle>
            <CardDescription>
              Opponent shot probability per zone (120x80 m)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 flex items-center justify-center ">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">Loading data...</div>
              </div>
            ) : teamData ? (
              <HeatmapVisualization
                data={teamData}
                highlightZone={highlightZone}
                color={colorHighLight}
              />
            ) : (
              <div className="text-muted-foreground text-center">No data</div>
            )}
          </CardContent>
        </Card>

        {/* === LADO DERECHO === */}
        <div className="flex flex-col gap-6 col-span-1">
          {/* Recomendaciones tácticas */}
          <Card className="border-border/50 shadow-lg flex-1">
            <CardHeader className="border-b border-border/50 m-0 p-0">
              <CardTitle className="text-lg flex items-center gap-2 m-0 p-0">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                Team Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex  items-center justify-center h-full">
              <div className="w-full grid grid-cols-1 xl:grid-cols-2">
                <StatCard
                  title="Analyzed Zones"
                  value={teamData.zones.length.toString()}
                />
                <StatCard
                  title="Highest-Risk Zone"
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
                  title="Lowest-Risk Zone"
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
      className="border-border/50 h-44 bg-gray-500/5 rounded-2xl my-3 py-6"
      onMouseEnter={() => {
        onHover?.(value);
        setColor?.(color ?? "");
      }}
      onMouseLeave={() => {
        onHover?.(null);
        setColor?.("");
      }}
    >
      <CardHeader className="text-xl font-bold flex items-center justify-center text-center">
        {title}
      </CardHeader>

      <CardContent
        className={`font-bold ${color} w-full flex h-full items-center justify-center text-4xl`}
      >
        {value}
      </CardContent>
    </Card>
  );
}
