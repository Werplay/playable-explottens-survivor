// Game data lifted from the Explottens-FtP Unity project (Survival mode).
// Skill names / descriptions: Assets/Prefabs/Skills/**.prefab
// XP curve + gem values: Assets/Scripts/GameplayScripts/InGameXpHandler.cs, Prefabs/Collectibles/XpItem.prefab
// Base stats: Assets/Scripts/Player/PlayerStats.cs, Resources/CSV/SurvivorData/SurvivorLevelUpData.csv

import fontUrl from 'assets/LuckiestGuy-Regular.woff2';

import spinePng from 'assets/spine_player.png';
import spineAtlas from 'assets/spine_player.atlas';
import spineJson from 'assets/spine_player.json';
import boltPng from 'assets/spine_bolt.png';
import boltAtlas from 'assets/spine_bolt.atlas';
import boltJson from 'assets/spine_bolt.json';
import eFurry from 'assets/e_furry.png';
import eFeline from 'assets/e_feline.png';
import eSpeedbug from 'assets/e_speedbug.png';
import eLadybug from 'assets/e_ladybug.png';
import eHelmetbee from 'assets/e_helmetbee.png';
import eBomberkitty from 'assets/e_bomberkitty.png';
import eRazorclaw from 'assets/e_razorclaw.png';
import eHammerhead from 'assets/e_hammerhead.png';
import eBoss from 'assets/e_boss.png';
import hit from 'assets/hit.png';
import boom from 'assets/boom.png';

import sky from 'assets/sky.png';
import clouds1 from 'assets/clouds1.png';
import clouds2 from 'assets/clouds2.png';
import water from 'assets/water.png';
import rock1 from 'assets/rock1.png';
import rock2 from 'assets/rock2.png';
import rock3 from 'assets/rock3.png';
import rockFar1 from 'assets/rock_far1.png';
import rockFar2 from 'assets/rock_far2.png';
import horizon from 'assets/horizon.png';
import foam from 'assets/foam.png';
import endcard from 'assets/endcard.jpg';
import endcardBg from 'assets/endcard_bg.jpg';
import playstore from 'assets/playstore.png';
import appstore from 'assets/appstore.png';

import gemGreen from 'assets/gem_green.png';
import gemBlue from 'assets/gem_blue.png';
import gemGold from 'assets/gem_gold.png';
import meat from 'assets/meat.png';
import crate from 'assets/crate.png';
import hudPortrait from 'assets/hud_portrait.png';

import bullet from 'assets/bullet.png';
import bulletLong from 'assets/bullet_long.png';
import wCroissant from 'assets/w_croissant.png';
import wYarnball from 'assets/w_yarnball.png';
import wPropeller from 'assets/w_propeller.png';
import wFish from 'assets/w_fish.png';
import wShield from 'assets/w_shield.png';
import wPlasma from 'assets/w_plasma.png';

import iMulticanon from 'assets/i_multicanon.png';
import iCroissant from 'assets/i_croissant.png';
import iLightning from 'assets/i_lightning.png';
import iShield from 'assets/i_shield.png';
import iPropeller from 'assets/i_propeller.png';
import iYarnball from 'assets/i_yarnball.png';
import iRazorfin from 'assets/i_razorfin.png';
import iWarmachine from 'assets/i_warmachine.png';
import iAttack from 'assets/i_attack.png';
import iSpeed from 'assets/i_speed.png';
import iHealth from 'assets/i_health.png';
import iArmor from 'assets/i_armor.png';
import iMagnet from 'assets/i_magnet.png';
import iXp from 'assets/i_xp.png';
import iCooldown from 'assets/i_cooldown.png';
import iBulletspeed from 'assets/i_bulletspeed.png';
import iBerserk from 'assets/i_berserk.png';

import bgm from 'assets/bgm.mp3';
import sfxShoot from 'assets/sfx_shoot.mp3';
import sfxHit from 'assets/sfx_hit.mp3';
import sfxBoom from 'assets/sfx_boom.mp3';
import sfxHurt from 'assets/sfx_hurt.mp3';
import sfxLevelup from 'assets/sfx_levelup.mp3';
import sfxTap from 'assets/sfx_tap.mp3';
import sfxPowerup from 'assets/sfx_powerup.mp3';
import sfxCrate from 'assets/sfx_crate.mp3';
import sfxUrgent from 'assets/sfx_urgent.mp3';
import sfxVictory from 'assets/sfx_victory.mp3';
import sfxEvo from 'assets/sfx_evo.mp3';

