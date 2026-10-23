# Cantarolá: estado da construção

Documento de trabalho. Atualizar conforme avança.

## Decisões fechadas com o Luan

| Tema | Decisão |
|---|---|
| Nome | Cantarolá, repo privado |
| Paleta | uva `#512664`, limão `#f0dc05`, ouro `#fab200`, âmbar `#ffbd1b`, coral `#eb5c5a`, creme `#fffbc4` |
| Porta dev | 2001 |
| Prefixo do banco | `ll_` |
| Código da sala | 2 números, reciclagem de 24h |
| Baralhos | nacional, internacional, misto |
| Tempo presencial | 45s |
| Tempo online | 90s |
| Modos | assovio, boca fechada, carta bomba, duelo, sem roubo |
| Deezer | prévia para o cantor, com pop-up de "ouça sozinho" |
| Histórico | partidas + ranking do mês, como no Não Vale |

## Feito

- [x] Projeto criado, configs copiadas do Não Vale, `pnpm install`
- [x] Paleta e animações em `globals.css`
- [x] `copy.ts`, layout, Wordmark, Button, Splash, HomeScreen inicial
- [x] Rodando em http://localhost:2001
- [x] Banco: 8 tabelas `ll_*` + `ll_generate_code()` com reciclagem de 24h
- [x] Modo online: `ll_takes`, `ll_guesses`, bucket `ll-audio`, coluna `play_mode`
- [x] `lib/deezer.ts` (findPreview copiado do Vitrola)
- [x] `types/game.ts`
- [x] Repertório: `data/songs/national.ts` e `international.ts`

## Falta

- [ ] Primeira tela dividida: **Presencial** x **Online**
- [ ] `data/songs/index.ts` — monta as músicas com id e origem, `songsFor(deckMode)`
- [ ] `lib/game/rules.ts` — pontuação, ordem de turnos, times, fim de jogo (todos cantam, times empatam turnos)
- [ ] `lib/game/service.ts` + rotas `/api/*`
- [ ] Modo presencial: tela do cantor com as 8 músicas, cronômetro, acerto/erro, fase de roubo
- [ ] Modo online: gravador (`useRecorder`), upload, lista de áudios, modal de palpite com `answerMatches`
- [ ] Sorteio dos modos por rodada (`twist`)
- [ ] Pop-up do Deezer ("ouça sozinho, de fone")
- [ ] Histórico + ranking do mês
- [ ] Tutorial em slides, sons, ícone/favicon, PWA, `proxy.ts` de rotas
- [ ] Testes do vitest, README, repo privado, deploy Vercel

## Armadilhas já conhecidas

- Commit com `m.agalhaes@hotmail.com`, senão a Vercel recusa o deploy
- Não rodar `pnpm build` com o dev ligado (corrompe `.next`)
- Renomear rota é pasta **e** string de navegação juntas
- Nada de `setState` no corpo de efeito (erro no Next 16)
- Código em inglês, texto visível em português
