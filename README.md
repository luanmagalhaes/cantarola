# Cantarolá

Party game musical. Um jogador cantarola uma música sem dizer a letra, só a melodia, e o time tenta adivinhar qual é. Dois times, vermelho e azul. Ganha quem somar mais pontos.

O jogo tem duas versões, escolhidas na primeira tela. Elas mudam o fluxo inteiro a partir dali.

## Versão presencial

Todo mundo na mesma sala, um aparelho por pessoa. 45 segundos por turno.

1. O cantor da vez recebe 8 músicas, distribuídas em 2 cartas de 4.
2. Ele lê as músicas na tela dele. Ninguém mais vê.
3. O cronômetro de 45s começa. Ele cantarola só a melodia, sem falar a letra.
4. O time dele grita os palpites em voz alta. O cantor marca cada acerto na tela e passa para a próxima.
5. Acabou o tempo: as músicas não acertadas vão para a fase de roubo.
6. O time adversário tenta adivinhar as que sobraram. Cada uma que acertar vale ponto para ele.
7. O turno passa para o outro time. O jogo acaba quando todos já cantaram e os dois times tiveram o mesmo número de turnos.

A fase de roubo some quando o dono da sala desliga `steal_enabled`.

## Versão online

Cada um na sua casa. 90 segundos por turno.

1. O cantor da vez escolhe uma música entre as que recebeu.
2. Ele grava um áudio cantarolando e envia. O áudio vai para o bucket de storage.
3. O time recebe o áudio na tela e ouve quantas vezes quiser.
4. Cada jogador escreve o palpite. A resposta é comparada com o título por aproximação, então erro de acento ou de caixa não reprova.
5. Os 90s correm a partir do momento em que o áudio fica disponível.
6. No fim do turno os palpites são revelados junto com o título correto e a pontuação é aplicada.

O cantor pode ouvir a prévia da música no Deezer antes de gravar. O app avisa para ouvir de fone, sozinho, senão entrega a resposta para a sala.

## Pontuação

| Situação | Pontos | Para quem |
|---|---|---|
| Acerto do time do cantor | 1 | time do cantor |
| Roubo na fase final do turno | 1 | time adversário |
| Música não acertada por ninguém | 0 | — |
| Carta bomba acertada | 2 | quem acertou |

A carta bomba segue a mesma regra de roubo: se o time do cantor não pegar e o adversário pegar, os 2 pontos vão para o adversário.

## Modos extras

O dono da sala liga os modos na criação da sala. A cada rodada, um deles é sorteado (ou nenhum).

| Modo | Efeito |
|---|---|
| Assovio (`whistle`) | a rodada inteira é assoviada, sem cantarolar |
| Boca fechada (`hum`) | só "hummm", boca fechada |
| Bomba (`bomb`) | uma das músicas do turno vale 2 pontos, revelada só no fim |
| Duelo (`duel`) | os dois times respondem ao mesmo tempo, quem acertar primeiro leva |
| Sem roubo (`steal_enabled = false`) | desliga a fase de roubo do turno |

Os quatro primeiros são o tipo `Twist` em `src/types/game.ts`. O sem roubo é uma flag da sala, não entra no sorteio.

## Baralhos

| Baralho | Músicas |
|---|---|
| Nacional | 132 |
| Internacional | 138 |
| Misto | 270 |

Cada música tem título, artista e um trecho de letra que serve de dica. Os arquivos são `src/data/songs/national.ts` e `src/data/songs/international.ts`.

Dois títulos aparecem duas vezes no baralho nacional com artistas diferentes ("Ana de Amsterdam" e "Águas de Março"). São entradas distintas de propósito.

## Stack

- Next 16 (App Router, Turbopack) e React 19
- TypeScript em modo strict
- Tailwind 4
- Supabase (Postgres, Realtime e Storage)
- Vitest
- pnpm 10

## Rodar local

```bash
pnpm install
pnpm dev
```

O dev sobe em http://localhost:2001.

| Comando | O que faz |
|---|---|
| `pnpm dev` | servidor de desenvolvimento na porta 2001 |
| `pnpm build` | build de produção |
| `pnpm test` | testes do Vitest, uma passada |
| `pnpm test:watch` | testes em modo watch |
| `pnpm lint` | ESLint |
| `pnpm icons` | gera os ícones e o favicon a partir do wordmark |
| `pnpm sounds` | gera os efeitos sonoros do jogo |

Não rodar `pnpm build` com o `pnpm dev` ligado — corrompe a pasta `.next`.

## Variáveis de ambiente

Criar `.env.local` na raiz. O arquivo é ignorado pelo git.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

As duas primeiras vão para o navegador. `SUPABASE_SECRET_KEY` fica só no servidor, nunca em componente de cliente nem em variável com prefixo `NEXT_PUBLIC_`.

## Banco

Todas as tabelas usam o prefixo `ll_`. A migração inicial está em `supabase/migrations/0001_init.sql`.

| Tabela | Guarda |
|---|---|
| `ll_rooms` | sala, código, configuração, status |
| `ll_players` | jogadores, time, assento, quem é o dono |
| `ll_player_secrets` | segredo de sessão de cada jogador |
| `ll_turns` | turnos, cantor, modo sorteado, cronômetro |
| `ll_turn_songs` | as músicas de cada turno e o resultado de cada uma |
| `ll_draw_pile` | pilha de compra da sala, embaralhada na criação |
| `ll_results` | cada ponto marcado, com time e origem |
| `ll_matches` | partidas encerradas, para histórico e ranking do mês |

O código da sala tem 2 dígitos e é reciclado a cada 24h pela função `ll_generate_code()`.

Os áudios da versão online ficam no bucket `ll-audio` do Supabase Storage. As linhas de áudio e de palpite ainda não estão na migração — entram junto com a implementação do modo online.

## Convenções

- Todo identificador de código em inglês: variável, função, tipo, prop, arquivo, token de CSS, keyframe, valor de union type.
- Português só no texto que o jogador lê na tela e nas descrições dos testes.
- Zero comentário no código. Se precisa explicar, extrai função com nome que explique.
- Renomear rota é mudar a pasta e a string de navegação, as duas coisas.
- Commitar com o e-mail cadastrado na Vercel, senão o deploy é recusado.

O estado da construção e o que falta estão em `PLANO.md`.
