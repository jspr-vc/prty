import type { MatchContext } from '@workspace/common/game'
import type { SessionPlayer, Team } from '@workspace/db/schema'

export function toMatchContext(players: SessionPlayer[], teams: Team[]): MatchContext {
  return {
    players: players.map((player) => ({
      id: player.id,
      displayName: player.displayName,
      teamId: player.teamId,
    })),
    teams: teams.map((team) => ({ id: team.id, name: team.name, color: team.color })),
  }
}
