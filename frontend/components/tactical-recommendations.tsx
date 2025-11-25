"use client";

import { useMemo } from "react";
import {
  Card,
  CardBody,
  CardFooter,
  CircularProgress,
  Chip,
} from "@heroui/react";

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
}: {
  teamData: TeamRiskData;
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
    <div className="space-y-6">
      {/* === Zonas de Alto Riesgo === */}
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {highRiskZones.map((zone) => (
            <RiskCard key={zone.zone_id} zone={zone} />
          ))}
        </div>
      </div>

      {/* === Zonas Seguras === */}
      <div>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
          Safe Zones
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lowRiskZones.map((zone) => (
            <RiskCard key={zone.zone_id} zone={zone} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==============================
   COMPONENTE DE TARJETA DE RIESGO
   ============================== */
function RiskCard({ zone }: { zone: Zone }) {
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
    <Card className="w-full border border-white/10 bg-white/5 backdrop-blur-md text-white transition hover:bg-white/10">
      <CardBody className="justify-center items-center pb-0">
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
      </CardBody>

      <CardFooter className="flex flex-col justify-center items-center pt-1 space-y-1">
        <div className="text-lg font-medium">{zone.zone_id}</div>
        <Chip
          variant="bordered"
          classNames={{
            base: "border-white/30",
            content: `${colorMap[color].split(" ")[1]} text-sm font-semibold`,
          }}
        >
          Risk: {percentage.toFixed(1)}%
        </Chip>
      </CardFooter>
    </Card>
  );
}
