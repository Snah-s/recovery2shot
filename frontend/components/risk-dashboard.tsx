"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import HeatmapVisualization from "./heatmap-visualization";
import TacticalRecommendations from "./tactical-recommendations";
import TeamSelector from "./team-selector";
import { CircularProgress, Tabs, Tab } from "@heroui/react";
import { TacticalJSON } from "@/entities/tactical";
import TacticalRecommendations1 from "./tactical-recommendations1";
import { ComparisonJSON } from "@/entities/Comparison";
import TeamsComparison from "./teams-comparison";
import TeamPanel from "./TeamPanel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { trackEvent } from "@/lib/analytics";

interface Zone {
  zone_id: string;
  zx: number;
  zy: number;
  p_model: number;
}

interface TeamRiskData {
  team_id: number;
  team_name: string;
  average_risk: number;
  heatmap_data: number[][];
  zones: Array<{ zone_id: string; risk_level: number; description: string }>;
}

type ModelType = "turnover" | "recovery";

const MODEL_OPTIONS: Array<{ label: string; value: ModelType }> = [
  { label: "Modelo de pérdidas", value: "turnover" },
  { label: "Modelo de recuperaciones", value: "recovery" },
];

export default function RiskDashboard() {
  const [selectedTeam, setSelectedTeam] = useState<number>(749);
  const [selectedTeamB, setSelectedTeamB] = useState<number>(746);
  const [modelType, setModelType] = useState<ModelType>("turnover");
  const [modelType_2, setModelType_2] = useState<ModelType>("turnover");
  const [teamData, setTeamData] = useState<TeamRiskData | null>(null);
  const [teamDataB, setTeamDataB] = useState<TeamRiskData | null>(null);
  const [allTeamsRisk, setAllTeamsRisk] = useState<
    Array<{ team_name: string; risk: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [highlightZone, setHighlightZone] = useState<string | null>(null);
  const [colorHighLight, setColorHighLight] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<
    Array<{ team_id: number; team_name: string; events: number }>
  >([]);
  const [tacticalAdvice, setTacticalAdvice] = useState<TacticalJSON | null>(
    null
  );
  const [tacticalAdviceB, setTacticalAdviceB] = useState<TacticalJSON | null>(
    null
  );
  const [comparison, setComparison] = useState<ComparisonJSON | null>(null);
  // ==============================
  // 🔍 Refs para métricas de tiempo
  // ==============================

  // Modelo actual y tiempo en él
  const modelStartRef = useRef<number>(performance.now());
  const modelRef = useRef<ModelType>(modelType);

  // Equipo A
  const teamAStartRef = useRef<number>(performance.now());
  const teamARef = useRef<number>(selectedTeam);

  // Equipo B
  const teamBStartRef = useRef<number>(performance.now());
  const teamBRef = useRef<number>(selectedTeamB);

  // Panel (tab) activo
  const [activeTab, setActiveTab] = useState("team-a");
  const tabStartRef = useRef<number>(performance.now());
  const tabRef = useRef<string>("team-a");

  // ===============================
  // 🔹 1. Obtener lista de equipos (A y B según su modelo)
  // ===============================
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const resA = await fetch(
          `http://localhost:8000/teams?model_type=${modelType}`
        );
        const resB = await fetch(
          `http://localhost:8000/teams?model_type=${modelType_2}`
        );

        if (!resA.ok || !resB.ok)
          throw new Error("No se pudo obtener la lista de equipos");

        const dataA = await resA.json();
        const dataB = await resB.json();

        setTeams(dataA); // puedes unificarlos si quieres

        // Ajuste selección equipo A
        if (dataA.length > 0) {
          setSelectedTeam((prev) => {
            const exists = dataA.some(
              (t: { team_id: number; team_name: string; events: number }) =>
                t.team_id === prev
            );
            return exists ? prev : dataA[0].team_id;
          });
        }

        // Ajuste selección equipo B
        if (dataB.length > 0) {
          setSelectedTeamB((prev) => {
            const exists = dataB.some(
              (t: { team_id: number; team_name: string; events: number }) =>
                t.team_id === prev
            );
            return exists ? prev : dataB[0].team_id;
          });
        }
      } catch (err) {
        console.error("Error cargando equipos:", err);
      }
    };
    fetchTeams();
  }, [modelType, modelType_2]);

  async function fetchTeamRisk(
    teamId: number,
    modelVariant: ModelType
  ): Promise<TeamRiskData> {
    const res = await fetch(
      `http://localhost:8000/team_risk_map/${teamId}?model_type=${modelVariant}`
    );
    if (!res.ok) throw new Error("No se pudo obtener el mapa de riesgo");
    const data = await res.json();
    const raw: Zone[] = data.zones || [];

    const ybins = 8;
    const xbins = 12;
    const grid = Array(ybins)
      .fill(0)
      .map(() => Array(xbins).fill(0));

    raw.forEach((zone) => {
      if (zone.zx < xbins && zone.zy < ybins) {
        grid[zone.zy][zone.zx] = zone.p_model;
      }
    });

    return {
      team_id: teamId,
      team_name: data.team_name,
      average_risk:
        raw.reduce((acc, z) => acc + z.p_model, 0) / (raw.length || 1),
      heatmap_data: grid,
      zones: raw.map((z) => ({
        zone_id: z.zone_id,
        risk_level: z.p_model,
        description: `Zona ${z.zone_id}`,
      })),
    };
  }

  async function fetchTacticalRecommendations(teamData: TeamRiskData) {
    // 1. Construir diccionario { "x_y": prob }
    const modelOutput: Record<string, number> = {};
    // 2. Llamar al backend
    teamData.zones.forEach((zone) => {
      modelOutput[zone.zone_id] = zone.risk_level;
    });

    const res = await fetch("http://localhost:8000/tactical-recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: modelOutput,
        team_name: teamData.team_name,
      }),
    });

    if (!res.ok) throw new Error("Error al obtener recomendaciones tácticas");

    const json = await res.json();
    return json.recommendations; // GPT devuelve texto JSON
  }

  useEffect(() => {
    const loadComparison = async () => {
      if (!selectedTeam || !selectedTeamB) return;

      try {
        setComparison(null);

        const teamA = await fetchTeamRisk(selectedTeam, modelType);
        const teamB = await fetchTeamRisk(selectedTeamB, modelType_2);
        // Guardar datos individuales (puede servir luego)
        setTeamData(teamA);
        setTeamDataB(teamB);

        // Llamar análisis comparativo
        const cmp = await fetchTeamComparison(teamA, teamB);
        setComparison(cmp);

        console.log("COMPARACIÓN TÁCTICA:", cmp);
      } catch (err) {
        console.error("Error en comparación:", err);
      }
    };

    loadComparison();
  }, [selectedTeam, selectedTeamB, modelType, modelType_2]);

  async function fetchTeamComparison(teamA: TeamRiskData, teamB: TeamRiskData) {
    // Convertir formato → { "x_y": prob }
    const modelOutputA: Record<string, number> = {};
    teamA.zones.forEach((z) => (modelOutputA[z.zone_id] = z.risk_level));

    const modelOutputB: Record<string, number> = {};
    teamB.zones.forEach((z) => (modelOutputB[z.zone_id] = z.risk_level));

    const res = await fetch("http://localhost:8000/compare-teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        equipo_a: {
          team_id: teamA.team_id,
          team_name: teamA.team_name,
          zonas: modelOutputA,
        },
        equipo_b: {
          team_id: teamB.team_id,
          team_name: teamB.team_name,
          zonas: modelOutputB,
        },
      }),
    });

    if (!res.ok) throw new Error("Error al obtener comparación táctica");

    const json = await res.json();
    return json.comparison;
  }

  // ==================================================
  // 🔹 3. Cargar comparativa general y tácticas
  // ==================================================
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        setError(null);

        const riskData = await fetchTeamRisk(selectedTeam, modelType);
        const riskDataB = await fetchTeamRisk(selectedTeamB, modelType_2);
        setTeamData(riskData);
        setTeamDataB(riskDataB);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [selectedTeam, selectedTeamB, modelType, modelType_2]);

  useEffect(() => {
    const fetchTacticalData = async () => {
      // === Recomendaciones tácticas ===
      const tactics = await fetchTacticalRecommendations(teamData!);
      setTacticalAdvice(tactics);
      console.log("Recomendaciones tácticas:", tactics);
    };
    if (teamData) {
      fetchTacticalData();
    }
  }, [selectedTeam, teamData]);

  useEffect(() => {
    const fetchTacticalData = async () => {
      // === Recomendaciones tácticas ===
      const tactics = await fetchTacticalRecommendations(teamDataB!);
      setTacticalAdviceB(tactics);

      console.log("Recomendaciones tácticas:", tactics);
    };
    if (teamDataB) {
      fetchTacticalData();
    }
  }, [selectedTeamB, teamDataB]);

  // Tiempo que el usuario pasa en cada modelo (turnover / recovery)
  useEffect(() => {
    const now = performance.now();

    // No logueamos la primera vez si no quieres ruido, pero para simplificar lo hacemos siempre
    trackEvent("model_view_time", {
      model: modelRef.current,
      duration_ms: now - modelStartRef.current,
    });

    modelRef.current = modelType;
    modelStartRef.current = now;
  }, [modelType]);

  // Tiempo viendo el equipo A
  useEffect(() => {
    const now = performance.now();

    trackEvent("team_view_time", {
      slot: "A",
      team_id: teamARef.current,
      duration_ms: now - teamAStartRef.current,
    });

    teamARef.current = selectedTeam;
    teamAStartRef.current = now;
  }, [selectedTeam]);

  // Tiempo viendo el equipo B
  useEffect(() => {
    const now = performance.now();

    trackEvent("team_view_time", {
      slot: "B",
      team_id: teamBRef.current,
      duration_ms: now - teamBStartRef.current,
    });

    teamBRef.current = selectedTeamB;
    teamBStartRef.current = now;
  }, [selectedTeamB]);

  // Profundidad máxima de scroll alcanzada en esta vista
  useEffect(() => {
    const info = { max: 0 };

    function handleScroll() {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const percent = window.scrollY / docHeight;
      if (percent > info.max) info.max = percent;
    }

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);

      trackEvent("scroll_depth", {
        max_scroll_percent: Math.round(info.max * 100),
      });
    };
  }, []);

  // ===============================
  // 🧩 Render
  // ===============================
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 p-6 px-10">
      <div className="max-w-full mx-14">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Loss Risk Analysis
          </h1>
          <p className="text-muted-foreground">
            Visualization of opponent shot probability within the next 15
            seconds
          </p>
        </div>

        {/* Selector de Equipo */}
        <div className="my-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-evenly bg-gray-500/10 py-4 px-4 rounded-md shadow-md">
            <div className="flex flex-col gap-8">
                <TeamSelector
                  title="Select Team:"
                  selectedTeam={selectedTeam}
                  onTeamChange={setSelectedTeam}
                  teams={teams}
                />

                <div className="flex flex-col gap-2 lg:flex-row items-center justify-center lg:justify-between lg:gap-4">
                  <label className="text-lg font-semibold text-foreground">
                    Model Type:
                  </label>
                  <Select
                    value={modelType}
                    onValueChange={(value) => {
                      trackEvent("model_change_click", { new_model: value });
                      setModelType(value as ModelType);
                    }}
                  >
                    <SelectTrigger className="w-60 border-white">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODEL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-8 mt-4 lg:mt-0 border-t-2 lg:border-t-0 border-t-white pt-8 lg:pt-0">
                <TeamSelector
                  title="Select Opponent Team:"
                  selectedTeam={selectedTeamB}
                  onTeamChange={setSelectedTeamB}
                  teams={teams}
                />
                <div className="flex flex-col gap-2 lg:flex-row items-center justify-center lg:justify-between lg:gap-4">
                  <label className="text-lg font-semibold text-foreground">
                    Model Type:
                  </label>
                  <Select
                    value={modelType_2}
                    onValueChange={(value) => {
                      trackEvent("model_change_click", { new_model: value });
                      setModelType_2(value as ModelType);
                    }}
                  >
                    <SelectTrigger className="w-60 border-white">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODEL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
          </div>
        </div>

        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => {
            const now = performance.now();

            trackEvent("panel_view_time", {
              panel: tabRef.current,
              duration_ms: now - tabStartRef.current,
            });

            tabRef.current = String(key);
            tabStartRef.current = now;
            setActiveTab(String(key));
          }}
          aria-label="Selector de equipo"
          color="primary"
          variant="underlined"
          className="w-full items-center justify-center"
        >
          {/* ================= TAB EQUIPO A ================= */}
          <Tab key="team-a" title={`Team A: ${teamData?.team_name ?? ""}`}>
            <TeamPanel
              typeTeam="A"
              teamData={teamData}
              loading={loading}
              highlightZone={highlightZone}
              setHighlightZone={setHighlightZone}
              colorHighLight={colorHighLight}
              setColorHighLight={setColorHighLight}
              tacticalAdvice={tacticalAdvice}
            />
          </Tab>

          {/* ================= TAB EQUIPO B ================= */}
          <Tab key="team-b" title={`Team B: ${teamDataB?.team_name ?? ""}`}>
            <TeamPanel
              typeTeam="B"
              teamData={teamDataB}
              loading={loading}
              highlightZone={highlightZone}
              setHighlightZone={setHighlightZone}
              colorHighLight={colorHighLight}
              setColorHighLight={setColorHighLight}
              tacticalAdvice={tacticalAdviceB}
            />
          </Tab>
          <Tab key="tactical-comparison" title={`Tactical Comparison`}>
            <>
              <div className="my-8 border-1 border-white/20"></div>
              <TeamsComparison
                comparison={comparison}
                team_name_a={teamData?.team_name ?? ""}
                team_name_b={teamDataB?.team_name ?? ""}
              />
            </>
          </Tab>
        </Tabs>

        {/* Contenido principal */}
        <div className="hidden">
          <div className="grid grid-cols-1">
            {/* === LADO IZQUIERDO === */}
            <div className="grid grid-cols-2">
              {/* === HEATMAP === */}
              <div className="col-span-1">
                <Card className="h-full border-border/50 shadow-lg">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      Field Heatmap
                    </CardTitle>
                    <CardDescription>
                      Opponent shot probability per zone (120x80 m)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loading ? (
                      <div className="flex items-center justify-center h-96">
                        <div className="text-muted-foreground">
                          Cargando datos...
                        </div>
                      </div>
                    ) : teamData ? (
                      <HeatmapVisualization
                        data={teamData}
                        highlightZone={highlightZone}
                        color={colorHighLight}
                      />
                    ) : (
                      <div className="text-muted-foreground text-center">
                        Sin datos
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* === HEATMAP === */}
              <div className="col-span-1">
                <Card className="h-full border-border/50 shadow-lg">
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
                        <div className="text-muted-foreground">
                          Cargando datos...
                        </div>
                      </div>
                    ) : teamDataB ? (
                      <HeatmapVisualization
                        data={teamDataB}
                        highlightZone={highlightZone}
                        color={colorHighLight}
                      />
                    ) : (
                      <div className="text-muted-foreground text-center">
                        Sin datos
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* === LADO DERECHO === */}
            <div className="flex flex-col gap-6">
              {/* Comparativa de riesgo */}
              {/*<Card className="border-border/50 shadow-lg">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent"></div>
                  Comparativa de Riesgo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {allTeamsRisk.length > 0 ? (
                  <RiskComparison teams={allTeamsRisk} />
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Sin datos de comparación
                  </div>
                )}
              </CardContent>
            </Card>*/}

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
          <div className="my-8 border-1 border-white/20"></div>
          <TacticalRecommendations1 recommendations={tacticalAdvice} />
        </div>
      </div>
    </div>
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