import hudTime from 'assets/hud_time.png';
import hudKills from 'assets/hud_kills.png';
import hudWave from 'assets/hud_wave.png';

/** The player HUD, measured off `Sprites/GameHud/PlayerHuds/PlayerHud/PlayerHUD.json` -
 *  the Spine assembly the game draws it with - and off a recording of it running.
 *
 *  Only the portrait ships as art (the riveted ring, its orange inner frame and the
 *  pilot, composited to one 72px sprite). The housing, the troughs and the two fills are
 *  flat shapes in the skeleton, so they are drawn rather than shipped; the colours below
 *  are sampled from the atlas regions themselves, not from the video. */
export const HUD = {
  /** KIT/Explottens_KIT_Bars_base, KIT/Explottens_KIT_Red_Main */
  plate: 0x520e00,
  plateRim: 0xc52b12,
  trough: 0x1f1205,
  /** KIT/Explottens_KIT_Green_Bars: core, and the lighter sweep across its top */
  hp: 0x12ff30,
  hpShine: 0x7bff8e,
  /** KIT/Explottens_KIT_Orange_Bars */
  xp: 0xf4981a,
  xpShine: 0xfccc1d,
  /** How big the whole status assembly - portrait, slab, both bars, cap icons - draws
   *  against the rest of the HUD. It is a status readout, not the furniture: at 1 it
   *  was a billboard across the top of the arena. */
  barScale: 0.76,
  /** the heart at the health bar's cap; the XP bar's cap is the game's own green gem */
  heart: 0xe8354a,
  heartShade: 0x9c1b2c
};

export const FONT = 'LuckiestGuy';
export const FONT_URL = fontUrl;

/** The player runs the real Spine skeleton (see tools/build_spine.py); everyone else is
 *  baked out of their skeletons as horizontal strips playing `idle`.
 *
 *  The atlas ships as a data URL whose page line still names the loose PNG, so the page
 *  name is swapped for the inlined image before the loader ever sees it. */
export const SPINE = {
  key: 'player_spine',
  png: spinePng,
  atlas: spineAtlas,
  json: spineJson,
  skin: 'playerPlane1',
  page: 'spine_player.png',
  /** Draws the flying loop 67px wide - the width the old baked strip used. */
  scale: 0.1039
};

/** Shockwave Strike runs its skeleton too (Assets/Scripts/Skills/Actives/WeaponScripts/
 *  Lightning/LightningAttack.json, the `attack3` Lightning.cs plays). The bolt jitters,
 *  strobes and fades through slot-colour timelines a sprite strip flattens away.
 *
 *  `reach` is how far the skeleton draws above its own origin, in skeleton units -
 *  Lightning.cs sets the effect's position to the target, so that is the length
 *  GameScene has to scale to get the bolt in from off the top of the screen. */
export const BOLT = {
  key: 'bolt_spine',
  png: boltPng,
  atlas: boltAtlas,
  json: boltJson,
  page: 'spine_bolt.png',
  anim: 'attack3',
  duration: 0.8333,
  reach: 2867
};

/** The Survival camera, measured off the Unity project rather than eyeballed.
 *
 *  It is a perspective camera with a 60 degree vertical FOV (GameplayScene.unity, the
 *  scene that carries InGameXpHandler) and CameraMovement parks it behind the plane at
 *  the distance StageManager.Initialize asks for - `SetCamZoom(28, 1.5f)`. That is
 *  2 x 28 x tan(30) = 32.3 world units of height, whatever the aspect: the FOV is
 *  vertical, so a narrower screen shows less width, never less height. Stage1.csv walks
 *  the distance back to 32 / 34 / 36 / 38 as the waves thicken (at 60 / 120 / 210 / 350
 *  seconds), which a 95 second run never reaches.
 *
 *  `pxPerUnit` puts that in this game's pixels. The plane's skeleton is 644.8 units
 *  across; Unity draws it at the SkeletonDataAsset's 0.01 scale under the Player
 *  prefab's own 0.35, so it is 2.257 world units wide, and build_spine.py bakes it to
 *  67px. Everything else follows from those two numbers, so the camera holds its field
 *  of view on any canvas the ad lands in.
 *
 *  Not matched: the art's own proportions. Unity's enemy planes run at Scale 0.28-0.6
 *  (Resources/CSV/StageData/Stage*.csv) - the same 2.2 units as the player - where the
 *  playable bakes them at two thirds of the plane, and gems at 26px against the 19px
 *  their 0.65 units would give. That is a re-bake of every strip, not a camera setting. */
