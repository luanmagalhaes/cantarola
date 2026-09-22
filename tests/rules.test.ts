import { describe, expect, it } from "vitest";
import {
  assignTeams,
  canStart,
  codeLength,
  isGameOver,
  maxPlayers,
  minPlayers,
  nextTurn,
  pickTwist,
  pointsFor,
  rivalOf,
  scoreFrom,
  scoringTeamFor,
  shuffle,
  songsPerTurn,
  teams,
  teamsBalanced,
  turnsTaken,
  winnerOf,
  withoutTeam,
} from "@/lib/game/rules";
import type { PlayerRow, ResultRow, Team, Twist } from "@/types/game";

function player(overrides: Partial<PlayerRow> = {}): PlayerRow {
  const seat = overrides.seat ?? 0;
  return {
    id: `player-${seat}`,
    room_id: "room-test",
    name: `Jogador ${seat + 1}`,
    team: null,
    is_host: false,
    spoke_count: 0,
    seat,
    ...overrides,
  };
}

function result(overrides: Partial<ResultRow> = {}): ResultRow {
  return {
    id: "result-test",
    room_id: "room-test",
    turn_id: "turn-test",
    song_id: "song-test",
    outcome: "hit",
    scoring_team: "red",
    points: 1,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function lineup(): PlayerRow[] {
  return [
    player({ seat: 0, team: "red" }),
    player({ seat: 1, team: "blue" }),
    player({ seat: 2, team: "red" }),
    player({ seat: 3, team: "blue" }),
  ];
}

function repeat(times: number, run: () => string): Set<string> {
  const seen = new Set<string>();
  for (let index = 0; index < times; index += 1) seen.add(run());
  return seen;
}

describe("constantes da partida", () => {
  it("tem os dois times, na ordem vermelho e azul", () => {
    expect(teams).toEqual(["red", "blue"]);
  });

  it("aceita de 4 a 16 jogadores", () => {
    expect(minPlayers).toBe(4);
    expect(maxPlayers).toBe(16);
  });

  it("usa código de 2 dígitos e 8 músicas por turno", () => {
    expect(codeLength).toBe(2);
    expect(songsPerTurn).toBe(8);
  });
});

describe("rivalOf", () => {
  it("devolve o time adversário", () => {
    expect(rivalOf("red")).toBe("blue");
    expect(rivalOf("blue")).toBe("red");
  });

  it("volta ao time original quando aplicado duas vezes", () => {
    expect(rivalOf(rivalOf("red"))).toBe("red");
  });
});

describe("pointsFor", () => {
  it("dá 1 ponto para acerto e para roubo", () => {
    expect(pointsFor("hit", false)).toBe(1);
    expect(pointsFor("stolen", false)).toBe(1);
  });

  it("dá 2 pontos quando a música é a bomba", () => {
    expect(pointsFor("hit", true)).toBe(2);
    expect(pointsFor("stolen", true)).toBe(2);
  });

  it("não dá ponto para música não acertada, nem se for a bomba", () => {
    expect(pointsFor("missed", false)).toBe(0);
    expect(pointsFor("missed", true)).toBe(0);
  });
});

describe("scoringTeamFor", () => {
  it("credita o acerto ao time do cantor", () => {
    expect(scoringTeamFor("hit", "red")).toBe("red");
    expect(scoringTeamFor("hit", "blue")).toBe("blue");
  });

  it("credita o roubo ao time adversário", () => {
    expect(scoringTeamFor("stolen", "red")).toBe("blue");
    expect(scoringTeamFor("stolen", "blue")).toBe("red");
  });

  it("não credita ninguém quando a música passa em branco", () => {
    expect(scoringTeamFor("missed", "red")).toBeNull();
  });
});

describe("scoreFrom", () => {
  it("começa zerado quando não há resultados", () => {
    expect(scoreFrom([])).toEqual({ red: 0, blue: 0 });
  });

  it("soma os pontos de cada time separadamente", () => {
    const results = [
      result({ id: "r1", scoring_team: "red", points: 1 }),
      result({ id: "r2", scoring_team: "red", points: 2, outcome: "hit" }),
      result({ id: "r3", scoring_team: "blue", points: 1, outcome: "stolen" }),
    ];
    expect(scoreFrom(results)).toEqual({ red: 3, blue: 1 });
  });

  it("ignora resultados sem time pontuador", () => {
    const results = [
      result({ id: "r1", outcome: "missed", scoring_team: null, points: 0 }),
      result({ id: "r2", scoring_team: "blue", points: 1 }),
    ];
    expect(scoreFrom(results)).toEqual({ red: 0, blue: 1 });
  });

  it("conta a bomba roubada como 2 pontos para o adversário", () => {
    const singerTeam: Team = "red";
    const outcome = "stolen" as const;
    const results = [
      result({
        id: "r1",
        outcome,
        scoring_team: scoringTeamFor(outcome, singerTeam),
        points: pointsFor(outcome, true),
      }),
    ];
    expect(scoreFrom(results)).toEqual({ red: 0, blue: 2 });
  });
});

describe("winnerOf", () => {
  it("aponta o time com mais pontos", () => {
    expect(winnerOf({ red: 7, blue: 3 })).toBe("red");
    expect(winnerOf({ red: 2, blue: 9 })).toBe("blue");
  });

  it("aponta empate quando os pontos são iguais", () => {
    expect(winnerOf({ red: 5, blue: 5 })).toBe("tie");
    expect(winnerOf({ red: 0, blue: 0 })).toBe("tie");
  });
});

describe("withoutTeam", () => {
  it("lista só quem ainda não tem time", () => {
    const players = [
      player({ seat: 0, team: "red" }),
      player({ seat: 1 }),
      player({ seat: 2 }),
    ];
    expect(withoutTeam(players).map((one) => one.seat)).toEqual([1, 2]);
  });

  it("devolve lista vazia quando todos já têm time", () => {
    expect(withoutTeam(lineup())).toEqual([]);
  });
});

describe("teamsBalanced", () => {
  it("aceita times do mesmo tamanho", () => {
    expect(teamsBalanced(lineup())).toBe(true);
  });

  it("aceita diferença de um jogador", () => {
    const players = [...lineup(), player({ seat: 4, team: "red" })];
    expect(teamsBalanced(players)).toBe(true);
  });

  it("recusa diferença de dois jogadores", () => {
    const players = [
      ...lineup(),
      player({ seat: 4, team: "red" }),
      player({ seat: 5, team: "red" }),
    ];
    expect(teamsBalanced(players)).toBe(false);
  });

  it("recusa quando alguém está sem time", () => {
    const players = [...lineup(), player({ seat: 4 })];
    expect(teamsBalanced(players)).toBe(false);
  });
});

describe("canStart", () => {
  it("libera o início com times equilibrados e gente suficiente", () => {
    expect(canStart(lineup())).toBe(true);
  });

  it("bloqueia com menos de 4 jogadores", () => {
    const players = [
      player({ seat: 0, team: "red" }),
      player({ seat: 1, team: "blue" }),
      player({ seat: 2, team: "red" }),
    ];
    expect(canStart(players)).toBe(false);
  });

  it("bloqueia com mais de 16 jogadores", () => {
    const players = Array.from({ length: 17 }, (_, seat) =>
      player({ seat, team: seat % 2 === 0 ? "red" : "blue" }),
    );
    expect(canStart(players)).toBe(false);
  });

  it("bloqueia enquanto houver jogador sem time", () => {
    const players = [...lineup(), player({ seat: 4 })];
    expect(canStart(players)).toBe(false);
  });
});

describe("assignTeams", () => {
  it("dá time a todo mundo, sem perder ninguém", () => {
    const players = lineup().map((one) => ({ ...one, team: null }));
    const assignment = assignTeams(players);
    expect(assignment.size).toBe(players.length);
    for (const one of players) expect(assignment.has(one.id)).toBe(true);
  });

  it("mantém diferença máxima de um jogador com número ímpar", () => {
    const players = Array.from({ length: 7 }, (_, seat) => player({ seat }));
    const assignment = assignTeams(players);
    const red = [...assignment.values()].filter((team) => team === "red");
    const blue = [...assignment.values()].filter((team) => team === "blue");
    expect(Math.abs(red.length - blue.length)).toBe(1);
  });

  it("gera divisões diferentes entre execuções", () => {
    const players = Array.from({ length: 8 }, (_, seat) => player({ seat }));
    const draws = repeat(60, () => {
      const assignment = assignTeams(players);
      return players.map((one) => assignment.get(one.id)).join("-");
    });
    expect(draws.size).toBeGreaterThan(1);
  });

  it("não altera a lista recebida", () => {
    const players = Array.from({ length: 6 }, (_, seat) => player({ seat }));
    const before = players.map((one) => one.id);
    assignTeams(players);
    expect(players.map((one) => one.id)).toEqual(before);
  });
});

describe("turnsTaken", () => {
  it("soma os turnos já cantados por cada time", () => {
    const players = [
      player({ seat: 0, team: "red", spoke_count: 2 }),
      player({ seat: 1, team: "blue", spoke_count: 1 }),
      player({ seat: 2, team: "red", spoke_count: 1 }),
      player({ seat: 3, team: "blue", spoke_count: 1 }),
    ];
    expect(turnsTaken(players, "red")).toBe(3);
    expect(turnsTaken(players, "blue")).toBe(2);
  });

  it("devolve zero quando ninguém do time cantou", () => {
    expect(turnsTaken(lineup(), "red")).toBe(0);
  });
});

describe("nextTurn", () => {
  it("abre a partida pelo time vermelho, no menor assento", () => {
    expect(nextTurn(lineup(), null)).toEqual({
      singerId: "player-0",
      team: "red",
    });
  });

  it("alterna o time a cada turno", () => {
    const players = lineup();
    players[0].spoke_count = 1;
    expect(nextTurn(players, "red")).toEqual({
      singerId: "player-1",
      team: "blue",
    });
  });

  it("dá prioridade a quem ainda não cantou, pelo menor assento", () => {
    const players = lineup();
    players[0].spoke_count = 1;
    players[1].spoke_count = 1;
    expect(nextTurn(players, "blue")).toEqual({
      singerId: "player-2",
      team: "red",
    });
  });

  it("passa a vez ao adversário quando o time da vez já cantou inteiro", () => {
    const players = [
      player({ seat: 0, team: "red", spoke_count: 1 }),
      player({ seat: 1, team: "blue", spoke_count: 1 }),
      player({ seat: 2, team: "blue", spoke_count: 0 }),
      player({ seat: 3, team: "blue", spoke_count: 0 }),
    ];
    expect(nextTurn(players, "blue")).toEqual({
      singerId: "player-2",
      team: "blue",
    });
  });

  it("dá turno extra ao time que cantou menos vezes depois de todos cantarem", () => {
    const players = [
      player({ seat: 0, team: "red", spoke_count: 1 }),
      player({ seat: 1, team: "red", spoke_count: 1 }),
      player({ seat: 2, team: "blue", spoke_count: 1 }),
    ];
    expect(nextTurn(players, "blue")).toEqual({
      singerId: "player-2",
      team: "blue",
    });
  });

  it("dá o turno extra a quem cantou menos, sempre ao mesmo com o mesmo estado", () => {
    const players = [
      player({ seat: 0, team: "red", spoke_count: 2 }),
      player({ seat: 1, team: "red", spoke_count: 2 }),
      player({ seat: 2, team: "blue", spoke_count: 1 }),
      player({ seat: 3, team: "blue", spoke_count: 1 }),
    ];
    const draws = repeat(60, () => nextTurn(players, "red")?.singerId ?? "none");
    expect([...draws]).toEqual(["player-2"]);
  });

  it("não deixa o jogo travar quando um time ficou sem ninguém", () => {
    const players = [player({ seat: 0, team: "red", spoke_count: 1 })];

    expect(nextTurn(players, null)).toBeNull();
    expect(isGameOver(players)).toBe(true);
  });

  it("nunca escolhe quem já cantou mais que os colegas de time", () => {
    const players = [
      player({ seat: 0, team: "red", spoke_count: 3 }),
      player({ seat: 1, team: "red", spoke_count: 3 }),
      player({ seat: 2, team: "blue", spoke_count: 3 }),
      player({ seat: 3, team: "blue", spoke_count: 1 }),
    ];
    const draws = repeat(60, () => nextTurn(players, "red")?.singerId ?? "none");
    expect([...draws]).toEqual(["player-3"]);
  });

  it("devolve null quando todos cantaram e os times empataram em turnos", () => {
    const players = lineup().map((one) => ({ ...one, spoke_count: 1 }));
    expect(nextTurn(players, "blue")).toBeNull();
  });

  it("devolve null sem jogadores", () => {
    expect(nextTurn([], null)).toBeNull();
  });
});

describe("isGameOver", () => {
  it("não encerra enquanto alguém não cantou", () => {
    const players = lineup();
    players[0].spoke_count = 1;
    expect(isGameOver(players)).toBe(false);
  });

  it("não encerra com turnos desiguais entre os times", () => {
    const players = [
      player({ seat: 0, team: "red", spoke_count: 1 }),
      player({ seat: 1, team: "red", spoke_count: 1 }),
      player({ seat: 2, team: "blue", spoke_count: 1 }),
    ];
    expect(isGameOver(players)).toBe(false);
  });

  it("encerra quando todos cantaram e os turnos empataram", () => {
    const players = [
      player({ seat: 0, team: "red", spoke_count: 1 }),
      player({ seat: 1, team: "red", spoke_count: 1 }),
      player({ seat: 2, team: "blue", spoke_count: 2 }),
    ];
    expect(isGameOver(players)).toBe(true);
  });

  it("concorda com nextTurn: o jogo acaba exatamente quando não há próximo turno", () => {
    const players = [
      player({ seat: 0, team: "red", spoke_count: 1 }),
      player({ seat: 1, team: "red", spoke_count: 1 }),
      player({ seat: 2, team: "blue", spoke_count: 1 }),
    ];
    expect(nextTurn(players, "red")).not.toBeNull();
    expect(isGameOver(players)).toBe(false);
    players[2].spoke_count = 2;
    expect(nextTurn(players, "blue")).toBeNull();
    expect(isGameOver(players)).toBe(true);
  });
});

describe("pickTwist", () => {
  it("devolve null quando nenhum modo está ativo", () => {
    expect(pickTwist([])).toBeNull();
  });

  it("com um modo só, alterna entre ele e a rodada normal", () => {
    const draws = repeat(200, () => pickTwist(["bomb"]) ?? "none");

    expect([...draws].sort()).toEqual(["bomb", "none"]);
  });

  it("sorteia entre os modos ativos e a rodada sem modo nenhum", () => {
    const enabled: Twist[] = ["whistle", "hum"];
    const draws = repeat(200, () => pickTwist(enabled) ?? "none");

    expect([...draws].sort()).toEqual(["hum", "none", "whistle"]);
  });

  it("varia o modo sorteado entre execuções", () => {
    const enabled: Twist[] = ["whistle", "hum", "bomb", "duel"];
    const draws = repeat(60, () => pickTwist(enabled) ?? "none");
    expect(draws.size).toBeGreaterThan(1);
  });
});

describe("shuffle", () => {
  it("preserva todos os itens", () => {
    const items = [1, 2, 3, 4, 5];
    expect([...shuffle(items)].sort()).toEqual(items);
  });

  it("não altera a lista original", () => {
    const items = ["a", "b", "c", "d"];
    shuffle(items);
    expect(items).toEqual(["a", "b", "c", "d"]);
  });

  it("produz ordens diferentes entre execuções", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(repeat(60, () => shuffle(items).join("-")).size).toBeGreaterThan(1);
  });

  it("devolve lista vazia para entrada vazia", () => {
    expect(shuffle([])).toEqual([]);
  });
});
