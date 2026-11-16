# EMBERLINE — Foundry Yard

A round-based tactical FPS in three.js, Counter-Strike-style, never a copy:
two teams (Vanguard attacks, Cinder defends), short rounds won by eliminating
the enemy team or by planting/defusing the spike, money between rounds to buy
weapons, and gunfire where accuracy counts more than speed.

## Play

```sh
node serve.ts
# open http://localhost:8080
```

WASD move, mouse look, click fire, R reload, G frag grenade, E plant/defuse
the spike at site A or B, 1–5 buy weapons in the buy phase, Ctrl crouch,
Space jump. First team to 5 rounds wins the match.

## Structure

- `game/index.html` — page + HUD (health, ammo, money, timer, score, bomb)
- `game/src/main.js` — fixed-step loop, rounds, economy, plant/defuse
- `game/src/world.js` — Foundry Yard map: Long A, Mid, Short B, sites A/B
- `game/src/bots.js` — bot FSM: routes, holds, line of sight, hearing
- `game/src/weapon.js` — 5 weapons + frag grenade, recoil/spread
- `game/src/bomb.js`, `game/src/grenades.js`, `game/src/audio.js` — objective, grenades, synth sound
- `game/src/player.js`, `game/src/input.js`, `game/src/hud.js`, `game/src/state.js`, `game/src/palette.js`

Static files only, no build step, no network request. three.js 0.187.0 is
vendored under `game/vendor/three/`.

## Entry

`main.ts` hands the game in: it copies `game/` and `screenshots/` to
`/output` and writes `/output/dossier.json` with the kit's
`vendor/makefun-threejs.ts`.

## License

MIT — see LICENSE.
