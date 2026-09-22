import type {
  DeckMode,
  MatchRow,
  Outcome,
  PlayerRow,
  ResultRow,
  RoomRow,
  Score,
  Song,
  Team,
  TurnRow,
  Twist,
} from "@/types/game";

export type PlayMode = "local" | "online";

export interface TurnSongView {
  songId: string;
  outcome: Outcome | null;
  song: Song | null;
}

export interface RoomState {
  room: RoomRow;
  players: PlayerRow[];
  turn: TurnRow | null;
  me: PlayerRow;
  isSinger: boolean;
  songs: TurnSongView[];
  score: Score;
  results: ResultRow[];
  now: string;
  clockOffset: number;
}

export interface TakeView {
  id: string;
  songId: string | null;
  audioUrl: string;
  seconds: number;
  solved: boolean;
  solvedByName: string | null;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });

  const body = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(body.error ?? "Deu ruim aqui. Tente de novo.");
  }

  return body;
}

function lobby(code: string, token: string, action: string, extra = {}) {
  return request("/api/room/lobby", {
    method: "POST",
    body: JSON.stringify({ code, token, action, ...extra }),
  });
}

function turn(code: string, token: string, action: string, extra = {}) {
  return request("/api/room/turn", {
    method: "POST",
    body: JSON.stringify({ code, token, action, ...extra }),
  });
}

export const api = {
  createRoom(name: string, deckMode: DeckMode, playMode: PlayMode) {
    return request<{ code: string; token: string; playerId: string }>(
      "/api/room/create",
      { method: "POST", body: JSON.stringify({ name, deckMode, playMode }) },
    );
  },

  joinRoom(code: string, name: string) {
    return request<{ code: string; token: string; playerId: string }>(
      "/api/room/join",
      { method: "POST", body: JSON.stringify({ code, name }) },
    );
  },

  state(code: string, token: string) {
    return request<RoomState>(
      `/api/room/state?code=${encodeURIComponent(code)}&token=${encodeURIComponent(token)}`,
    );
  },

  changeTeam(code: string, token: string, team: Team) {
    return lobby(code, token, "team", { team });
  },

  changeDeck(code: string, token: string, deckMode: DeckMode) {
    return lobby(code, token, "deck", { deckMode });
  },

  changeTwists(
    code: string,
    token: string,
    twists: Twist[],
    stealEnabled: boolean,
  ) {
    return lobby(code, token, "twists", { twists, stealEnabled });
  },

  drawTeams(code: string, token: string) {
    return lobby(code, token, "draw");
  },

  startGame(code: string, token: string) {
    return lobby(code, token, "start");
  },

  restart(code: string, token: string) {
    return lobby(code, token, "restart");
  },

  startTurn(code: string, token: string) {
    return turn(code, token, "start");
  },

  markSong(code: string, token: string, songId: string, outcome: Outcome) {
    return turn(code, token, "mark", { songId, outcome });
  },

  closeTurn(code: string, token: string) {
    return turn(code, token, "close");
  },

  endSteal(code: string, token: string) {
    return turn(code, token, "endSteal");
  },

  pauseTurn(code: string, token: string) {
    return turn(code, token, "pause");
  },

  resumeTurn(code: string, token: string) {
    return turn(code, token, "resume");
  },

  undoResult(code: string, token: string) {
    return turn(code, token, "undo") as Promise<{
      song: string | null;
      points: number;
      team: string | null;
    }>;
  },

  async sendTake(
    code: string,
    token: string,
    songId: string,
    blob: Blob,
    seconds: number,
  ) {
    const form = new FormData();

    form.append("code", code);
    form.append("token", token);
    form.append("songId", songId);
    form.append("seconds", String(seconds));
    form.append("file", blob, "take");

    const response = await fetch("/api/room/take", {
      method: "POST",
      body: form,
      cache: "no-store",
    });

    const body = (await response.json()) as { error?: string };

    if (!response.ok) {
      throw new Error(body.error ?? "Deu ruim aqui. Tente de novo.");
    }

    return body;
  },

  takes(code: string, token: string) {
    return request<{ takes: TakeView[] }>(
      `/api/room/takes?code=${encodeURIComponent(code)}&token=${encodeURIComponent(token)}`,
    );
  },

  guess(code: string, token: string, takeId: string, body: string) {
    return request<{ correct: boolean; song: Song | null }>(
      "/api/room/guess",
      {
        method: "POST",
        body: JSON.stringify({ code, token, takeId, body }),
      },
    );
  },

  preview(artist: string, title: string) {
    return request<{ previewUrl: string | null }>(
      `/api/preview?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`,
    );
  },

  history() {
    return request<{ matches: MatchRow[] }>("/api/history");
  },
};
