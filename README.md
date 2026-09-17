# Explottens: Survival — Playable Ad

A playable ad that recreates the **Survival** mode of
[`Explottens-FtP`](../Explottens-FtP) (the Unity project) in Phaser 3 + TypeScript,
built on [`@smoud/playable-sdk`](https://github.com/smoudjs/playable-sdk) and
[`@smoud/playable-scripts`](https://github.com/smoudjs/playable-scripts).

Everything ships as a single self-contained HTML file (~2 MB) with all art, the
game's own font, and code inlined.

## The loop

Swipe anywhere to fly. The plane auto-fires at the nearest enemy. Cat planes and
bug-bots close in from every side; kills and shot-open loot boxes drop XP gems that
magnet in, and the XP bar fills twice — once into a weapon upgrade, once into
**Kitty Rage**: ten seconds of the sky turned orange, the plane doubled in speed and
untouchable, and six plasma bolts a tenth of a second going out in every direction at
fifty times a normal shot. A mini-boss rides in on that horde, and taking it down ends
the run on the victory card. About 22 seconds, start to CTA.

## The brief

The run is the seven beats of *Playable Ad Brief: Roguelite — "Explottens - Rogue
Arcade"* (`Playable Ad Brief_ Explottens Survivor-1.pdf`), in order. It is a script,
not a clock: every beat ends on its own condition — the first swipe, the XP bar
filling, the evo pick, the mini-boss dying — so the copy on screen can never describe
something the player is not doing. Brief note 5 (*evo weapon upgrades happen in the
same level, no scene change*) is why it is one continuous `GameScene` from the intro
to the CTA: no cuts, no reloads.

| # | Beat | What the player sees | Where |
|---|---|---|---|
| 1 | Intro | "Survive, Upgrade, Evolve!" over a small arena already holding enemies **and loot boxes**; a finger cue rides on the plane until the first swipe | `BEATS.intro`, `Hud.build`, `GameScene.begin` |
| 2 | Combat loop | auto-attack, health bar, gems on every kill, and the **Attack → Loot → Upgrade** panel tracking the beat; loot boxes sparkle and burst when shot | `BEATS.combat`, `Hud.onBeat`, `GameScene.updateCrates` |
| 3 | Single attack weapon | "Collect gems!" with the XP bar and the ability menu ringed while it is up | `BEATS.combat.text`, `Hud.update` |
| 4 | Weapon upgrade | "Upgrade your weapon to deal more damage!" over three weapons; the pick flashes, sparks and glows, and lands on a power-up cue | `BEATS.upgrade`, `Hud.pickFlash` |
| 5 | Evo upgrade | "Evolve your weapon for unstoppable power!"; the evo is dealt first with an animated cursor on it, and taking it drops the horde and the berserk sting | `BEATS.evo`, `Hud.makeCursor`, `GameScene.startEvo` |
| 6 | Evo attack | "Unleash your evolved attacks!" over the mini-boss wave, the spray auto-targeting, loot scattering as it dies | `BEATS.evoAttack`, `GameScene.startMiniBossWave` |
| 7 | Win | wave cleared, confetti, a green **WIN** stamp and "Victory! Your hero is unstoppable!", then the end card: app logo and **PLAY NOW** | `BEATS.win`, `Hud.showVictory` |

Brief note 1's urgency timer counts **down**, and blinks red over a dramatic cue for
its last three seconds (`BEATS.timer`). It is a backstop — the mini-boss normally dies
with time in hand — and running it out still ends on the CTA, because an ad never
punishes the player. For the same reason `BEATS.win.noFail` clamps the plane at 1 HP:
the health bar still drops, which is where the tension the brief asks for lives, but
the brief describes one ending and it is the win.

Everything the brief lists under **Editable Elements** — enemy counts, loot type,
weapon and skill pools, upgrade and evolution visuals, boss enemy type, loot boxes,
CTA text and colour, every line of copy — is a field of `BEATS`, `BEAT_WAVE` or
`CRATE` in `src/data.ts`.

## What came from the Unity project

| Playable | Source in `Explottens-FtP` |
|---|---|
| XP curve `40L² + 80L − 20` | `Assets/Scripts/GameplayScripts/InGameXpHandler.cs` |
| Gem values 10 / 40 / 100 / 2000 | `Assets/Prefabs/Collectibles/XpItem.prefab` |
| Base ATK 10 / HP 100 | `Assets/Scripts/Player/PlayerStats.cs`, `Resources/CSV/SurvivorData/SurvivorLevelUpData.csv` |
| Skill names, descriptions, icons | `Assets/Prefabs/Skills/**/*.prefab` (`title` / `description` / `mainSprite`) |
| Wave shape (pool, interval, burst, cap) | `Assets/Scripts/EnemyWaves/EnemyWaveData.cs`, `EnemyWaveController.cs` — the brief's beat picks the row, where the game uses the stage clock |
| Loot box art and its pop | `Assets/SpineObjects/Chests/chest.json` (`Cadet` skin), `Audios/SFX/chestOpen.mp3` |
| Power-up, evolution, urgency and victory cues | `Audios/SFX/powerUpCollected.mp3`, `Audios/BGM/BerserkAudioStart.mp3`, `Audios/SFX/upcomingWave.mp3`, `Audios/SFX/victory.mp3` |
| Camera field of view and follow | `Assets/Scenes/GameplayScene.unity` (perspective, 60° vertical FOV), `Assets/Scripts/Stage/StageManager.cs` (`SetCamZoom(28, 1.5f)` = 32.3 world units of height), `Assets/Scripts/Camera/CameraMovement.cs` (locked to the plane, not trailing) |
| Hero plane, every enemy, the boss | Spine skeletons under `Assets/SpineObjects/**`, baked to animated sprite strips |
| Chaos Guard's reach, damage step and re-hit gate | `Resources/CSV/Equipment/ActiveSkillsData.csv` rows `Shield1`..`Shield5` — `CollisionRadius` 1 → 3 world units is the bubble, `HitCoolDown` 1 s is how long an enemy inside it waits to be hit again |
| Kitty Rage (the Berserk special) | `Assets/Prefabs/Skills/Specials/Berserk.prefab` (title, blurb), `Scripts/Skills/Specials/Berserk.cs` and `Skills/Skill/SpecialSkill.cs` (the spiralling six-bolt volley, `EnableBerserkMode`), `Resources/CSV/Equipment/SpecialSkillData.csv` + `SpecialSkillBulletData.csv` rows `Berserk1` (10 s, 50x damage, `plasmaRed`) |
| Shockwave Strike (bolt, targeting, cadence) | `Assets/Scripts/Skills/Actives/WeaponScripts/Lightning/` — `Lightning.cs` and the `LightningAttack` skeleton, plus `Resources/CSV/Equipment/ActiveSkillsData.csv` rows `Lightning1..5` |
| Gems, coins, meat, magnet | `Assets/Sprites/Collectibles/Collectible.png` |
| Sky gradient, cloud layers | `Assets/BG/BGDataNew/.../BG_Day_SpriteSheet.png`, `BGDataOld/.../clouds*.png` |
| Sea, rocks, and the floor the plane skims | `BGCollectionRevamped/BG_AtlantisDay.asset` (four rock layers, their spread, scale and depth — the set the shipped survival map uses, matched against a screen recording of it), `BG10 - AtlantisDay/*` art, `BG- Misc/horizon.png` and the waterfall set's `Foam_BaseComplete.png` for the waterline, `BackgroundController.cs` (`waterTopY` -3.8, `SetPropInLayer`), `StageManager.cs` (`LOWERBOUNDARY` -4 for an Endless stage, camera floor -19) |
| HUD icons (time / kills / wave) | `Assets/Survival/*_Icon.png` |
| Font (Luckiest Guy) | `Assets/GameFont/LuckiestGuy-Regular.ttf`, subset to ASCII and re-encoded woff2 (58 KB → 11 KB) |
| Store package name | `Assets/google-services.json` |

### How the characters were made

Two skeletons run live on the Spine runtime, trimmed and repacked by
`tools/build_spine.py`: the player (it rolls through `flip1` on a direction switch) and
the Shockwave Strike bolt (its jitter, strobe and fade are all slot-colour timelines a
strip flattens away). Everything else is evaluated offline and baked to sprite strips —
shipping every skeleton is not an option, `player.json` alone is 3.2 MB against a whole
ad budget of ~2 MB:

1. Sample the skeleton's own animation at `duration x 30` evenly-spaced times (the
   player plays `flying1`, everyone else an `idle`), interpolating bone
   rotate/translate/scale through Spine's linear, stepped and cubic-bezier curves.
   30 is the authoring rate: every keyframe in this project lands on a 1/30 s
   boundary and every duration is an exact multiple of it, and Spine omits
   `skeleton.fps` from the export when it equals its 30 default.
2. Resolve each slot's attachment for that frame, then draw region attachments as
   affine quads and mesh attachments triangle-by-triangle through their UVs —
   including weighted meshes and per-frame deform offsets, which is what moves the
   pilot's scarf and the wings.
3. Pack the frames into one horizontal strip on a shared bounding box so the sprite
   never jitters between cells, then quantize to 48 colours.

Phaser loads each strip with `load.spritesheet` and loops it over the animation's real
duration, so every character plays back at the same 30 fps it does in Unity. Enemies
start at a random point in the loop so a wave doesn't flap in lockstep.

`tools/build_assets.py` writes the `SHEETS` table in `src/data.ts` itself — frame
sizes and counts are derived from the PNGs it just produced rather than kept in sync
by hand. `createAnims` also takes its frame count from the decoded texture, so a
stale entry degrades the loop instead of throwing.

Cells are baked 1:1 with their on-screen size. The game canvas is CSS-pixel sized
rather than device-pixel sized, so oversampling buys no sharpness and is paid for
twice — once in PNG bytes, again in base64 inflation. Dropping from 1.35x to 1:1 is
what paid for the jump from 12-15 fps to the full 30.

One deliberate substitution: vaderboss ships two idle loops and the strip uses the
shorter `idle2` (0.53 s) rather than `idle` (1.0 s). Same 30 fps, half the frames —
`idle` alone was 126 KB, which did not fit.

### Kitty Rage

Unity hangs a whole Spine skeleton behind the plane for the rage backdrop
(`SpineObjects/BerserkNew`): an orange quad, three sunburst layers turning at different
rates and a pair of soft strobes, all additive at around 8% alpha. That is a 512x512
page and a skeleton for two shapes, so `startEvo` draws both instead — the spokes once
into a generated texture, the core glow into a canvas gradient. Nothing new ships in the
bundle for it beyond the bolt and the skill icon (7 KB between them). The three layers
carry different spoke counts (18 / 24 / 30) rather than three copies of one: layers that
share a count drift into phase every couple of seconds and the fine shimmer collapses
into a pinwheel.

The backdrop is drawn at its own depth over the sea *and over the gems*, which is why
the loot the rage drops only appears when it ends — the same reveal the game plays.

Two things are the ad's rather than the game's: the swarm is thickened for the ten
seconds (`EVO.intervalMul` / `burstBonus` / `capMul`) or the spray empties the sky in two
volleys, and the level-ups a rage banks are queued as separate picks, capped at three,
the first of them held back 1.2 s so the gem carpet is not covered by a card the frame
the orange cuts.

## Tuning that is *not* from the game

A real Survival run lasts 10–20 minutes; this ad has ~22 seconds. These knobs are
deliberately different and are marked as such in `src/data.ts`:

- The XP bar is a **pacing device**, not the game's curve. `BEATS.combat.xp` and
  `BEATS.evo.xp` size its two scripted fills so they land on beats 4 and 5;
  `InGameXpHandler`'s own `40L² + 80L − 20` takes over afterwards and from there only
  moves the level counter. `XP_RATE` still scales what a gem is worth.
- `BEATS.evoAttack.hpMul` multiplies the mini-boss's HP by 55. Kitty Rage hits for 50×
  a normal shot, so at its stock 420 HP the mini-boss is a speed bump rather than the
  fight beat 6 is supposed to showcase.
- `PLAYER.health` is 140 rather than 100.
- Enemy `speed` values are raised so the swarm can close on a 250 px/s plane in a
  camera-sized arena.
- `SHIELD.draw` scales Chaos Guard's whole radius curve up by 1.7, and `SHIELD.minRadius`
  floors it at 2.4 units. The table's level-1 radius is 1 world unit against a 2.26-unit
  plane: drawn honestly that is a ring underneath the plane art, and even once it is
  visible the plane bursts out of it through a `flip1` roll, where the pose swells and
  the art centre the ring is pinned to lags a frame behind. The floor only bites on
  levels 1–2. The bubble is drawn at whatever it hits at, so the ring on screen *is* the
  hitbox at every level, and the table's 1 : 1.5 : 2 : 2.5 : 3 proportions are kept
  above the floor.

## Layout

- `src/index.ts` — SDK init, font registration, Phaser boot
- `src/Game.ts` — `Phaser.Game` shell wired to the SDK lifecycle
- `src/GameScene.ts` — arena, player, waves, weapons, pickups, level-ups
- `src/Hud.ts` — run stats, boss bar, level-up picker, end card
- `src/data.ts` — the tables above (assets, skills, enemies, waves)
- `assets/` — extracted art + the game font

## Build

```bash
npm install
npm run dev                 # dev server with HMR
npm run build               # dist/Explottens_Survival_v1_<date>_en_<network>.html
./build-all.sh              # one file per ad network (needs build.js)
```

`build.json` carries the store links. The Google Play URL is the real package
(`com.playdew.explottensurvivors`); **the iOS link is a placeholder** — the
numeric App Store ID is not in the Unity repo, so swap it before shipping.

`build.js` and `dev.js` wrap `playable-scripts` to add `target: ['web','es5']` plus
`exportsPresence: 'error'` — webpack otherwise only *warns* when a named import does
not exist and hands you `undefined` at runtime. `babel.config.json`
down-levels the rest (Phaser included) — Mintegral rejects bundles that are not ES5. Note `loose: true` must stay off in that preset: it makes
Babel assume every spread target is an array, which silently turns
`[...map.values()]` into `[].concat(mapIterator)`.

## Verification

`GameScene` exposes itself on `window.__scene` so a headless run can read live state
(`state`, `elapsed`, `kills`, `level`, `hp`, `enemies`, `projs`). The build was checked
that way at 400x720, 780x400, 768x1024, 1024x768 and 320x640 plus a mid-run rotation:
60 fps throughout, no console or page errors, and no network request of any kind
leaving the page.
