"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <div className="flex items-center gap-4">
      <label className="text-lg font-semibold text-foreground">{title}</label>
      <Select
        value={selectedTeam.toString()}
        onValueChange={(v) => onTeamChange(Number(v))}
      >
        <SelectTrigger className="w-60 border-white">
          <SelectValue placeholder="Selecciona un equipo" />
        </SelectTrigger>
        <SelectContent>
          {teams.map((team) => (
            <SelectItem key={team.team_id} value={team.team_id.toString()}>
              {team.team_name} ({team.events} eventos)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
