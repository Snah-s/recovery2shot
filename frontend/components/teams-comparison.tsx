"use client";

import React from "react";
import {
  Card,
  CardBody,
  Chip,
  CircularProgress,
  CardFooter,
} from "@heroui/react";
import {
  GitCompareArrows,
  ArrowRightLeft,
  Sparkles,
  Sword,
  Shield,
} from "lucide-react";
import {
  ComparisonJSON,
  ZonaComparada,
  ContrasteTactico,
} from "@/entities/Comparison";

export default function TeamsComparison({
  comparison,
  team_name_a,
  team_name_b,
}: {
  comparison: ComparisonJSON | null;
  team_name_a: string;
  team_name_b: string;
}) {
  if (!comparison) {
    return (
      <div className="text-muted-foreground text-base py-4 text-center">
        Generating comparison...
      </div>
    );
  }

  const c = comparison.comparación;

  return (
    <div className="space-y-8 mt-8">
      {/* TÍTULO */}
      <header className="text-center">
        <h2 className="text-3xl text-white tracking-wide flex items-center justify-center gap-3">
          <GitCompareArrows className="w-7 h-7 text-cyan-300" />
          Tactical Comparison: <strong>{team_name_a}</strong> vs{" "}
          <strong>{team_name_b}</strong>
        </h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ===================== PATRONES COMUNES ===================== */}
        <ComparisonSection
          title="Shared Patterns"
          color="cyan"
          icon={<Sparkles className="w-5 h-5 text-cyan-200" />}
        >
          <ZonaList
            items={c.patrones_comunes}
            emptyText="No shared patterns identified."
            team_name_a={team_name_a}
            team_name_b={team_name_b}
          />
        </ComparisonSection>

        {/* ===================== ZONAS DONDE SE ANULAN ===================== */}
        <ComparisonSection
          title="Zones Where They Neutralize Each Other"
          color="yellow"
          icon={<ArrowRightLeft className="w-5 h-5 text-yellow-200" />}
        >
          <ZonaList
            items={c.zonas_donde_se_anulan}
            emptyText="No zones where the teams neutralize each other."
            team_name_a={team_name_a}
            team_name_b={team_name_b}
          />
        </ComparisonSection>

        {/* ===================== VENTAJAS A ===================== */}
        <ComparisonSection
          title="Advantages Team A"
          color="green"
          icon={<Sword className="w-5 h-5 text-green-200" />}
        >
          <ZonaList
            items={c.ventajas_equipo_a}
            emptyText="No clear advantages identified."
            team_name_a={team_name_a}
            team_name_b={team_name_b}
          />
        </ComparisonSection>

        {/* ===================== VENTAJAS B ===================== */}
        <ComparisonSection
          title="Advantages Team B"
          color="red"
          icon={<Shield className="w-5 h-5 text-red-200" />}
        >
          <ZonaList
            items={c.ventajas_equipo_b}
            emptyText="No clear advantages identified."
            team_name_a={team_name_a}
            team_name_b={team_name_b}
          />
        </ComparisonSection>
      </div>

      {/* ===================== CONTRASTES + RECOMENDACIONES ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ComparisonSection
          title="Tactical Contrasts"
          color="purple"
          icon={<GitCompareArrows className="w-5 h-5 text-purple-200" />}
        >
          <ContrasteList
            items={c.contrastes_tácticos}
            emptyText="No strong contrasts identified."
            team_name_a={team_name_a}
            team_name_b={team_name_b}
          />
        </ComparisonSection>

        <ComparisonSection
          title="Strategic Recommendations"
          color="blue"
          icon={<Sparkles className="w-5 h-5 text-blue-200" />}
        >
          <StrategyBlock
            title="For Team A"
            items={c.recomendaciones_estratégicas.para_equipo_a}
            chipColor="bg-blue-400/20 text-blue-200 border-blue-300/40"
          />
        </ComparisonSection>
      </div>
    </div>
  );
}

/* ======================================================
              SECCIÓN ENVOLVENTE (GRADIENT + GLASS)
====================================================== */

function ComparisonSection({ title, icon, color, children }: any) {
  const colorMap: any = {
    cyan: "from-cyan-500/20 to-cyan-700/20 border-cyan-300/40",
    yellow: "from-yellow-400/20 to-yellow-600/20 border-yellow-300/40",
    green: "from-green-500/20 to-green-700/20 border-green-300/40",
    red: "from-red-500/20 to-red-700/20 border-red-300/40",
    purple: "from-purple-500/20 to-purple-700/20 border-purple-300/40",
    blue: "from-blue-500/20 to-blue-700/20 border-blue-300/40",
  };

  return (
    <div
      className={`
      rounded-xl border ${colorMap[color]}
      bg-gradient-to-br shadow-lg shadow-black/30
      backdrop-blur-md transition hover:scale-[1.01]
    `}
    >
      <Card className="bg-transparent border-none shadow-none text-white">
        <CardBody className="space-y-4 p-5">
          <header className="flex items-center gap-3 pb-1 border-b border-white/10 mb-2">
            {icon}
            <h4 className="text-lg font-semibold tracking-wide">{title}</h4>
          </header>
          <div>{children}</div>
        </CardBody>
      </Card>
    </div>
  );
}

/* ======================================================
          LISTA DE ZONAS (OBJETOS ZonaComparada)
====================================================== */

/* ======================================================
     LISTA DE ZONAS (OBJETOS ZonaComparada) + CIRCULAR PROGRESS
====================================================== */

function ZonaList({
  items,
  emptyText,
  team_name_a,
  team_name_b,
}: {
  items: ZonaComparada[];
  emptyText: string;
  team_name_a: string;
  team_name_b: string;
}) {
  if (!items || items.length === 0) {
    return <p className="text-white/60 text-base">{emptyText}</p>;
  }

  // función de color dinámico → para cada porcentaje
  const getColor = (value: number) => {
    if (value > 50) return "red"; // peligro alto
    if (value > 12) return "yellow"; // medio
    return "green"; // bajo / seguro
  };

  const colorMap: Record<string, string> = {
    red: "stroke-red-500 text-red-400",
    yellow: "stroke-yellow-400 text-yellow-300",
    green: "stroke-green-400 text-green-300",
  };

  return (
    <ul className="space-y-4">
      {items.map((z, i) => {
        const aPercent = z.probabilidad_equipo_a * 100;
        const bPercent = z.probabilidad_equipo_b * 100;

        const colorA = colorMap[getColor(aPercent)];
        const colorB = colorMap[getColor(bPercent)];

        return (
          <li
            key={i}
            className="p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md text-white shadow-md"
          >
            {/* Etiqueta de zona */}
            <Chip className="text-xs bg-white/20 border-white/30 text-white mb-3">
              {z.zona}
            </Chip>

            {/* ============================
                  ROW A vs B
            ============================ */}
            <div className="flex flex-row items-center justify-between gap-6 pb-3 border-b border-white/20">
              {/* Equipo A */}
              <Card className="bg-transparent border-none shadow-none text-white flex-1">
                <CardBody className="flex flex-col justify-center items-center p-0">
                  <CircularProgress
                    aria-label={`Team ${team_name_a} ${aPercent.toFixed(1)}%`}
                    value={aPercent}
                    showValueLabel={true}
                    strokeWidth={4}
                    classNames={{
                      svg: "w-20 h-20 drop-shadow-md",
                      indicator: colorA.split(" ")[0],
                      track: "stroke-white/20",
                      value: `text-xl font-semibold ${colorA.split(" ")[1]}`,
                    }}
                  />
                </CardBody>
                <CardFooter className="flex justify-center items-center pt-1">
                  <Chip
                    classNames={{
                      base: "border-white/30",
                      content: `${
                        colorA.split(" ")[1]
                      } text-base font-semibold`,
                    }}
                    variant="bordered"
                  >
                    {team_name_a}
                  </Chip>
                </CardFooter>
              </Card>

              {/* Equipo B */}
              <Card className="bg-transparent border-none shadow-none text-white flex-1">
                <CardBody className="flex flex-col justify-center items-center p-0">
                  <CircularProgress
                    aria-label={`Team ${team_name_b} ${bPercent.toFixed(1)}%`}
                    value={bPercent}
                    showValueLabel={true}
                    strokeWidth={4}
                    classNames={{
                      svg: "w-20 h-20 drop-shadow-md",
                      indicator: colorB.split(" ")[0],
                      track: "stroke-white/20",
                      value: `text-xl font-semibold ${colorB.split(" ")[1]}`,
                    }}
                  />
                </CardBody>
                <CardFooter className="flex justify-center items-center pt-1">
                  <Chip
                    classNames={{
                      base: "border-white/30",
                      content: `${
                        colorB.split(" ")[1]
                      } text-base font-semibold`,
                    }}
                    variant="bordered"
                  >
                    {team_name_b}
                  </Chip>
                </CardFooter>
              </Card>
            </div>

            {/* Observaciones */}
            {z.observaciones && (
              <p className="text-base text-white/80 mt-3 leading-snug">
                {z.observaciones}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ======================================================
         LISTA DE CONTRASTES (OBJETOS ContrasteTactico)
====================================================== */

function ContrasteList({
  items,
  emptyText,
  team_name_a,
  team_name_b,
}: {
  items: ContrasteTactico[];
  emptyText: string;
  team_name_a: string;
  team_name_b: string;
}) {
  if (!items || items.length === 0) {
    return <p className="text-white/60 text-base">{emptyText}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((c, i) => (
        <li
          key={i}
          className="p-3 rounded-md bg-white/10 border border-white/20 text-white/90 text-base backdrop-blur-md"
        >
          <Chip className="text-xs bg-purple-500/30 border-purple-300/40 text-purple-200 mb-2">
            {c.aspecto}
          </Chip>

          <div className="grid grid-cols-2 gap-6">
            <section className="p-4 bg-white/10 rounded-md backdrop-blur-md text-center text-base flex flex-col items-center mb-1">
              <span className="font-semibold text-blue-300">{team_name_a}</span>
              {c.equipo_a}
            </section>

            <section className="p-4 bg-white/10 rounded-md backdrop-blur-md px-4 text-center text-base flex flex-col items-center mb-1">
              <span className="font-semibold text-red-300">{team_name_b}</span>
              {c.equipo_b}
            </section>
          </div>

          <section className=" mt-6 p-4 bg-white/10 rounded-md backdrop-blur-md text-center text-base flex flex-col items-center mb-1">
            {c.observaciones && (
              <p className="text-base text-white/70 mt-2">{c.observaciones}</p>
            )}
          </section>
        </li>
      ))}
    </ul>
  );
}

/* ======================================================
                    STRATEGY BLOCK
====================================================== */

function StrategyBlock({
  title,
  items,
  chipColor,
}: {
  title: string;
  items: string[];
  chipColor: string;
}) {
  return (
    <div className="mb-4">
      {items && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((t, i) => (
            <li
              key={i}
              className="bg-white/10 border border-white/20 p-3 rounded-md text-white/90 text-base backdrop-blur-md"
            >
              {t}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-white/60 text-base">No recommendations.</p>
      )}
    </div>
  );
}
