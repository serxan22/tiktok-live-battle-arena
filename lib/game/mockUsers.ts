import type { TeamId } from "./types";
import { pickOne, uid } from "./utils";

const handles = [
  "NovaKick",
  "PixelAce",
  "RushMode",
  "GoalFlex",
  "TurboMia",
  "NeroLive",
  "VibeKai",
  "EchoWin",
  "BlitzRay",
  "ZaraPop",
  "NeonSam",
  "OrbitLeo",
  "FlashAna",
  "RiftJay",
  "MangoQ",
  "VoltMax",
  "KiraShot",
  "JunoTap",
  "LunaRush",
  "AriFuse",
  "RexCombo",
  "VegaRun",
  "TaliSpark",
  "ZenGoal",
  "MikoZap",
  "SageLive",
  "IvyDash",
  "CosmoNia",
  "FinnWave",
  "RumiHit",
];

export function randomUsername() {
  return `@${pickOne(handles)}${Math.floor(Math.random() * 900 + 100)}`;
}

export function createMockUser(team: TeamId, username = randomUsername()) {
  return {
    id: uid("viewer"),
    username,
    avatarUrl: `generated://${encodeURIComponent(username)}`,
    team,
  };
}