export const CAM = {
  /** world units of height the camera shows - 2 x 28 x tan(FOV/2) */
  units: 32.33,
  /** 67px of baked plane / 2.2568 world units */
  pxPerUnit: 29.69
};

/** The sea under the arena and the rocks standing in it.
 *
 *  The survival map runs the AtlantisDay set (BGCollectionRevamped/BG_AtlantisDay.asset):
 *  a blue water plane and four layers of sandstone stacks, each layer with its own count,
 *  scale range, spread and depth. BackgroundController puts the surface at `waterTopY`
 *  (-3.8 in GameplayScene) and the rocks below it, so what stands above the waterline is
 *  their upper half; the water plane is drawn nearer than any of them, which is what cuts
 *  them off at the surface.
 *
 *  The game's camera is perspective, so depth does the parallax and the shrinking for it:
 *  a layer at z draws at 28/(28+z) of the movement and the size of the arena plane, the
 *  arena being z=0 and the camera 28 back. The water sits at z=-3, in front of the rocks.
 *
 *  `floor` is where the plane stops: StageManager.SetStageBoundaries(Endless) fixes
 *  LOWERBOUNDARY at -4, half a plane above the water. `camFloor` is the camera's own,
 *  which the same method sets 15 units lower (`SetCameraBoundaries(-19, ...)`) - that
 *  gap is why the sea fills the bottom of the screen instead of a sliver. */
export const BG = {
  waterY: -3.8,
  floor: -4,
  camFloor: -19,
  /** the water plane's own depth, z = -3 (BackgroundController.CreateWaterTop) */
  waterK: 28 / (28 - 3),
  /** and its height: WaterTopPrefabNew scales the 0.32-unit sprite by 75.12 */
  waterH: 24.04,
  /** HorizonPrefabNew: the 0.21-unit white band scaled 5x, at 69% alpha */
  horizonH: 1.05,
  /** the surf laid along the surface, kept to the band the recording shows */
  foamH: 0.8,
  /** distance the camera sits behind the arena plane, which sets every `k` */
  camZ: 28,
  /** each rock's width in world units - its png at Unity's 100 pixels per unit */
  rockW: { rock1: 12.17, rock2: 6.3, rock3: 8.33, rock_far1: 6.03, rock_far2: 4.55 },
  /** BG_AtlantisDay.asset propsLayer1..4, nearest first. SetPropInLayer draws each rock's
   *  own z out of the layer's range and its own scale out of `scale` + up to `grow` on
   *  top (layer 1 grows by twice its own scale, the rest by a flat 2), then mirrors half
   *  of them - so a layer is a spread of sizes and depths, not one repeated cutout.
   *
   *  The two far layers run the same back rocks the game's own bgRock silhouettes are a
   *  washed-out copy of, so they are drawn through a haze alpha instead. */
  layers: [
    { y: -4.9, scale: 0.65, grow: 1.3, count: 13, spread: 48.54, zMin: 3.88, zMax: 7.77, alpha: 1, tex: ['rock1', 'rock2', 'rock3'] },
    { y: -5.5, scale: 1, grow: 2, count: 4, spread: 48.54, zMin: 10, zMax: 18, alpha: 1, tex: ['rock1', 'rock2', 'rock3'] },
    { y: -6.5, scale: 2, grow: 2, count: 7, spread: 72.82, zMin: 20, zMax: 24, alpha: 0.85, tex: ['rock_far1', 'rock_far2'] },
    { y: -9.5, scale: 3.5, grow: 2, count: 7, spread: 72.81, zMin: 25, zMax: 28, alpha: 0.45, tex: ['rock_far1', 'rock_far2'] }
  ]
};

