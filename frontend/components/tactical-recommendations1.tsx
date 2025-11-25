"use client";

import React from "react";
import { Card, CardBody, Chip } from "@heroui/react";
import {
  Shield,
  Sword,
  Move,
  CornerDownRight,
  MoveUpRight,
} from "lucide-react";
import { TacticalJSON } from "@/entities/tactical";

export default function TacticalRecommendations1({
  recommendations,
}: {
  recommendations: TacticalJSON | null;
}) {
  if (!recommendations) {
    return (
      <div className="text-muted-foreground text-sm py-4 text-center">
        Generando análisis táctico...
      </div>
    );
  }

  const t = recommendations.recomendaciones_tácticas;

  return (
    <div className="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* ----------------- DEFENSIVOS ----------------- */}
      <SectionCard
        title="Ajustes Defensivos"
        icon={<Shield className="w-4 h-4 text-blue-200" />}
        color="blue"
      >
        <DefensiveSection data={t.ajustes_defensivos} />
      </SectionCard>

      {/* ----------------- OFENSIVOS ----------------- */}
      <SectionCard
        title="Ajustes Ofensivos"
        icon={<Sword className="w-4 h-4 text-red-200" />}
        color="red"
      >
        <OffensiveSection data={t.ajustes_ofensivos} />
      </SectionCard>

      {/* ----------------- MOVIMIENTOS ----------------- */}
      <SectionCard
        title="Movimientos Clave"
        icon={<Move className="w-4 h-4 text-purple-200" />}
        color="purple"
      >
        <MovementsSection data={t.movimientos_clave} />
      </SectionCard>
    </div>
  );
}

/* =====================================================
                SECTION WRAPPER
===================================================== */

function SectionCard({ title, icon, children, color }: any) {
  const colorMap: any = {
    blue: "from-blue-500/20 to-blue-700/20 border-blue-400/30",
    red: "from-red-500/20 to-red-700/20 border-red-400/30",
    purple: "from-purple-500/20 to-purple-700/20 border-purple-400/30",
  };

  return (
    <div
      className={`
      rounded-xl border ${colorMap[color]}
      bg-gradient-to-br 
      shadow-lg shadow-black/30 
      backdrop-blur-md 
      transition hover:scale-[1.01]
    `}
    >
      <Card className="bg-transparent border-none shadow-none text-white">
        <CardBody className="space-y-4 p-5">
          <header className="flex items-center gap-3 pb-1 border-b border-white/10">
            {icon}
            <h4 className="text-lg font-semibold tracking-wide">{title}</h4>
          </header>

          <div className="pt-2">{children}</div>
        </CardBody>
      </Card>
    </div>
  );
}

/* =====================================================
                DEFENSIVE SECTION
===================================================== */

function DefensiveSection({ data }: any) {
  if (!data) return null;

  const zonas = data.reforzar_zonas_riesgo || [];

  return (
    <div className="space-y-4">
      {zonas.map((z: any, i: number) => (
        <GlassCard key={i}>
          <Chip className="text-xs bg-blue-500/30 border-blue-300/40 text-blue-100 mb-1">
            Zone {z.zona}
          </Chip>
          <p className="text-base text-white/90 leading-snug">{z.ajuste}</p>
        </GlassCard>
      ))}

      {data.organización_defensiva && (
        <GlassCard>
          <div className="text-xs uppercase tracking-wide text-white/50 mb-1">
            Defensive Organization
          </div>
          <p className="text-base text-white/90">
            {data.organización_defensiva}
          </p>
        </GlassCard>
      )}
    </div>
  );
}

/* =====================================================
                OFFENSIVE SECTION
===================================================== */

function OffensiveSection({ data }: any) {
  if (!data) return null;

  const movimientos = data.promover_movimiento || [];

  return (
    <div className="space-y-4">
      {movimientos.map((m: any, i: number) => (
        <GlassCard key={i}>
          <Chip className="text-xs bg-red-500/30 border-red-300/40 text-red-100 mb-1">
            Zone {m.zona}
          </Chip>
          <p className="text-base text-white/90 leading-snug">{m.estrategia}</p>
        </GlassCard>
      ))}
    </div>
  );
}

/* =====================================================
                MOVIMIENTOS CLAVE SECTION
===================================================== */

function MovementsSection({ data }: any) {
  if (!data) return null;

  const porLinea = data.por_línea || {};
  const jugadorClave = data.jugador_clave;

  return (
    <div className="space-y-4">
      {Object.entries(porLinea).map(([line, text]: any, i) => (
        <GlassCard key={i}>
          <Chip className="text-xs bg-purple-500/30 border-purple-300/40 text-purple-100 mb-1">
            {line.toUpperCase()}
          </Chip>
          <p className="text-base text-white/90 leading-snug">{text}</p>
        </GlassCard>
      ))}

      {jugadorClave && (
        <GlassCard>
          <Chip className="text-xs bg-purple-500/30 border-purple-300/40 text-purple-100 mb-1">
            KEY PLAYER
          </Chip>
          <p className="text-base text-white/90 leading-snug">{jugadorClave}</p>
        </GlassCard>
      )}
    </div>
  );
}

/* =====================================================
                GLASS CARD (REUSABLE)
===================================================== */

function GlassCard({ children }: any) {
  return (
    <div
      className="
        p-3 rounded-lg
        bg-white/10
        border border-white/20
        shadow-inner shadow-black/40
        backdrop-blur-sm
        transition hover:bg-white/20
      "
    >
      {children}
    </div>
  );
}