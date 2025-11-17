import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { team_id: string } }) {
  try {
    const teamId = Number.parseInt(params.team_id)

    // TODO: Replace with actual backend call to your risk model
    // const response = await fetch(`${process.env.BACKEND_URL}/team_risk_map/${teamId}`)
    // const data = await response.json()

    // Mock response for demo
    const mockData = {
      team_id: teamId,
      team_name: ["Perú", "Argentina", "Uruguay", "Brasil", "Colombia"][teamId - 1],
      average_risk: 0.18 + Math.random() * 0.1,
      heatmap_data: generateMockHeatmap(),
      zones: generateMockZones(),
    }

    return NextResponse.json(mockData)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch team risk data" }, { status: 500 })
  }
}

function generateMockHeatmap() {
  return Array(10)
    .fill(0)
    .map(() =>
      Array(15)
        .fill(0)
        .map(() => Math.random() * 0.4),
    )
}

function generateMockZones() {
  return [
    { zone_id: "1A", risk_level: 0.08, description: "Defensa izquierda" },
    { zone_id: "2A", risk_level: 0.12, description: "Centro defensa" },
    { zone_id: "3A", risk_level: 0.1, description: "Defensa derecha" },
    { zone_id: "1B", risk_level: 0.15, description: "Mediocampo izquierdo" },
    { zone_id: "2B", risk_level: 0.18, description: "Centro mediocampo" },
    { zone_id: "3B", risk_level: 0.16, description: "Mediocampo derecho" },
    { zone_id: "1C", risk_level: 0.22, description: "Ataque izquierdo" },
    { zone_id: "2C", risk_level: 0.25, description: "Centro ataque" },
    { zone_id: "3C", risk_level: 0.23, description: "Ataque derecho" },
  ]
}
