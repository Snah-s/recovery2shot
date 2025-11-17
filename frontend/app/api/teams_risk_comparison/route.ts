import { NextResponse } from "next/server"

export async function GET() {
  try {
    // TODO: Replace with actual backend call
    // const response = await fetch(`${process.env.BACKEND_URL}/teams_risk_comparison`)
    // const data = await response.json()

    const mockData = [
      { team_name: "Perú", risk: 0.18 },
      { team_name: "Argentina", risk: 0.25 },
      { team_name: "Uruguay", risk: 0.22 },
      { team_name: "Brasil", risk: 0.2 },
      { team_name: "Colombia", risk: 0.19 },
    ]

    return NextResponse.json(mockData)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch comparison data" }, { status: 500 })
  }
}