/** Character art is baked out of the Spine skeletons as horizontal strips playing
 *  `idle`, each at its own skeleton's rate. */
export interface Sheet {
  url: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  fps: number;
}

export const SHEETS: Record<string, Sheet> = {
  e_furry: { url: eFurry, frameWidth: 44, frameHeight: 50, frames: 40, fps: 30.0 },
  e_feline: { url: eFeline, frameWidth: 48, frameHeight: 51, frames: 40, fps: 30.0 },
  e_bomberkitty: { url: eBomberkitty, frameWidth: 52, frameHeight: 61, frames: 15, fps: 30.0 },
  e_razorclaw: { url: eRazorclaw, frameWidth: 54, frameHeight: 56, frames: 40, fps: 30.0 },
  e_hammerhead: { url: eHammerhead, frameWidth: 81, frameHeight: 77, frames: 40, fps: 30.0 },
  e_speedbug: { url: eSpeedbug, frameWidth: 34, frameHeight: 24, frames: 10, fps: 30.0 },
  e_helmetbee: { url: eHelmetbee, frameWidth: 34, frameHeight: 28, frames: 20, fps: 30.0 },
  e_ladybug: { url: eLadybug, frameWidth: 36, frameHeight: 38, frames: 30, fps: 30.0 },
  e_boss: { url: eBoss, frameWidth: 150, frameHeight: 174, frames: 16, fps: 30.0 },
  boom: { url: boom, frameWidth: 80, frameHeight: 65, frames: 16, fps: 30.0 },
  hit: { url: hit, frameWidth: 30, frameHeight: 47, frames: 4, fps: 30.0 }
};

/** SFX from the Unity project's Assets/Audios/SFX, baked by tools/build_assets.py.
 *  Volumes are the ones the Unity call sites pass. `gap` is the shortest time between
 *  retriggers: a survivor loadout fires far faster than these clips run, and a stack of
 *  the same shot reads as noise rather than as a gun. */
export interface Sound {
  url: string;
  volume: number;
  gap: number;
}

export const SOUNDS: Record<string, Sound> = {
  /** The whole gameplay track GameManager.cs runs for this mode, at its volume: 85.5s
   *  against a ~95s run, so it plays through rather than looping a phrase. */
  music: { url: bgm, volume: 0.25, gap: 0 },
  shoot: { url: sfxShoot, volume: 0.5, gap: 0.1 },
  hit: { url: sfxHit, volume: 0.15, gap: 0.06 },
  boom: { url: sfxBoom, volume: 0.35, gap: 0.09 },
  hurt: { url: sfxHurt, volume: 0.5, gap: 0.4 },
  levelup: { url: sfxLevelup, volume: 0.6, gap: 0 },
  tap: { url: sfxTap, volume: 0.5, gap: 0 },
  /** brief 4: the power-up cue on an upgrade pick */
  powerup: { url: sfxPowerup, volume: 0.55, gap: 0 },
  /** brief 2: a loot box popping */
  crate: { url: sfxCrate, volume: 0.5, gap: 0.05 },
  /** brief note 1: the last seconds on the clock */
  urgent: { url: sfxUrgent, volume: 0.6, gap: 0.5 },
  /** brief 7: the fanfare over the win card */
  victory: { url: sfxVictory, volume: 0.7, gap: 0 },
  /** brief 5: the game's own berserk intro, as the dramatic evolution cue */
  evo: { url: sfxEvo, volume: 0.7, gap: 0 }
};

