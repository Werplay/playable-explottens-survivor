import * as Phaser from 'phaser';
import { sdk } from '@smoud/playable-sdk';
import { BEATS, Beat, FONT, HUD, SkillDef } from './data';
import type { GameScene } from './GameScene';

// The beat cue sits above the level-up panel: it is what tells the player what the
// panel is for, so it cannot be behind the dim.
const D = { hud: 100, overlay: 200, cue: 300 };
/** How far a card that cannot be taken is faded back. */
const LOCKED_ALPHA = 0.42;
const GOLD = '#ffd34d';

/** Colours read off the in-game "Select a Skill" panel. Weapons glow green, passives
 *  blue; the wedge is the same hue painted behind the icon inside the card. */
const CARD = {
  /** Reference size every card is drawn at - 4:1, the aspect the real panel uses. The
   *  layout scales the whole container to fit instead of redrawing it, so a resize or a
   *  mid-run rotation only moves and rescales what is already on screen. */
  w: 520,
  h: 130,
  gap: 14,
  fill: 0x333d5c,
  radius: 16,
  weapon: { glow: 0x6cf542, wedge: 0x4bbf27, title: '#ffffff' },
  passive: { glow: 0x9fe8ff, wedge: 0x2f7fd4, title: '#ffffff' },
  /** Kitty Rage is the one special in the deck; it gets the rage's own orange. */
  special: { glow: 0xffb638, wedge: 0xe06a00, title: '#ffe9a8' },
  slot: 0x1b2036,
  pipOn: 0xffc93c,
  pipOff: 0x8c93a8
};

/** A container's scrollFactor drives rendering but input hit-testing reads each
 *  child's own value — so pin the whole subtree or taps land camera-scroll away. */
function pin(root: Phaser.GameObjects.GameObject) {
  const anyRoot = root as any;
  if (anyRoot.setScrollFactor) anyRoot.setScrollFactor(0);
  if (anyRoot.list) for (const child of anyRoot.list) pin(child);
}

/** Everything drawn on top of the arena: run stats, level-up picker, end card. */
export class Hud {
  private s: GameScene;
  private w = 0;
  private h = 0;

  /** Every container laid out in canvas pixels rather than world ones. The camera runs
   *  a zoom to hold the game's field of view, and that scales pinned objects too, so
   *  each of these carries the inverse - see GameScene.pinTo. */
  private screens: Phaser.GameObjects.Container[] = [];

  private root!: Phaser.GameObjects.Container;
  private xpBg!: Phaser.GameObjects.Rectangle;
  private xpFill!: Phaser.GameObjects.Rectangle;
  private lvlText!: Phaser.GameObjects.Text;
  private hpBg!: Phaser.GameObjects.Rectangle;
  private hpFill!: Phaser.GameObjects.Rectangle;
  private stats: { icon: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text }[] = [];
  /** the game's own HUD assembly: riveted portrait, level badge, and the red slab the
   *  health and XP bars are sunk into */
  private portrait!: Phaser.GameObjects.Image;
  private plate!: Phaser.GameObjects.Graphics;
  private hpShine!: Phaser.GameObjects.Rectangle;
  private xpShine!: Phaser.GameObjects.Rectangle;
  private heart!: Phaser.GameObjects.Graphics;
  private xpGem!: Phaser.GameObjects.Image;
  private loadout!: Phaser.GameObjects.Container;

  private intro!: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;
  private relayout?: () => void;
  private bannerText!: Phaser.GameObjects.Text;
  /** brief 2: the "Attack -> Loot -> Upgrade" panel */
  private steps!: Phaser.GameObjects.Container;
  private stepLabels: Phaser.GameObjects.Text[] = [];
  /** the beat's line of copy, and the finger that points at what it is talking about */
  private cue!: Phaser.GameObjects.Container;
  private cueText!: Phaser.GameObjects.Text;
  private cueBg!: Phaser.GameObjects.Graphics;
  /** brief 1: the tap cue that rides on the player until the first swipe */
  private finger!: Phaser.GameObjects.Container;
  /** brief 3: the ring drawn round the XP bar and the ability menu while they matter */
  private xpGlow!: Phaser.GameObjects.Graphics;
  private beat: Beat = 'intro';
  private bossBar!: Phaser.GameObjects.Container;
  private bossFill!: Phaser.GameObjects.Rectangle;

  constructor(scene: GameScene) {
    this.s = scene;
    this.build();
  }

  // ------------------------------------------------------------------ build
  private label(size: number, color = '#ffffff') {
    return {
      fontFamily: FONT,
      fontSize: `${size}px`,
      color,
      stroke: '#16283d',
      strokeThickness: Math.max(3, size * 0.16)
    } as Phaser.Types.GameObjects.Text.TextStyle;
  }

