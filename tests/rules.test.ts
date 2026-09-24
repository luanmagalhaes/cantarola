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
  isOneOnOne,
  roundsFor,
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
    avatar: null,
    emoji: null,
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

  it("aceita de 2 a 16 jogadores", () => {
    expect(minPlayers).toBe(2);
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

  it("bloqueia com menos de 2 jogadores", () => {
    expect(canStart([player({ seat: 0, team: "red" })])).toBe(false);
  });

  it("libera o um contra um", () => {
    const players = [
      player({ seat: 0, team: "red" }),
      player({ seat: 1, team: "blue" }),
    ];
    expect(canStart(players)).toBe(true);
  });

  it("bloqueia 2x1, onde o solitario nunca teria quem adivinhasse", () => {
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

describe("nextTurn e fim de partida", () => {
  const time = (red: number, blue: number, cantou = 0) => [
    ...Array.from({ length: red }, (_, i) =>
      player({ seat: i, team: "red", spoke_count: cantou }),
    ),
    ...Array.from({ length: blue }, (_, i) =>
      player({ seat: red + i, team: "blue", spoke_count: cantou }),
    ),
  ];

  it("a dupla nao acaba na primeira rodada", () => {
    const squad = time(1, 1);

    expect(roundsFor(squad)).toBe(3);
    expect(isGameOver(squad)).toBe(false);
  });

  it("a dupla so acaba quando os dois cantaram as tres vezes", () => {
    expect(isGameOver(time(1, 1, 2))).toBe(false);
    expect(isGameOver(time(1, 1, 3))).toBe(true);
  });

  it("grupo grande nao vira maratona", () => {
    expect(roundsFor(time(4, 4))).toBe(1);
    expect(roundsFor(time(3, 3))).toBe(1);
    expect(roundsFor(time(2, 2))).toBe(2);
  });

  it("alterna os times a cada turno", () => {
    const squad = time(2, 2);
    const plano = nextTurn(squad, "red");

    expect(plano?.team).toBe("blue");
  });

  it("chama primeiro quem cantou menos", () => {
    const squad = [
      player({ seat: 0, team: "red", spoke_count: 2 }),
      player({ seat: 1, team: "red", spoke_count: 0 }),
      player({ seat: 2, team: "blue", spoke_count: 1 }),
      player({ seat: 3, team: "blue", spoke_count: 1 }),
    ];

    expect(nextTurn(squad, "blue")?.singerId).toBe("player-1");
  });

  it("nao deixa o jogo travar quando um time ficou sem ninguem", () => {
    const squad = [
      player({ seat: 0, team: "red", spoke_count: 0 }),
      player({ seat: 1, team: "red", spoke_count: 0 }),
    ];

    expect(nextTurn(squad, "red")?.team).toBe("red");
  });

  it("acabar e nao ter proximo turno sao a mesma coisa", () => {
    const formacoes = [
      [1, 1],
      [2, 2],
      [3, 2],
      [3, 3],
      [4, 4],
    ];

    formacoes.forEach(([red, blue]) => {
      const squad = time(red, blue);
      let anterior: Team | null = null;

      for (let volta = 0; volta < 60; volta += 1) {
        const acabou = isGameOver(squad);
        const plano = nextTurn(squad, anterior);

        expect(acabou).toBe(plano === null);

        if (plano === null) break;

        const cantor = squad.find((one) => one.id === plano.singerId);

        if (cantor) cantor.spoke_count += 1;

        anterior = plano.team;
      }
    });
  });

  it("todo mundo canta o mesmo tanto no fim", () => {
    const squad = time(2, 2);
    let anterior: Team | null = null;

    for (let volta = 0; volta < 60; volta += 1) {
      const plano = nextTurn(squad, anterior);

      if (plano === null) break;

      const cantor = squad.find((one) => one.id === plano.singerId);

      if (cantor) cantor.spoke_count += 1;

      anterior = plano.team;
    }

    expect(new Set(squad.map((one) => one.spoke_count)).size).toBe(1);
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


describe("um contra um", () => {
  const duo = [
    player({ seat: 0, team: "red" }),
    player({ seat: 1, team: "blue" }),
  ];

  it("reconhece o um contra um", () => {
    expect(isOneOnOne(duo)).toBe(true);
  });

  it("2x1 nao e um contra um", () => {
    expect(
      isOneOnOne([
        player({ seat: 0, team: "red" }),
        player({ seat: 1, team: "red" }),
        player({ seat: 2, team: "blue" }),
      ]),
    ).toBe(false);
  });

  it("sala vazia nao e um contra um", () => {
    expect(isOneOnOne([])).toBe(false);
  });

  it("no um contra um o acerto vai pro adversario, que foi quem adivinhou", () => {
    expect(scoringTeamFor("hit", "red", true)).toBe("blue");
  });

  it("fora do um contra um o acerto fica com o time de quem canta", () => {
    expect(scoringTeamFor("hit", "red", false)).toBe("red");
  });

  it("passar nunca pontua", () => {
    expect(scoringTeamFor("missed", "red", true)).toBeNull();
  });

  it("os dois lados pontuam ao longo da partida", () => {
    const beneficiados = new Set<string>();
    const squad = duo.map((one) => ({ ...one }));
    let previous: Team | null = null;

    for (let round = 0; round < 4; round += 1) {
      const plan = nextTurn(squad, previous);

      if (plan === null) break;

      const quem = scoringTeamFor("hit", plan.team, isOneOnOne(squad));

      if (quem) beneficiados.add(quem);

      const singer = squad.find((one) => one.id === plan.singerId);

      if (singer) singer.spoke_count += 1;

      previous = plan.team;
    }

    expect([...beneficiados].sort()).toEqual(["blue", "red"]);
  });
});

describe("formacoes que podem comecar", () => {
  const time = (red: number, blue: number) => [
    ...Array.from({ length: red }, (_, i) => player({ seat: i, team: "red" })),
    ...Array.from({ length: blue }, (_, i) =>
      player({ seat: red + i, team: "blue" }),
    ),
  ];

  it("libera o um contra um", () => {
    expect(canStart(time(1, 1))).toBe(true);
  });

  it("libera 2x2", () => {
    expect(canStart(time(2, 2))).toBe(true);
  });

  it("libera 3x2", () => {
    expect(canStart(time(3, 2))).toBe(true);
  });

  it("bloqueia uma pessoa so", () => {
    expect(canStart(time(1, 0))).toBe(false);
  });
});