export const IMAGES: Record<string, string> = {
  sky,
  clouds1,
  clouds2,
  water,
  rock1,
  rock2,
  rock3,
  rock_far1: rockFar1,
  rock_far2: rockFar2,
  horizon,
  foam,
  endcard,
  endcard_bg: endcardBg,
  playstore,
  appstore,
  gem_green: gemGreen,
  gem_blue: gemBlue,
  gem_gold: gemGold,
  meat,
  crate,
  bullet,
  bullet_long: bulletLong,
  w_croissant: wCroissant,
  w_yarnball: wYarnball,
  w_propeller: wPropeller,
  w_fish: wFish,
  w_shield: wShield,
  w_plasma: wPlasma,
  i_multicanon: iMulticanon,
  i_croissant: iCroissant,
  i_lightning: iLightning,
  i_shield: iShield,
  i_propeller: iPropeller,
  i_yarnball: iYarnball,
  i_razorfin: iRazorfin,
  i_warmachine: iWarmachine,
  i_attack: iAttack,
  i_speed: iSpeed,
  i_health: iHealth,
  i_armor: iArmor,
  i_magnet: iMagnet,
  i_xp: iXp,
  i_cooldown: iCooldown,
  i_bulletspeed: iBulletspeed,
  i_berserk: iBerserk,
  hud_time: hudTime,
  hud_kills: hudKills,
  hud_wave: hudWave,
  hud_portrait: hudPortrait
};

// --- player ---------------------------------------------------------------
/** Strips are baked at exactly their on-screen size — the canvas is CSS-pixel sized,
 *  so anything larger is invisible — which makes one draw scale fit every character. */
export const ART_SCALE = 1;

export const PLAYER = {
  attack: 10, // PlayerStats.Default.Attack
  health: 140, // SurvivorLevelUpData BaseHP 100, padded for a ~90s ad run
  speed: 190, // px/s
  radius: 22,
  /** How close the plane's *art* has to be to a dropped item to take it. Loot is picked
   *  up by flying onto it, not by passing near it, so this is contact: a shade over half
   *  the plane's own 48px resting box. Measured from the art's centre - the art hangs
   *  well off the skeleton origin, so measuring from the origin takes gems the plane is
   *  visibly nowhere near, and misses ones it is sitting on. */
  grabRadius: 26,
  /** How near an item has to be before it starts drifting to the plane. Just outside
   *  `grabRadius`, so loot snaps in once the plane is practically on it and never comes
   *  at you from across the arena. */
  attractRadius: 52,
  /** Extra reach per level of Catnip Magnet, on top of `attractRadius`. */
  pickupRadius: 240,
  accel: 14, // how fast velocity chases the joystick vector
  hurtCooldown: 0.7 // i-frames after a collision
};

/** The real game paces a run over 10-20 minutes; this ad has ~95 seconds,
 *  so gem XP is scaled to keep the level-up cadence around 8-10 seconds. */
export const XP_RATE = 1.3;

/** InGameXpHandler.UpdateXpRequiredThisLevel */
export const xpForLevel = (level: number) => 40 * level * level + 80 * level - 20;

/** XpItem.prefab values: SmallGreen / BigGreen / Blue / Gold */
export const GEMS = [
  { key: 'gem_green', xp: 10, scale: 0.7 },
  { key: 'gem_green', xp: 40, scale: 0.95 },
  { key: 'gem_blue', xp: 100, scale: 0.95 },
  { key: 'gem_gold', xp: 2000, scale: 1.05 }
] as const;

// --- enemies --------------------------------------------------------------
export interface EnemyDef {
  key: string;
  hp: number;
  speed: number;
  damage: number;
  scale: number;
  radius: number;
  gem: number;
  boss?: boolean;
  /** a loot box rather than a plane: it is shot open, it does not chase or hurt */
  crate?: boolean;
}

export const ENEMIES: Record<string, EnemyDef> = {
  furry: { key: 'e_furry', hp: 22, speed: 142, damage: 6, scale: ART_SCALE, radius: 18, gem: 0 },
  speedbug: { key: 'e_speedbug', hp: 14, speed: 178, damage: 5, scale: ART_SCALE, radius: 15, gem: 0 },
  ladybug: { key: 'e_ladybug', hp: 30, speed: 158, damage: 7, scale: ART_SCALE, radius: 16, gem: 1 },
  feline: { key: 'e_feline', hp: 46, speed: 148, damage: 9, scale: ART_SCALE, radius: 19, gem: 1 },
  helmetbee: { key: 'e_helmetbee', hp: 26, speed: 168, damage: 6, scale: ART_SCALE, radius: 15, gem: 0 },
  bomberkitty: { key: 'e_bomberkitty', hp: 78, speed: 132, damage: 12, scale: ART_SCALE, radius: 21, gem: 2 },
  razorclaw: { key: 'e_razorclaw', hp: 120, speed: 142, damage: 14, scale: ART_SCALE, radius: 21, gem: 2 },
  hammerhead: { key: 'e_hammerhead', hp: 420, speed: 128, damage: 18, scale: ART_SCALE, radius: 30, gem: 2, boss: true },
  boss: { key: 'e_boss', hp: 1600, speed: 152, damage: 24, scale: ART_SCALE, radius: 40, gem: 3, boss: true },
  /** The brief's loot box. It rides the enemy list so it gets the projectile hit test,
   *  the damage flash and the death burst for free; `speed` 0 parks it, `damage` 0 makes
   *  it harmless to fly into, and `boss` keeps the swarm from shoving it around. */
  crate: { key: 'crate', hp: 30, speed: 0, damage: 0, scale: ART_SCALE, radius: 20, gem: 1, boss: true, crate: true }
};