  private build() {
    const s = this.s;
    this.root = s.add.container(0, 0).setScrollFactor(0).setDepth(D.hud);

    // The game stacks health over XP in one red slab, with the pilot's portrait sunk
    // into its left end and his level on the rim of it. `plate` is the slab and the two
    // troughs; the bars themselves ride on top.
    this.plate = s.add.graphics();
    this.hpBg = s.add.rectangle(0, 0, 100, 13, HUD.trough).setOrigin(0, 0.5);
    this.hpFill = s.add.rectangle(0, 0, 100, 13, HUD.hp).setOrigin(0, 0.5);
    this.hpShine = s.add.rectangle(0, 0, 100, 4, HUD.hpShine, 0.55).setOrigin(0, 0.5);
    this.xpBg = s.add.rectangle(0, 0, 100, 13, HUD.trough).setOrigin(0, 0.5);
    this.xpFill = s.add.rectangle(0, 0, 100, 13, HUD.xp).setOrigin(0, 0.5);
    this.xpShine = s.add.rectangle(0, 0, 100, 4, HUD.xpShine, 0.6).setOrigin(0, 0.5);

    // the cap icons: a drawn heart, and the game's own XP gem
    this.heart = s.add.graphics();
    this.xpGem = s.add.image(0, 0, 'gem_green').setScale(0.62);

    this.portrait = s.add.image(0, 0, 'hud_portrait');
    this.lvlText = s.add.text(0, 0, '1', this.label(21)).setOrigin(0.5);

    this.root.add([
      this.plate,
      this.hpBg,
      this.hpFill,
      this.hpShine,
      this.xpBg,
      this.xpFill,
      this.xpShine,
      this.heart,
      this.xpGem,
      this.portrait,
      this.lvlText
    ]);

    for (const key of ['hud_time', 'hud_kills', 'hud_wave']) {
      const icon = s.add.image(0, 0, key).setScale(0.5).setOrigin(0.5);
      const label = s.add.text(0, 0, '0', this.label(20)).setOrigin(0, 0.5);
      this.stats.push({ icon, label });
      this.root.add([icon, label]);
    }

    this.loadout = s.add.container(0, 0);
    this.root.add(this.loadout);

    this.bannerText = s.add.text(0, 0, '', this.label(30, '#ff6b6b')).setOrigin(0.5).setAlpha(0);
    this.root.add(this.bannerText);

    const bossBg = s.add.rectangle(0, 0, 260, 18, 0x0d2136, 0.8).setOrigin(0.5);
    bossBg.setStrokeStyle(3, 0xff6b6b);
    this.bossFill = s.add.rectangle(-128, 0, 256, 14, 0xff4438).setOrigin(0, 0.5);
    const bossName = s.add.text(0, -22, 'BOSS', this.label(18, '#ff9a8f')).setOrigin(0.5);
    this.bossBar = s.add.container(0, 0, [bossBg, this.bossFill, bossName]).setVisible(false);
    this.root.add(this.bossBar);

    // brief 3: the ring the "Collect gems!" cue draws round the XP bar and the loadout
    this.xpGlow = s.add.graphics().setVisible(false);
    this.root.add(this.xpGlow);

    // brief 2: "Small UI panel shows: Attack -> Loot -> Upgrade"
    this.steps = s.add.container(0, 0).setVisible(false);
    BEATS.combat.steps.forEach((name, i) => {
      if (i) {
        const arrow = s.add.text(0, 0, '>', this.label(15, '#7c89a8')).setOrigin(0.5);
        arrow.setData('arrow', i);
        this.steps.add(arrow);
      }
      const t = s.add.text(0, 0, name, this.label(15, '#8d99b5')).setOrigin(0.5);
      this.stepLabels.push(t);
      this.steps.add(t);
    });
    this.root.add(this.steps);

    // brief 1: the text overlay, and the finger that taps on the player himself
    const title = s.add.text(0, 0, BEATS.intro.overlay, this.label(30, GOLD)).setOrigin(0.5);
    const sub = s.add.text(0, 40, BEATS.intro.hint, this.label(19)).setOrigin(0.5);
    s.tweens.add({ targets: title, scale: 1.06, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.intro = s.add.container(0, 0, [title, sub]).setScrollFactor(0).setDepth(D.overlay);

    const pad = s.add.circle(0, 0, 30, 0xffffff, 0.22);
    const tip = s.add.circle(0, 0, 15, 0xffffff, 0.92);
    this.finger = s.add.container(0, 0, [pad, tip]).setScrollFactor(0).setDepth(D.overlay);
    // a swipe, not a tap in place: the brief's interaction is "swipe to move"
    s.tweens.add({ targets: this.finger, x: '+=52', duration: 780, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    s.tweens.add({ targets: pad, scale: 1.5, alpha: 0, duration: 780, repeat: -1 });

    // the beat's line of copy - above the level-up panel, since it explains it
    this.cueBg = s.add.graphics();
    this.cueText = s.add.text(0, 0, '', this.label(21, '#ffffff')).setOrigin(0.5);
    this.cue = s.add.container(0, 0, [this.cueBg, this.cueText]).setScrollFactor(0).setDepth(D.cue).setAlpha(0);

    this.pinScreen(this.root);
    this.pinScreen(this.intro);
    this.pinScreen(this.finger);
    this.pinScreen(this.cue);
  }

  /** Brief note 4: a cue lives until its action is done, then fades - never lingers. */
  private say(text: string) {
    const s = this.s;
    this.cueText.setText(text);
    const w = this.cueText.width + 44;
    const h = this.cueText.height + 22;
    this.cueBg.clear();
    this.cueBg.fillStyle(0x0d2136, 0.86).fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    this.cueBg.lineStyle(3, 0xffc93c, 0.9).strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    s.tweens.killTweensOf(this.cue);
    this.cue.setScale(0.9);
    s.tweens.add({ targets: this.cue, alpha: 1, scale: 1, duration: 220, ease: 'Back.easeOut' });
  }

  private hush() {
    this.s.tweens.add({ targets: this.cue, alpha: 0, duration: 250 });
  }

  /** The script moved on: say the beat's line, light the right step, point at the thing
   *  the line is about. */
  onBeat(beat: Beat) {
    this.beat = beat;
    const lit = { combat: 0, collect: 1, upgrade: 2, evo: 2 }[beat as 'combat'];
    this.steps.setVisible(lit !== undefined);
    this.stepLabels.forEach((t, i) => {
      const on = i === lit;
      t.setColor(on ? GOLD : '#8d99b5').setScale(on ? 1.18 : 1);
    });

    if (beat === 'collect') {
      this.say(BEATS.combat.text);
      this.xpGlow.setVisible(true);
    } else if (beat === 'upgrade') {
      this.say(BEATS.upgrade.text);
    } else if (beat === 'evo') {
      this.say(BEATS.evo.text);
    } else if (beat === 'evoAttack') {
      this.xpGlow.setVisible(false);
      this.say(BEATS.evoAttack.text);
      this.s.time.delayedCall(2600, () => this.hush());
    } else if (beat === 'win') {
      this.hush();
      this.steps.setVisible(false);
      this.xpGlow.setVisible(false);
    }
  }

  /** Pin a screen-space root: scrollFactor for scrolling, GameScene.pinTo for zoom. */
  private pinScreen(c: Phaser.GameObjects.Container) {
    pin(c);
    if (!this.screens.includes(c)) this.screens.push(c);
    this.s.pinTo(c);
    return c;
  }

  showIntro() {
    this.intro.setVisible(true);
  }

  /** Brief note 4: the cursor and the text both go once the swipe has happened. */
  hideIntro() {
    for (const c of [this.intro, this.finger]) {
      this.s.tweens.add({ targets: c, alpha: 0, duration: 250, onComplete: () => c.setVisible(false) });
    }
  }

  banner(text: string) {
    this.bannerText.setText(text).setAlpha(1).setScale(0.6);
    this.s.tweens.add({ targets: this.bannerText, scale: 1, duration: 260, ease: 'Back.easeOut' });
    this.s.tweens.add({ targets: this.bannerText, alpha: 0, delay: 1400, duration: 500 });
  }

  // ----------------------------------------------------------------- update
  update(_dt: number) {
    const s = this.s;
    this.xpFill.width = this.xpBg.width * Phaser.Math.Clamp(s.xp / s.xpNeed, 0, 1);
    this.hpFill.width = this.hpBg.width * Phaser.Math.Clamp(s.hp / s.maxHp, 0, 1);
    // the sweep across each bar is inset from its own cap, and vanishes with it
    this.hpShine.width = Math.max(0, this.hpFill.width - 6);
    this.xpShine.width = Math.max(0, this.xpFill.width - 6);
    this.hpShine.setVisible(this.hpFill.width > 7);
    this.xpShine.setVisible(this.xpFill.width > 7);
    this.lvlText.setText(`${s.level}`);

    // brief 1: the finger cue rides on the player rather than sitting near him
    if (this.finger.visible) {
      const [px, py] = s.playerScreen();
      this.s.pinTo(this.finger, px - 26, py + 46);
    }

    // brief note 1: a countdown, red and blinking through its last seconds
    const left = Math.max(0, Math.ceil(s.timeLeft));
    const warn = s.timeLeft <= BEATS.timer.warn && s.beat !== 'win';
    const lbl = this.stats[0].label;
    lbl.setText(`${Math.floor(left / 60)}:${`${left % 60}`.padStart(2, '0')}`);
    lbl.setColor(warn ? '#ff4438' : '#ffffff');
    lbl.setScale(warn && Math.floor(s.timeLeft * 4) % 2 === 0 ? 1.22 : 1);

    // brief 3: ring the XP bar and the ability menu while "Collect gems!" is up
    if (this.xpGlow.visible) {
      const pulse = 0.45 + 0.35 * Math.sin(s.elapsed * 7);
      this.xpGlow.clear().lineStyle(4, 0xffe45c, pulse);
      this.xpGlow.strokeRoundedRect(this.xpBg.x - 6, this.xpBg.y - 9, this.xpBg.width + 12, 18, 7);
      const n = Math.max(1, s.ownedList().length);
      this.xpGlow.strokeRoundedRect(this.loadout.x - 5, this.loadout.y - 5, n * 44 + 4, 48, 8);
    }
    this.stats[1].label.setText(`${s.kills}`);
    this.stats[2].label.setText(`${s.wave}`);

    const boss = s.bossState();
    this.bossBar.setVisible(!!boss);
    if (boss) this.bossFill.width = 256 * Phaser.Math.Clamp(boss.ratio, 0, 1);

    this.syncLoadout();
  }

  private syncLoadout() {
    const list = this.s.ownedList();
    while (this.loadout.length < list.length * 3) {
      const i = this.loadout.length / 3;
      const bg = this.s.add.rectangle(i * 44, 0, 38, 38, 0x0d2136, 0.66).setOrigin(0, 0);
      const icon = this.s.add.image(i * 44 + 19, 19, list[i].def.icon).setScale(0.41);
      const pip = this.s.add.text(i * 44 + 34, 26, '1', this.label(14, GOLD)).setOrigin(0.5);
      this.loadout.add([bg, icon, pip]);
      pin(bg);
      pin(icon);
      pin(pip);
    }
    for (let i = 0; i < list.length; i++) {
      const icon = this.loadout.getAt(i * 3 + 1) as Phaser.GameObjects.Image;
      const pip = this.loadout.getAt(i * 3 + 2) as Phaser.GameObjects.Text;
      icon.setTexture(list[i].def.icon);
      pip.setText(`${list[i].level}`);
    }
  }

  // -------------------------------------------------------------- level up
  openLevelUp() {
    const s = this.s;
    const c = this.pinScreen(s.add.container(0, 0).setScrollFactor(0).setDepth(D.overlay));
    const dim = s.add.rectangle(0, 0, this.w, this.h, 0x04101d, 0.82).setOrigin(0);
    const header = this.makeHeader();
    const refresh = this.makeRefresh();
    c.add([dim, header, refresh]);

    // Cards are rebuilt in place so Refresh can reroll without tearing the panel down.
    const deal = () => {
      for (let i = c.length - 1; i >= 3; i--) c.getAt(i).destroy();
      s.rollChoices().forEach((choice, i) => {
        // Brief 5 is a guided beat: the cursor points at the evo, so the evo is the only
        // thing that answers. The other two are dealt for context, dimmed and dead.
        const locked = this.beat === 'evo' && choice.def.id !== 'evo';
        const card = this.makeCard(
          choice.def,
          choice.level,
          locked
            ? null
            : () => {
                if (c.getData('picked')) return;
                c.setData('picked', true);
                s.sfx('tap');
                this.pickFlash(card, () => {
                  this.hush();
                  this.closeLevelUp();
                  s.closeLevelUp(choice.def.id);
                });
              }
        );
        card.setData('index', i).setAlpha(0);
        c.add(card);
        s.tweens.add({ targets: card, alpha: locked ? LOCKED_ALPHA : 1, duration: 200, delay: 60 * i });
        // brief 5: "Animated cursor points to evo weapon" - the evo is always dealt first
        if (this.beat === 'evo' && choice.def.id === 'evo') card.add(this.makeCursor());
      });
      c.setData('picked', false);
      pin(c);
      this.relayout?.();
    };

    // Refresh is dead on the evo beat too - rerolling is a tap that leads nowhere when
    // the evo is the only answer, and it would just re-deal two more locked cards.
    const canRefresh = this.beat !== 'evo';
    refresh.setAlpha(canRefresh ? 1 : LOCKED_ALPHA);
    if (canRefresh) {
      (refresh.getAt(0) as Phaser.GameObjects.Rectangle)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          s.sfx('tap');
          deal();
        });
    }

    this.overlay = c;
    this.relayout = () => this.layoutOverlay(header, refresh);
    deal();
  }

  /** Brief 4: the picked card is highlighted, sparks and glows before the panel closes,
   *  and the others drop away so the eye stays on what was chosen. */
  private pickFlash(card: Phaser.GameObjects.Container, done: () => void) {
    const s = this.s;
    const c = this.overlay;
    if (c) {
      for (let i = 3; i < c.length; i++) {
        const other = c.getAt(i) as Phaser.GameObjects.Container;
        if (other !== card) s.tweens.add({ targets: other, alpha: 0.15, duration: 180 });
      }
    }
    const k = card.scale;
    const ring = s.add.circle(0, 0, CARD.h * 0.5).setStrokeStyle(6, 0xffe45c, 0.95);
    card.add(ring);
    s.tweens.add({ targets: ring, scale: 3.4, alpha: 0, duration: 420, ease: 'Cubic.easeOut' });
    const flash = s.add.rectangle(0, 0, CARD.w, CARD.h, 0xffffff, 0.75).setOrigin(0.5);
    card.add(flash);
    s.tweens.add({ targets: flash, alpha: 0, duration: 320 });
    s.tweens.add({ targets: card, scale: k * 1.07, duration: 150, yoyo: true, ease: 'Sine.easeOut' });
    s.time.delayedCall(380, done);
  }

  /** The finger the evo card is pointed out with. Same shape as the intro cue, so the
   *  player reads it as the same instruction. */
  private makeCursor() {
    const s = this.s;
    const pad = s.add.circle(0, 0, 26, 0xffffff, 0.22);
    const tip = s.add.circle(0, 0, 13, 0xffffff, 0.92);
    const cur = s.add.container(CARD.w * 0.36, CARD.h * 0.3, [pad, tip]);
    s.tweens.add({ targets: cur, x: cur.x - 26, y: cur.y - 16, duration: 620, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    s.tweens.add({ targets: pad, scale: 1.6, alpha: 0, duration: 780, repeat: -1 });
    return cur;
  }

  /** "◆ ——  SELECT A SKILL  —— ◆" */
  private makeHeader() {
    const s = this.s;
    const text = s.add.text(0, 0, 'SELECT A SKILL', this.label(28)).setOrigin(0.5);
    const rule = s.add.graphics();
    const half = text.width / 2;
    for (const dir of [-1, 1]) {
      const near = dir * (half + 18);
      const far = dir * (half + 86);
      rule.lineStyle(4, 0xffffff, 0.9).beginPath().moveTo(near, 0).lineTo(far, 0).strokePath();
      this.diamond(rule, dir * (half + 104), 0, 7, 0xffffff, 1);
    }
    return s.add.container(0, 0, [rule, text]);
  }

  private makeRefresh() {
    const s = this.s;
    const w = 260;
    const h = 62;
    const g = s.add.graphics();
    g.fillStyle(0xe09b00, 1).fillRoundedRect(-w / 2, -h / 2 + 6, w, h, 12);
    g.fillStyle(0xffc83d, 1).fillRoundedRect(-w / 2, -h / 2, w, h - 4, 12);
    const text = s.add.text(0, 0, 'Refresh', this.label(28)).setOrigin(0.5);
    const hit = s.add.rectangle(0, 0, w, h, 0x000000, 0).setOrigin(0.5);
    return s.add.container(0, 0, [hit, g, text]);
  }

  /** One full-width skill row: glow border, tinted wedge, framed icon, rarity pips. */
  private makeCard(def: SkillDef, level: number, onPick: (() => void) | null) {
    const s = this.s;
    const w = CARD.w;
    const h = CARD.h;
    const tone = CARD[def.kind];
    const x0 = -w / 2;
    const y0 = -h / 2;

    const g = s.add.graphics();
    // outer glow: the same rounded outline stroked wider and fainter each pass
    for (let i = 3; i >= 1; i--) {
      g.lineStyle(3 + i * 3, tone.glow, 0.1 * i).strokeRoundedRect(x0, y0, w, h, CARD.radius + i);
    }
    g.fillStyle(CARD.fill, 1).fillRoundedRect(x0, y0, w, h, CARD.radius);

    // Wedge. Its two left corners are the card's own rounded corners, drawn into the
    // path - a geometry mask would have to track the card's world position and does not.
    const wedgeW = h * 1.28;
    const slant = h * 0.34;
    const r = CARD.radius;
    const wedge = s.add.graphics();
    wedge.fillStyle(tone.wedge, 1).beginPath();
    wedge.moveTo(x0 + r, y0);
    wedge.lineTo(x0 + wedgeW, y0);
    wedge.lineTo(x0 + wedgeW - slant, y0 + h);
    wedge.lineTo(x0 + r, y0 + h);
    wedge.arc(x0 + r, y0 + h - r, r, Math.PI / 2, Math.PI);
    wedge.lineTo(x0, y0 + r);
    wedge.arc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5);
    wedge.closePath();
    wedge.fillPath();

    g.lineStyle(4, tone.glow, 1).strokeRoundedRect(x0, y0, w, h, CARD.radius);

    // icon slot
    const pad = h * 0.1;
    const slot = h - pad * 2;
    const sx = x0 + pad;
    const frame = s.add.graphics();
    frame.fillStyle(CARD.slot, 1).fillRoundedRect(sx, y0 + pad, slot, slot, 12);
    frame.lineStyle(4, 0xdfe7f5, 1).strokeRoundedRect(sx, y0 + pad, slot, slot, 12);
    const icon = s.add.image(sx + slot / 2, y0 + pad + slot / 2, def.icon);
    icon.setScale(Math.min(1, (slot - 16) / Math.max(icon.width, icon.height)));

    // rarity pips along the bottom of the wedge, gold up to the level being offered
    const pips = s.add.graphics();
    const total = Math.min(def.max, 5);
    const step = Math.min(18, (wedgeW - slant - pad * 2) / total);
    for (let i = 0; i < total; i++) {
      const on = i < level;
      this.diamond(pips, sx + step / 2 + i * step, y0 + h - pad * 0.9, 7, on ? CARD.pipOn : CARD.pipOff, 1);
    }

    const textX = x0 + pad * 2 + slot;
    const wrap = w - (textX - x0) - pad * 2;
    const title = s.add.text(textX, 0, def.title, this.label(26, tone.title)).setOrigin(0, 1);
    const desc = s.add
      .text(textX, 0, def.desc, { ...this.label(17, '#cdd4e4'), wordWrap: { width: wrap } })
      .setOrigin(0, 0);

    // Title sits just above the description block, the pair centred in the card.
    const stack = title.height + 6 + desc.height;
    title.y = -stack / 2 + title.height;
    desc.y = title.y + 6;

    const badge = s.add
      .text(x0 + w - pad, y0 + pad, level === 1 ? 'NEW!' : `Lv ${level}`, this.label(16, GOLD))
      .setOrigin(1, 0);

    const hit = s.add.rectangle(0, 0, w, h, 0x000000, 0).setOrigin(0.5);
    if (onPick) hit.setInteractive({ useHandCursor: true }).on('pointerdown', onPick);

    return s.add.container(0, 0, [g, wedge, frame, icon, pips, title, desc, badge, hit]);
  }

  private diamond(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, color: number, alpha: number) {
    g.fillStyle(color, alpha).fillPoints(
      [
        new Phaser.Geom.Point(x, y - r),
        new Phaser.Geom.Point(x + r, y),
        new Phaser.Geom.Point(x, y + r),
        new Phaser.Geom.Point(x - r, y)
      ],
      true
    );
  }

  /** The player HUD the game draws: the portrait sunk into the left end of a red slab,
   *  the level on its rim, and health over XP in two troughs cut out of it. */
  private layoutBars(width: number, pad: number) {
    const d = 62; // portrait diameter
    const cx = pad + d / 2;
    const cy = 46;
    const x0 = cx + d / 2 - 6; // the slab runs out from under the portrait
    const x1 = width - pad;
    const top = cy - 23;
    const h = 46;
    const barX = x0 + 22; // clear of the cap icons
    const barW = Math.max(10, x1 - 10 - barX);
    const hpY = cy - 10;
    const xpY = cy + 11;

    this.plate.clear();
    this.plate.fillStyle(HUD.plate, 1).fillRoundedRect(x0, top, x1 - x0, h, 11);
    this.plate.lineStyle(3, HUD.plateRim, 1).strokeRoundedRect(x0, top, x1 - x0, h, 11);

    for (const [y, bg, fill, shine] of [
      [hpY, this.hpBg, this.hpFill, this.hpShine],
      [xpY, this.xpBg, this.xpFill, this.xpShine]
    ] as [number, Phaser.GameObjects.Rectangle, Phaser.GameObjects.Rectangle, Phaser.GameObjects.Rectangle][]) {
      bg.setPosition(barX, y).setSize(barW, 13);
      fill.setPosition(barX, y).setSize(barW, 13);
      shine.setPosition(barX + 3, y - 3).setSize(barW, 4);
    }

    // a heart at the health cap, the game's XP gem at the other
    const hx = barX - 11;
    this.heart.clear();
    const r = 5.5;
    for (const [col, off] of [
      [HUD.heartShade, 1.5],
      [HUD.heart, 0]
    ] as [number, number][]) {
      this.heart.fillStyle(col, 1);
      this.heart.fillCircle(hx - r * 0.52, hpY - r * 0.42 + off, r * 0.74);
      this.heart.fillCircle(hx + r * 0.52, hpY - r * 0.42 + off, r * 0.74);
      this.heart.fillTriangle(hx - r * 1.12, hpY - r * 0.16 + off, hx + r * 1.12, hpY - r * 0.16 + off, hx, hpY + r * 1.18 + off);
    }
    this.xpGem.setPosition(hx, xpY);

    this.portrait.setPosition(cx, cy).setDisplaySize(d, d);
    this.lvlText.setPosition(cx, cy + d / 2 - 7);
  }

  /** Header tucks in on a short screen so three cards still fit under it. */
  private headerY() {
    return Phaser.Math.Clamp(this.h * 0.14, 40, 110);
  }

  /** Uniform scale that fits the card to the width and the stack to the height. */
  private cardScale() {
    const room = this.h - this.headerY() - 40 - 96; // header rule above, Refresh below
    const perCard = (room - 2 * CARD.gap) / 3;
    return Phaser.Math.Clamp(Math.min((this.w - 32) / CARD.w, perCard / CARD.h), 0.35, 1);
  }

  private layoutOverlay(header: Phaser.GameObjects.Container, refresh: Phaser.GameObjects.Container) {
    if (!this.overlay) return;
    const c = this.overlay;
    (c.getAt(0) as Phaser.GameObjects.Rectangle).setSize(this.w, this.h);

    const k = this.cardScale();
    const cardH = CARD.h * k;
    const gap = CARD.gap * k;
    const span = 3 * cardH + 2 * gap;
    const headerY = this.headerY();
    const top = headerY + 40 * k;
    const centre = Phaser.Math.Clamp(
      this.h / 2,
      top + span / 2,
      Math.max(top + span / 2, this.h - span / 2 - 84 * k)
    );

    header.setPosition(this.w / 2, headerY).setScale(k);
    refresh.setPosition(this.w / 2, Math.min(centre + span / 2 + 48 * k, this.h - 38 * k)).setScale(k);

    for (let i = 3; i < c.length; i++) {
      const card = c.getAt(i) as Phaser.GameObjects.Container;
      const idx = card.getData('index') as number;
      card.setPosition(this.w / 2, centre - span / 2 + cardH / 2 + idx * (cardH + gap)).setScale(k);
    }
  }

  private closeLevelUp() {
    this.overlay?.destroy(true);
    this.overlay = undefined;
    this.relayout = undefined;
  }

  // ----------------------------------------------------------------- victory
  /** Brief 7: the reward lands on the arena, not on a dialog - the wave is cleared, the
   *  overlay and the green WIN stamp punch in over confetti, and only then does the end
   *  card slide up with the logo and the CTA. */
  showVictory(won: boolean, done: () => void) {
    const s = this.s;
    if (!won) {
      done();
      return;
    }
    s.sfx('victory');
    const c = this.pinScreen(s.add.container(0, 0).setScrollFactor(0).setDepth(D.cue));
    const cx = this.w / 2;
    const cy = this.h * 0.42;

    // confetti: colourful, falling, spinning
    const colours = [0xffc93c, 0x6cf542, 0x4dd2ff, 0xff6b9d, 0xffffff, 0xff8a3c];
    for (let i = 0; i < BEATS.win.confetti; i++) {
      const p = s.add.rectangle(
        Phaser.Math.Between(0, this.w),
        Phaser.Math.Between(-this.h * 0.5, 0),
        Phaser.Math.Between(6, 12),
        Phaser.Math.Between(9, 17),
        Phaser.Utils.Array.GetRandom(colours)
      );
      p.setAngle(Phaser.Math.Between(0, 360));
      c.add(p);
      s.tweens.add({
        targets: p,
        y: this.h + 40,
        angle: p.angle + Phaser.Math.Between(-320, 320),
        duration: Phaser.Math.Between(1500, 3000),
        delay: Phaser.Math.Between(0, 700),
        ease: 'Sine.easeIn'
      });
    }

    // the green WIN stamp
    const badge = s.add.container(cx, cy);
    const disc = s.add.circle(0, 0, 62, 0x35c93f).setStrokeStyle(7, 0x12551a);
    const word = s.add.text(0, 0, BEATS.win.badge, this.label(44)).setOrigin(0.5);
    badge.add([disc, word]);
    badge.setScale(0).setAngle(-18);
    c.add(badge);
    s.tweens.add({ targets: badge, scale: 1, duration: 420, ease: 'Back.easeOut' });

    const line = s.add
      .text(cx, cy + 110, BEATS.win.overlay, {
        ...this.label(27, GOLD),
        align: 'center',
        wordWrap: { width: this.w - 60 }
      })
      .setOrigin(0.5)
      .setAlpha(0);
    c.add(line);
    s.tweens.add({ targets: line, alpha: 1, duration: 320, delay: 260 });

    pin(c);
    s.time.delayedCall(2100, () => {
      c.destroy(true);
      this.screens = this.screens.filter((x) => x !== c);
      done();
    });
  }

  // --------------------------------------------------------------- end card
  /** Brief 7: the end card is the key art attached to the brief - the Explottens /
   *  Survivor lockup and the hero over it - with the CTA laid on top. The art covers the
   *  card whatever the aspect, so there is never a letterbox; a shade under the button
   *  keeps it readable where the art runs bright. */
  showEnd(won: boolean) {
    const s = this.s;
    this.closeLevelUp();
    const c = s.add.container(0, 0).setScrollFactor(0).setDepth(D.overlay);

    // Only ever seen in landscape, where the art is shown whole rather than cropped: a
    // 40px copy of the same art blown up to fill the card, which is a blur by any other
    // name, dimmed so the sharp copy in front of it stays the thing you look at.
    const backdrop = s.add.image(0, 0, 'endcard_bg').setOrigin(0.5).setTint(0x8f9bbd);
    const art = s.add.image(0, 0, 'endcard').setOrigin(0.5);
    // A ramp of thin slices, not a panel: any band wide enough to see the edge of reads
    // as a box sitting on the art, which is exactly what this must not look like.
    const shade = s.add.graphics();

    const btnBg = s.add.rectangle(0, 0, 300, 84, BEATS.win.ctaColor).setOrigin(0.5);
    btnBg.setStrokeStyle(5, 0x1c6d22);
    const btnText = s.add.text(0, 0, BEATS.win.cta, this.label(34)).setOrigin(0.5);
    const btn = s.add.container(0, 0, [btnBg, btnText]);
    s.tweens.add({ targets: btn, scale: 1.07, duration: 620, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    btnBg.setInteractive({ useHandCursor: true }).on('pointerdown', () => sdk.install());

    c.add([backdrop, art, shade, btn]);
    c.setData('end', { backdrop, art, shade, btn });
    this.overlay = c;
    this.pinScreen(c);
    c.setAlpha(0);
    s.tweens.add({ targets: c, alpha: 1, duration: 320 });
    this.layoutEnd();
  }

  private layoutEnd() {
    const parts = this.overlay?.getData('end') as
      | {
          backdrop: Phaser.GameObjects.Image;
          art: Phaser.GameObjects.Image;
          shade: Phaser.GameObjects.Graphics;
          btn: Phaser.GameObjects.Container;
        }
      | undefined;
    if (!parts) return;
    const { backdrop, art, shade, btn } = parts;
    const bsrc = backdrop.texture.getSourceImage() as { width: number; height: number };
    backdrop
      .setPosition(this.w / 2, this.h / 2)
      .setScale(Math.max(this.w / bsrc.width, this.h / bsrc.height));

    const src = art.texture.getSourceImage() as { width: number; height: number };
    if (this.h >= this.w) {
      // Portrait: cover, so it is full bleed, and anchored to the top rather than centred
      // - centring crops away the Explottens / Survivor lockup, which is the half of this
      // the brief asks for by name ("App logo + CTA").
      const k = Math.max(this.w / src.width, this.h / src.height);
      art.setScale(k).setPosition(this.w / 2, (src.height * k) / 2);
    } else {
      // Landscape: this is portrait key art, and no crop of it to a wide strip keeps both
      // the lockup and the hero - so it is shown whole, against the backdrop instead.
      const room = this.h - 92;
      const k = Math.min(this.w / src.width, room / src.height);
      art.setScale(k).setPosition(this.w / 2, (src.height * k) / 2 + 6);
    }

    const band = Math.max(70, this.h * 0.26);
    const slices = 24;
    shade.clear();
    for (let i = 0; i < slices; i++) {
      const t = (i + 1) / slices;
      shade.fillStyle(0x0a0618, 0.55 * t * t);
      shade.fillRect(0, this.h - band + (band * i) / slices, this.w, band / slices + 1);
    }

    btn.setPosition(this.w / 2, this.h - Math.max(58, this.h * 0.1)).setScale(Math.min(1, this.w / 380));
  }

  // ----------------------------------------------------------------- resize
  resize(width: number, height: number) {
    this.w = width;
    this.h = height;
    this.screens = this.screens.filter((c) => c.scene);
    for (const c of this.screens) this.s.pinTo(c);
    const pad = 14;
    this.layoutBars(width, pad);

    this.stats.forEach((st, i) => {
      const x = pad + 16 + i * Math.min(110, (width - pad * 2) / 3);
      st.icon.setPosition(x, 98);
      st.label.setPosition(x + 18, 98);
    });

    this.loadout.setPosition(pad, height - 54);
    this.bannerText.setPosition(width / 2, height * 0.26);
    this.bossBar.setPosition(width / 2, 132);

    // brief 2: the Attack -> Loot -> Upgrade panel, centred under the run stats
    this.steps.setPosition(width / 2, 124);
    const gap = Math.min(78, (width - 60) / 3);
    this.stepLabels.forEach((t, i) => t.setPosition((i - 1) * gap, 0));
    for (const child of this.steps.list) {
      const arrow = (child as Phaser.GameObjects.Text).getData?.('arrow');
      if (arrow) (child as Phaser.GameObjects.Text).setPosition((arrow - 1.5) * gap, 0);
    }

    // the beat cue sits above the card stack, which is centred
    this.cue.setPosition(width / 2, Math.max(150, height * 0.2));
    this.intro.setPosition(width / 2, height * 0.24);

    if (this.overlay?.getData('end')) {
      this.layoutEnd();
    } else if (this.overlay) {
      this.relayout?.();
    }
  }
}
