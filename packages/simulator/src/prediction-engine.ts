import { simulationPredictionSchema, type SimulationPrediction } from "@casino-os/shared";

const PLAYER_ANCHORS = [
  { minute: 0, players: 37 },
  { minute: 10, players: 89 },
  { minute: 20, players: 156 },
  { minute: 30, players: 214 },
] as const;

export function predictOutage(durationMinutes: number): SimulationPrediction {
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 120) {
    throw new Error("Prediction duration must be an integer between 1 and 120 minutes");
  }
  const checkpoints = checkpointMinutes(durationMinutes);
  return simulationPredictionSchema.parse({
    durationMinutes,
    currentAffectedPlayers: PLAYER_ANCHORS[0].players,
    timeline: checkpoints.map((minute) => ({ minute, affectedPlayers: affectedPlayersAt(minute) })),
    affectedPlayers: affectedPlayersAt(durationMinutes),
    failedDeposits: Math.round(durationMinutes * (73 / 30)),
    queuedWithdrawals: Math.round(durationMinutes * (31 / 30)),
    estimatedBlockedValue: Math.round(durationMinutes * 614),
    kycQueueCriticalInMinutes: 14,
    supportLoadIncrease: round(durationMinutes * (1.7 / 30), 2),
  });
}

function affectedPlayersAt(minute: number): number {
  const upper = PLAYER_ANCHORS.find((anchor) => anchor.minute >= minute);
  if (!upper) return Math.round(PLAYER_ANCHORS[3].players + (minute - 30) * 5.8);
  const upperIndex = PLAYER_ANCHORS.indexOf(upper);
  if (upperIndex === 0) return upper.players;
  const lower = PLAYER_ANCHORS[upperIndex - 1];
  if (!lower) return upper.players;
  const progress = (minute - lower.minute) / (upper.minute - lower.minute);
  return Math.round(lower.players + (upper.players - lower.players) * progress);
}

function checkpointMinutes(durationMinutes: number): number[] {
  const minutes: number[] = [];
  for (let minute = 10; minute <= durationMinutes; minute += 10) minutes.push(minute);
  if (!minutes.includes(durationMinutes)) minutes.push(durationMinutes);
  return minutes;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