// --- the brief's seven beats ----------------------------------------------
/** Playable Ad Brief: Roguelite - "Explottens - Rogue Arcade".
 *
 *  The run is a script, not a clock. Each beat ends on its own condition - the first
 *  drag, the XP bar filling, the evo pick, the mini-boss dying - so the copy on screen
 *  can never describe something the player is not doing. Brief note 5 (evo upgrades
 *  happen in the same level, no scene change) is why this is one continuous arena from
 *  the intro to the win card: no cuts, no reloads, one `GameScene`.
 *
 *  Every string, count and colour the brief lists under "Editable Elements" is here. */
export type Beat = 'intro' | 'combat' | 'collect' | 'upgrade' | 'evo' | 'evoAttack' | 'win';

export const BEATS = {
  /** 1. Intro - "grab attention with visual chaos and simple interaction" */
  intro: {
    overlay: 'Survive, Upgrade, Evolve!',
    hint: 'Swipe to move',
    /** loot boxes are in the brief's opening scene, alongside the incoming enemies */
    crates: 2
  },
  /** 2. Combat loop, and 3. the gem cue it runs into */
  combat: {
    /** seconds of fighting before "Collect gems!" comes up */
    cue: 2.5,
    text: 'Collect gems!',
    /** XP the bar takes to fill into the weapon upgrade (beat 4) */
    xp: 700,
    /** Seconds this beat may run before the bar is topped up the rest of the way. Loot
     *  is only taken on contact, so a player who does not chase gems can stall a beat
     *  indefinitely - and the brief's seven beats have to fit inside `timer`. */
    maxWait: 7
  },
  /** 4. Weapon upgrade - pick 1 of 3 */
  upgrade: { text: 'Upgrade your weapon to deal more damage!' },
  /** 5. Evo upgrade */
  evo: {
    text: 'Evolve your weapon for unstoppable power!',
    horde: 16,
    /** XP from the weapon upgrade to the evo pick (beat 5) */
    xp: 950,
    maxWait: 9
  },
  /** 6. Evo attack - the mini-boss wave */
  evoAttack: {
    text: 'Unleash your evolved attacks!',
    /** the brief's "Boss enemy type"; 'boss' swaps the vaderboss in */
    miniBoss: 'hammerhead',
    /** Kitty Rage hits for 50x a normal shot, so the mini-boss needs the HP to be a
     *  fight rather than a speed bump - about six seconds of the ten-second rage. */
    hpMul: 55,
    /** loot the mini-boss scatters on death, the brief's "Loot particle effects" */
    lootBurst: 10
  },
  /** 7. Win (reward and CTA) */
  win: {
    overlay: 'Victory! Your hero is unstoppable!',
    badge: 'WIN',
    confetti: 110,
    /** The brief describes one ending, and it is the win. The health bar still drops -
     *  brief 2 wants it visible and it is where the tension lives - but the run cannot
     *  be lost, so beat 7 always lands. Set false to let the player be shot down. */
    noFail: true
  },
  /** Brief note 1: "optional timer to create urgency (last 3 seconds blinking red +
   *  dramatic SFX)". It is a backstop - the mini-boss normally dies well inside it - and
   *  running it out still ends on the CTA, because an ad never punishes the player. */
  timer: { seconds: 30, warn: 3 }
};

