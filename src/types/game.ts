export type Origin = "national" | "international";

export type PlayMode = "local" | "online";

export type DeckMode = "national" | "international" | "mixed";

export type Team = "red" | "blue";

export type Twist = "whistle" | "hum" | "bomb" | "duel";

export type Outcome = "hit" | "stolen" | "missed";

export type RoomStatus = "lobby" | "playing" | "done";

export type TurnStatus = "ready" | "running" | "stealing" | "done";

export interface Song {
  id: string;
  title: string;
  artist: string;
  hint: string;
  origin: Origin;
}

export interface PlayerRow {
  id: string;
  room_id: string;
  name: string;
  team: Team | null;
  is_host: boolean;
  spoke_count: number;
  seat: number;
  avatar: string | null;
  emoji: string | null;
}

export interface RoomRow {
  id: string;
  code: string;
  host_id: string | null;
  deck_mode: DeckMode;
  play_mode: PlayMode;
  turn_seconds: number;
  steal_enabled: boolean;
  twists: Twist[];
  status: RoomStatus;
  current_turn_id: string | null;
  round_number: number;
  is_test: boolean;
}

export interface TurnRow {
  id: string;
  room_id: string;
  singer_id: string;
  team: Team;
  status: TurnStatus;
  twist: Twist | null;
  bomb_position: number | null;
  bomb_song_id?: string | null;
  started_at: string | null;
  ends_at: string | null;
  paused_at: string | null;
}

export interface TurnSongRow {
  turn_id: string;
  song_id: string;
  position: number;
  outcome: Outcome | null;
}

export interface ResultRow {
  id: string;
  room_id: string;
  turn_id: string;
  song_id: string;
  outcome: Outcome;
  scoring_team: Team | null;
  points: number;
  created_at: string;
}

export interface Score {
  red: number;
  blue: number;
}

export interface MatchPlayer {
  name: string;
  team: Team;
}

export interface MatchRow {
  id: string;
  room_code: string;
  deck_mode: DeckMode;
  score_red: number;
  score_blue: number;
  winner: Team | "tie" | null;
  players: MatchPlayer[];
  songs_played: number;
  finished_at: string;
}

export interface RankingRow {
  name: string;
  wins: number;
  matches: number;
  points: number;
}

export interface ChatMessage {
  id: string;
  player_id: string | null;
  author_name: string;
  kind: "text" | "audio";
  body: string | null;
  audio_url: string | null;
  audio_seconds: number | null;
  created_at: string;
}

export interface ReactionTally {
  emoji: string;
  count: number;
}
