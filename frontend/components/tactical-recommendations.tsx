"use client";

import { useMemo } from "react";
import {
  Card,
  CardBody,
  CardFooter,
  CircularProgress,
  Chip,
} from "@heroui/react";
import { CardHeader } from "./ui/card";

interface Zone {
  zone_id: string;
  risk_level: number;
  description: string;
}

interface TeamRiskData {
  team_id: number;
  team_name: string;
  average_risk: number;
  heatmap_data: number[][];
  zones: Zone[];
}

export default function TacticalRecommendations({
  teamData,
  title,
  percent,
}: {
  teamData: TeamRiskData;
  title: string;
  percent: number;
}) {
  const highRiskZones = useMemo(
    () =>
      teamData.zones
        .filter((z) => z.risk_level > 0.2)
        .sort((a, b) => b.risk_level - a.risk_level)
        .slice(0, 2),
    [teamData.zones]
  );

  const lowRiskZones = useMemo(
    () =>
      teamData.zones
        .filter((z) => z.risk_level < 0.12)
        .sort((a, b) => a.risk_level - b.risk_level)
        .slice(0, 1),
    [teamData.zones]
  );

  return (
    <div className="space-y-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {/* === Zonas de Alto Riesgo === */}
      <RiskCard2 percent={percent} title={title} />
      {highRiskZones.map((zone) => (
        <RiskCard key={zone.zone_id} zone={zone} title="High-Risk Zones" />
      ))}
      {lowRiskZones.map((zone) => (
        <RiskCard key={zone.zone_id} zone={zone} title="Safe Zones" />
      ))}
    </div>
  );
}

/* ==============================
   COMPONENTE DE TARJETA DE RIESGO
   ============================== */
function RiskCard({ zone, title }: { zone: Zone; title: string }) {
  const percentage = zone.risk_level * 100;

  // 🎨 Color dinámico según riesgo
  const getColor = (value: number) => {
    if (value > 50) return "red"; // alto riesgo
    if (value > 12) return "yellow"; // riesgo medio
    return "green"; // seguro
  };

  const color = getColor(percentage);
  const colorMap: Record<string, string> = {
    red: "stroke-red-500 text-red-400",
    yellow: "stroke-yellow-400 text-yellow-300",
    green: "stroke-green-400 text-green-300",
  };

  return (
    <Card className="border-border/50 m-0 rounded-xl h-44 bg-gray-500/25">
      <CardHeader className="flex items-center justify-center">
        <h3 className="font-semibold text-xl text-foreground mb-0 mt-1 flex items-center gap-2">
          {title}
        </h3>
      </CardHeader>
      <CardBody className="flex flex-row justify-center items-center pb-0">
        <CircularProgress
          aria-label={`Risk level ${percentage.toFixed(1)}%`}
          value={percentage}
          showValueLabel={true}
          strokeWidth={4}
          classNames={{
            svg: "w-28 h-28 drop-shadow-md",
            indicator: colorMap[color].split(" ")[0], // stroke color
            track: "stroke-white/20",
            value: `text-2xl font-semibold ${colorMap[color].split(" ")[1]}`, // text color
          }}
        />
        <div className="flex flex-col justify-center items-center space-y-1">
          <div className="text-xl font-medium">Zone: {zone.zone_id}</div>
          <Chip
            variant="bordered"
            classNames={{
              base: "border-white/30",
              content: `${colorMap[color].split(" ")[1]} text-xl font-semibold`,
            }}
          >
            Risk: {percentage.toFixed(1)}%
          </Chip>
        </div>
      </CardBody>
    </Card>
  );
}

function RiskCard2({ percent, title }: { percent: number; title: string }) {
  // 🎨 Color dinámico según riesgo
  const getColor = (value: number) => {
    if (value > 50) return "red"; // alto riesgo
    if (value > 12) return "yellow"; // riesgo medio
    return "green"; // seguro
  };

  const color = getColor(percent);
  const colorMap: Record<string, string> = {
    red: "stroke-red-500 text-red-400",
    yellow: "stroke-yellow-400 text-yellow-300",
    green: "stroke-green-400 text-green-300",
  };

  return (
    <Card className="border-border/50  rounded-xl h-44 bg-gray-500/25">
      <CardHeader className="flex items-center justify-center">
        <h3 className="font-semibold text-xl text-foreground mb-0 mt-1 flex items-center gap-2">
          {title}
        </h3>
      </CardHeader>
      <CardBody className="flex flex-row justify-center items-center pb-0">
        <CircularProgress
          aria-label={`Risk level ${(percent ?? 0).toFixed(1)}%`}
          value={percent}
          showValueLabel={true}
          strokeWidth={4}
          classNames={{
            svg: "w-28 h-28 drop-shadow-md",
            indicator: colorMap[color].split(" ")[0], // stroke color
            track: "stroke-white/20",
            value: `text-2xl font-semibold ${colorMap[color].split(" ")[1]}`, // text color
          }}
        />
        <div className="flex flex-col justify-center items-center space-y-1">
          <Chip
            variant="bordered"
            classNames={{
              base: "border-white/30",
              content: `${colorMap[color].split(" ")[1]} text-xl font-semibold`,
            }}
          >
            Risk: {(percent ?? 0).toFixed(1)}%
          </Chip>
        </div>
      </CardBody>
    </Card>
  );
}