/** How thick the sky is per beat - the brief's "Enemy count" editable.
 *  Pools and pacing follow EnemyWaveData's shape (a pool, an interval, a burst, a cap);
 *  what the brief changes is that the beat picks the row, not the wall clock. */
export interface Wave {
  pool: string[];
  interval: number;
  burst: number;
  cap: number;
}

export const BEAT_WAVE: Record<Beat, Wave> = {
  intro: { pool: ['furry', 'speedbug'], interval: 0.55, burst: 2, cap: 8 },
  combat: { pool: ['furry', 'speedbug', 'ladybug'], interval: 0.42, burst: 2, cap: 14 },
  collect: { pool: ['furry', 'speedbug', 'ladybug'], interval: 0.36, burst: 2, cap: 18 },
  upgrade: { pool: ['feline', 'helmetbee', 'ladybug'], interval: 0.32, burst: 3, cap: 22 },
  evo: { pool: ['feline', 'helmetbee', 'ladybug'], interval: 0.3, burst: 3, cap: 26 },
  /** "Enemies hoarde appears" (brief 5) carried through the mini-boss wave (brief 6) */
  evoAttack: { pool: ['razorclaw', 'bomberkitty', 'speedbug', 'feline'], interval: 0.16, burst: 5, cap: 55 },
  win: { pool: [], interval: 99, burst: 0, cap: 0 }
};

/** Loot boxes. They sit in the arena, sparkle, and burst into gems when shot -
 *  the brief's "Loot type" and "Lootboxes" editables. */
export const CRATE = {
  /** gems a popped crate scatters */
  drop: 5,
  /** how many are kept in play through the combat beats */
  keep: 3
};

/** Keep at least this many in play; a strong loadout otherwise empties the sky. */
export const MIN_ON_SCREEN = 10;

// --- skills ---------------------------------------------------------------
export type SkillKind = 'weapon' | 'passive' | 'special';

export interface SkillDef {
  id: string;
  title: string; // exact in-game title
  desc: string; // exact in-game description line
  icon: string;
  kind: SkillKind;
  max: number;
}

export const SKILLS: SkillDef[] = [
  // actives — Assets/Prefabs/Skills/Actives
  { id: 'multicanon', title: 'Multi Canon', desc: 'Damage Up, Radius Up', icon: 'i_multicanon', kind: 'weapon', max: 5 },
  { id: 'croissant', title: 'Croissant', desc: "That's one delicious attack", icon: 'i_croissant', kind: 'weapon', max: 5 },
  {
    id: 'lightning',
    title: 'Shockwave Strike',
    desc: "That's one flashy attack.",
    icon: 'i_lightning',
    kind: 'weapon',
    max: 5
  },
  {
    id: 'shield',
    title: 'Protective Shield',
    desc: 'Hold these pesky kitties back!',
    icon: 'i_shield',
    kind: 'weapon',
    max: 5
  },
  {
    id: 'propeller',
    title: 'Fiesty Propeller',
    desc: "Shouldn't these be attached to the plane?",
    icon: 'i_propeller',
    kind: 'weapon',
    max: 5
  },
  { id: 'yarnball', title: 'Yarnball', desc: 'Things are about to get fluffy', icon: 'i_yarnball', kind: 'weapon', max: 5 },
  { id: 'razorfin', title: 'Razor Fin', desc: 'One sharp fish!', icon: 'i_razorfin', kind: 'weapon', max: 5 },
  {
    id: 'warmachine',
    title: 'War Machine',
    desc: 'Nothing beats good old guns!',
    icon: 'i_warmachine',
    kind: 'weapon',
    max: 5
  },
  // passives — Assets/Prefabs/Skills/Passives
  { id: 'attack', title: 'Purrfect Claws', desc: 'ATK +10%', icon: 'i_attack', kind: 'passive', max: 5 },
  { id: 'speed', title: 'Paw Speeders', desc: 'Movement Speed +10%', icon: 'i_speed', kind: 'passive', max: 5 },
  { id: 'health', title: 'Nine Lives Doc', desc: 'Max HP +20%', icon: 'i_health', kind: 'passive', max: 5 },
  { id: 'armor', title: 'Furmidable Armor', desc: 'Recieved Damage -10%', icon: 'i_armor', kind: 'passive', max: 5 },
  { id: 'magnet', title: 'Catnip Magnet', desc: 'Item loot range +100%', icon: 'i_magnet', kind: 'passive', max: 5 },
  { id: 'xp', title: 'Meow Manual', desc: 'EXP gain +8%', icon: 'i_xp', kind: 'passive', max: 5 },
  { id: 'cooldown', title: 'Catnip Core', desc: 'All attack CD -8%', icon: 'i_cooldown', kind: 'passive', max: 5 },
  {
    id: 'bulletspeed',
    title: 'Cheese Chaser',
    desc: 'Bullet Flight Speed +10%',
    icon: 'i_bulletspeed',
    kind: 'passive',
    max: 5
  }
];

