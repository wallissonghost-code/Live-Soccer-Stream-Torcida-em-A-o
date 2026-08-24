# Live Soccer Stream — Torcida em Ação

Protótipo web de futebol para live interativa. A torcida influencia a partida através de comandos, presentes e eventos em tempo real.

## Já incluído

- Campo completo e responsivo
- 11 jogadores por time + goleiros
- Bola e posse de jogo
- Placar e cronômetro
- Passe, chute, turbo, defesa e poder especial
- Energia, combo, torcida e aplausômetro
- Chat simulado
- Reações flutuantes
- Ranking da torcida
- Contagem de presentes
- API local `window.LiveSoccer` preparada para receber eventos externos

## Testes no console

```js
LiveSoccer.triggerGift('rose', 'Ghost', 'blue')
LiveSoccer.triggerGift('ball', 'Ghost', 'blue')
LiveSoccer.triggerGift('star', 'Ghost', 'blue')
LiveSoccer.triggerGift('box', 'Ghost', 'blue')
LiveSoccer.setViewers(1500)
```

## Próxima arquitetura recomendada

1. Frontend do jogo (este projeto)
2. Servidor WebSocket/Socket.IO para eventos em tempo real
3. Conector de live (TikTok ou outra plataforma permitida)
4. Painel administrativo separado
5. Motor de regras para mapear presentes/comandos em ações do futebol
6. Persistência de ranking, partidas e usuários

## GitHub Pages

O projeto é estático. Basta ativar **Settings → Pages → Deploy from a branch → main / root** para publicar.
