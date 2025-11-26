"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { trackEvent } from "@/lib/analytics";

interface TeamSelectorProps {
  title: string;
  selectedTeam: number;
  onTeamChange: (teamId: number) => void;
  teams: Array<{ team_id: number; team_name: string; events: number }>;
}

export default function TeamSelector({
  title,
  selectedTeam,
  onTeamChange,
  teams,
}: TeamSelectorProps) {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-4">
      <label className="text-lg font-semibold text-foreground">{title}</label>
      <Select
        value={selectedTeam.toString()}
        onValueChange={(v) => {
          const num = Number(v);
          trackEvent("team_change_click", {
            new_team_id: num,
            slot: title.includes("Contrario") ? "B" : "A",
          });
          onTeamChange(num);
        }}
      >
        <SelectTrigger className="w-60 border-white">
          <SelectValue placeholder="Select a team" />
        </SelectTrigger>
        <SelectContent>
          {teams.map((team) => (
            <SelectItem key={team.team_id} value={team.team_id.toString()}>
              {team.team_name} ({team.events} events)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