/** Chaos Guard - ActiveSkillsData.csv rows `Shield1`..`Shield5`.
 *
 *  `CollisionRadius` is what the bubble hits at, in world units, and it is the number
 *  that grows with the level - the rows read "Damage Increased. Area Increased" and this
 *  is the area. The playable draws the bubble at that radius too, so what you can see is
 *  what an enemy has to touch; the art's circle only fills ~92% of its texture.
 *
 *  `HitCoolDown` is how long an enemy already inside it waits to be hit again - a full
 *  second, where every other multi-hit weapon here re-gates in 0.3s. */
export const SHIELD = {
  /** CollisionRadius per level, world units */
  radius: [1, 1.5, 2, 2.5, 3],
  /** Floor, world units. The ring is pinned to the plane art's centre, and that centre
   *  is measured from the previous frame's pose (see measurePlane) - through a `flip1`
   *  roll it lags the drawn plane by ~24px. Under about this radius, on a plane 2.26
   *  units long, the pilot's crown hangs outside his own bubble - the art's bounding box
   *  is centred low (it takes in the gear under the fuselage), so the clearance that
   *  matters is measured from the crown, not from the box. */
  minRadius: 2.4,
  hitCooldown: 1,
  /** how much of w_shield's texture the circle itself fills */
  fill: 0.92,
  /** Not from the game: the table's level-1 radius is 1 unit against a 2.26-unit plane,
   *  which draws a ring entirely underneath the plane art - a shield you cannot see is a
   *  shield nobody believes they are touching. The whole curve is scaled up until level 1
   *  clears the plane; the 1 : 1.5 : 2 : 2.5 : 3 proportions are what actually matter. */
  draw: 1.7
};

/** Kitty Rage - the Berserk special skill (Prefabs/Skills/Specials/Berserk.prefab for
 *  the name and blurb, Resources/CSV/Equipment/SpecialSkillData.csv row `Berserk1` for
 *  the 10 second duration, SpecialSkillBulletData.csv's row of the same name for the
 *  bullet). Berserk.cs sprays `bullets` at a time, `rate` apart, each volley turned a
 *  third of the gap between them so the spray spirals - 100 volleys x 0.1s is exactly
 *  the 10s the stats table gives it.
 *
 *  Damage is (BaseDamage 0 + attack) x PlayerDamageMultipliyer, so 50x a normal shot.
 *  MaxRange is 100 units, three screens out; a second of flight already clears the view,
 *  which is the difference between ~60 bolts alive and ~170. */
export const EVO = {
  duration: 10,
  bullets: 6,
  rate: 0.1,
  damageMul: 50,
  speed: 35 * CAM.pxPerUnit,
  life: 1,
  /** PlayerMovement.BerserkMul */
  speedMul: 2,
  /** The spray clears the sky in two volleys, so the swarm has to keep coming for the
   *  ten seconds to read as a massacre rather than an empty orange screen. */
  intervalMul: 0.35,
  burstBonus: 4,
  capMul: 2
};

/** Kept out of SKILLS: it is dealt by hand rather than rolled, and only once. */
export const EVO_SKILL: SkillDef = {
  id: 'evo',
  title: 'Kitty Rage',
  desc: 'Unleash Hell upon your enemies!',
  icon: 'i_berserk',
  kind: 'special',
  max: 1
};

export const SKILL_BY_ID = new Map([...SKILLS, EVO_SKILL].map((s) => [s.id, s]));
