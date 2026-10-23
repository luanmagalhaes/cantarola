export const copy = {
  brand: {
    name: "Cantarolá",
    firstLine: "CANTA",
    secondLine: "ROLÁ",
    tagline: "Cantarole, ninguém precisa afinar",
  },
  splash: {
    hint: "toque para começar",
  },
  modes: {
    question: "Como vocês vão jogar?",
    local: {
      title: "Presencial",
      line: "Todo mundo na mesma sala",
      detail: "Você canta ao vivo, o time grita o nome da música. 60 segundos.",
    },
    online: {
      title: "Online",
      line: "Cada um na sua casa",
      detail:
        "Você grava um áudio cantarolando, o time ouve e escreve o palpite. 90 segundos.",
    },
  },
  home: {
    title: "Quem vai cantar?",
    nameField: "Seu nome",
    namePlaceholder: "Como te chamam",
    create: "Criar sala",
    join: "Entrar numa sala",
    codeField: "Código da sala",
    codePlaceholder: "00",
    confirmJoin: "Entrar",
    back: "Voltar",
    changeMode: "Trocar de versão",
    rules: "Como se joga",
    history: "Histórico",
  },
  teams: {
    red: "Vermelho",
    blue: "Azul",
    tie: "Empate",
  },
  decks: {
    national: {
      name: "Nacional",
      description: "Só música brasileira que todo mundo já cantou no chuveiro.",
    },
    international: {
      name: "Internacional",
      description: "Pop, rock e diva gringa do refrão que ninguém esquece.",
    },
    mixed: {
      name: "Misto",
      description: "Tudo embaralhado. Sai brasileira e gringa na mesma rodada.",
    },
  },
  twists: {
    whistle: {
      name: "Só assovio",
      description: "Nada de cantarolar. Nessa rodada é assovio puro.",
    },
    hum: {
      name: "Boca fechada",
      description: "Cantarole sem abrir a boca. Só o hum.",
    },
    bomb: {
      name: "Carta bomba",
      description: "Uma música da rodada vale 2 pontos. Você não sabe qual.",
    },
    duel: {
      name: "Duelo",
      description: "Quem gritar o nome primeiro leva, seja de qual time for.",
    },
  },
  steal: {
    name: "Roubo",
    description:
      "Acabou o tempo com música sobrando? O time adversário tenta uma.",
  },
  preview: {
    button: "Não conheço essa",
    warningTitle: "Ouça sozinho",
    warningBody:
      "Vai tocar um pedaço da música. Se alguém do seu time escutar, acabou a graça.",
    warningRule: "Coloque o fone. Sério.",
    confirm: "Tô de fone, pode tocar",
    cancel: "Deixa pra lá",
    missing: "Não achei essa música pra tocar. Tente outra.",
  },
  errors: {
    emptyName: "Escreva seu nome primeiro.",
    shortCode: "O código tem 2 números.",
    offline: "A internet sumiu. Tente de novo.",
    generic: "Deu ruim aqui. Tente de novo.",
    noMicrophone: "Preciso do microfone pra você gravar. Libere e tente de novo.",
  },
} as const;
