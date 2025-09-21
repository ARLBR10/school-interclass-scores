"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BetterMatch } from "@/convex/matches";
import Link from "next/link";

function GetTeamsFromMatches(Match?: BetterMatch) {
  return Match?.teams.map((TeamID) => {
    const Team = useQuery(api.teams.get, {
      ID: TeamID as any,
    });

    return {
      Link: `/teams/${Team?._id}`,
      Text: `Time ${Team?.name}`,
    };
  });
}

export function BetterMatchText(Match?: BetterMatch) {
  const BetterTeams = GetTeamsFromMatches(Match) || [
    {
      Link: '/teams/1',
      Text: 'Time 1'
    },
    {
      Link: '/teams/2',
      Text: 'Time 2'
    },
  ]

  const TeamsLinks = BetterTeams?.map((Team) => (
    <Link key={Team.Text} href={Team.Link}>
      {Team.Text}
    </Link>
  ));

  return <span>{TeamsLinks[0]} vs {TeamsLinks[1]} - {'TEMPO AQUI'}</span>;
}
