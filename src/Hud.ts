import * as Phaser from 'phaser';
import { sdk } from '@smoud/playable-sdk';
import { BEATS, Beat, FONT, HUD, SkillDef } from './data';
import type { GameScene } from './GameScene';

// The beat cue sits above the level-up panel: it is what tells the player what the
// panel is for, so it cannot be behind the dim.
const D = { hud: 100, overlay: 200, cue: 300 };
/** How far a card that cannot be taken is faded back. */
const LOCKED_ALPHA = 0.42;
/** Badge height at ui 1; the official artwork's own aspect sets each width. */
const BADGE = { h: 52, gap: 12 };
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

  /** Canvas scale for the run HUD. 1 on a 400px short side, which is what all the
   *  numbers below were authored against, so the HUD keeps the same share of the screen
   *  on a 280px phone and on a 1280px tablet rather than being drawn at a fixed pixel
   *  size - cramped and overlapping on one, a lost strip in the corner on the other. */
  private ui = 1;
  /** Every HUD label, so a resize can re-render them at the new size rather than
   *  scaling a bitmap up and going soft. */
  private texts: Phaser.GameObjects.Text[] = [];

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
  /** bottom edge of the bar slab, in canvas px - everything below it stacks from here */
  private barsBottom = 70;
  /** bottom edge of the whole run HUD (bars, badge, stats), for the panel to clear */
  private hudBottom = 110;
  private loadout!: Phaser.GameObjects.Container;

  private intro!: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;
  private relayout?: () => void;
  private bannerText!: Phaser.GameObjects.Text;
  /** the beat's line of copy, and the finger that points at what it is talking about */
  private cue!: Phaser.GameObjects.Container;
  /** Inner containers carry layout and animation scale. The outer, pinned ones carry
   *  `1/zoom` from pinTo - writing a scale onto those throws the pin away and the thing
   *  draws at the wrong size on every canvas whose zoom is not exactly 1. */
  private cueInner!: Phaser.GameObjects.Container;
  private introInner!: Phaser.GameObjects.Container;
  private cueText!: Phaser.GameObjects.Text;
  private cueBg!: Phaser.GameObjects.Graphics;
  private cueMsg = '';
  /** Whether a beat cue owns the screen. Read rather than `cue.alpha`, which is still 0
   *  on the frame its fade-in starts - the frame the level-up panel lays itself out on,
   *  which left the panel sizing its heading band for a header that was about to be
   *  replaced, and the hint landing on the first card. */
  private cueOn = false;
  private cueSize!: Phaser.GameObjects.Rectangle;
  /** the cue panel's drawn height in canvas px - what the layout stacks against */
  private cueH = 40;
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
  /** A HUD label that remembers the size it was authored at, so `restyle` can put it
   *  back at `base * ui` whenever the canvas changes. */
  private mkText(size: number, str: string, color = '#ffffff') {
    const t = this.s.add.text(0, 0, str, this.label(size, color));
    t.setData('base', size);
    this.texts.push(t);
    this.restyleOne(t);
    return t;
  }

  private restyleOne(t: Phaser.GameObjects.Text) {
    const px = Math.max(8, Math.round(((t.getData('base') as number) || 16) * this.ui));
    t.setFontSize(px);
    t.setStroke('#16283d', Math.max(3, px * 0.16));
  }

  private restyle() {
    this.texts = this.texts.filter((t) => t.scene);
    for (const t of this.texts) this.restyleOne(t);
  }

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
    this.lvlText = this.mkText(21, '1').setOrigin(0.5);

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
      const label = this.mkText(20, '0').setOrigin(0, 0.5);
      this.stats.push({ icon, label });
      this.root.add([icon, label]);
    }

    this.loadout = s.add.container(0, 0);
    this.root.add(this.loadout);

    this.bannerText = this.mkText(30, '', '#ff6b6b').setOrigin(0.5).setAlpha(0);
    this.root.add(this.bannerText);

    const bossBg = s.add.rectangle(0, 0, 260, 18, 0x0d2136, 0.8).setOrigin(0.5);
    bossBg.setStrokeStyle(3, 0xff6b6b);
    this.bossFill = s.add.rectangle(-128, 0, 256, 14, 0xff4438).setOrigin(0, 0.5);
    const bossName = this.mkText(18, 'BOSS', '#ff9a8f').setOrigin(0.5);
    bossName.setPosition(0, -22);
    this.bossBar = s.add.container(0, 0, [bossBg, this.bossFill, bossName]).setVisible(false);
    this.root.add(this.bossBar);

    // brief 3: the ring the "Collect gems!" cue draws round the XP bar and the loadout
    this.xpGlow = s.add.graphics().setVisible(false);
    this.root.add(this.xpGlow);

    // brief 1: the text overlay, and the finger that taps on the player himself
    const title = this.mkText(30, BEATS.intro.overlay, GOLD).setOrigin(0.5);
    const sub = this.mkText(19, BEATS.intro.hint).setOrigin(0.5);
    s.tweens.add({ targets: title, scale: 1.06, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.introInner = s.add.container(0, 0, [title, sub]);
    this.intro = s.add.container(0, 0, [this.introInner]).setScrollFactor(0).setDepth(D.overlay);

    const pad = s.add.circle(0, 0, 30, 0xffffff, 0.22);
    const tip = s.add.circle(0, 0, 15, 0xffffff, 0.92);
    this.finger = s.add.container(0, 0, [pad, tip]).setScrollFactor(0).setDepth(D.overlay);
    // a swipe, not a tap in place: the brief's interaction is "swipe to move"
    s.tweens.add({ targets: this.finger, x: '+=52', duration: 780, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    s.tweens.add({ targets: pad, scale: 1.5, alpha: 0, duration: 780, repeat: -1 });

    // the beat's line of copy - above the level-up panel, since it explains it
    this.cueBg = s.add.graphics();
    // Phaser cannot measure a Graphics, so a Container holding one reports nonsense
    // bounds - which is what put this cue on top of the first upgrade card. This
    // zero-alpha rectangle is the panel's real size, for anything that asks.
    this.cueSize = s.add.rectangle(0, 0, 10, 10, 0x000000, 0).setOrigin(0.5);
    this.cueText = this.mkText(21, '', '#ffffff').setOrigin(0.5);
    this.cueInner = s.add.container(0, 0, [this.cueBg, this.cueSize, this.cueText]);
    this.cue = s.add.container(0, 0, [this.cueInner]).setScrollFactor(0).setDepth(D.cue).setAlpha(0);

    this.pinScreen(this.root);
    this.pinScreen(this.intro);
    this.pinScreen(this.finger);
    this.pinScreen(this.cue);
  }

  /** Shrink a laid-out element until it fits the canvas, never enlarging it. Type here
   *  is authored at one size for a 400px-wide phone; a 280px one still has to read it. */
  private fit(o: Phaser.GameObjects.Components.Transform & { width: number }, margin = 24) {
    o.setScale(Math.min(1, (this.w - margin) / Math.max(1, o.width)));
  }

  /** Brief note 4: a cue lives until its action is done, then fades - never lingers. */
  private say(text: string) {
    const s = this.s;
    this.cueOn = true;
    this.cueMsg = text;
    this.drawCue();
    s.tweens.killTweensOf(this.cueInner);
    this.cueInner.setScale(0.9);
    s.tweens.add({ targets: this.cueInner, scale: 1, duration: 220, ease: 'Back.easeOut' });
    s.tweens.add({ targets: this.cue, alpha: 1, duration: 220 });
  }

  /** The cue's panel is drawn around its text, so it has to be redrawn whenever either
   *  the copy or the canvas changes. */
  private drawCue() {
    const u = this.ui;
    this.cueText.setScale(1).setText(this.cueMsg);
    this.fit(this.cueText, 74 * u);
    const w = this.cueText.width * this.cueText.scaleX + 44 * u;
    const h = this.cueText.height * this.cueText.scaleY + 22 * u;
    this.cueBg.clear();
    this.cueBg.fillStyle(0x0d2136, 0.86).fillRoundedRect(-w / 2, -h / 2, w, h, 12 * u);
    this.cueBg.lineStyle(3 * u, 0xffc93c, 0.9).strokeRoundedRect(-w / 2, -h / 2, w, h, 12 * u);
    this.cueSize.setSize(w, h);
    this.cueH = h;
  }

  private hush() {
    this.cueOn = false;
    this.s.tweens.add({ targets: this.cue, alpha: 0, duration: 250 });
  }

  /** The script moved on: say the beat's line, light the right step, point at the thing
   *  the line is about. */
  onBeat(beat: Beat) {
    this.beat = beat;
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
    this.bannerText.setText(text).setAlpha(1).setScale(1);
    this.fit(this.bannerText);
    const to = this.bannerText.scaleX;
    this.bannerText.setScale(to * 0.6);
    this.s.tweens.add({ targets: this.bannerText, scale: to, duration: 260, ease: 'Back.easeOut' });
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
      const bg = this.s.add.rectangle(0, 0, 38, 38, 0x0d2136, 0.66).setOrigin(0, 0);
      const icon = this.s.add.image(0, 0, list[i].def.icon);
      const pip = this.mkText(14, '1', GOLD).setOrigin(0.5);
      this.loadout.add([bg, icon, pip]);
      pin(bg);
      pin(icon);
      pin(pip);
    }
    this.layoutLoadout();
    for (let i = 0; i < list.length; i++) {
      const icon = this.loadout.getAt(i * 3 + 1) as Phaser.GameObjects.Image;
      const pip = this.loadout.getAt(i * 3 + 2) as Phaser.GameObjects.Text;
      icon.setTexture(list[i].def.icon);
      pip.setText(`${list[i].level}`);
    }
  }

  /** Slot size and spacing follow the canvas like everything else in the HUD. */
  private layoutLoadout() {
    const u = this.ui;
    const box = 38 * u;
    const step = 44 * u;
    for (let i = 0; i * 3 < this.loadout.length; i++) {
      const bg = this.loadout.getAt(i * 3) as Phaser.GameObjects.Rectangle;
      const icon = this.loadout.getAt(i * 3 + 1) as Phaser.GameObjects.Image;
      const pip = this.loadout.getAt(i * 3 + 2) as Phaser.GameObjects.Text;
      bg.setPosition(i * step, 0).setSize(box, box);
      icon.setPosition(i * step + box / 2, box / 2).setScale(0.41 * u);
      pip.setPosition(i * step + box * 0.89, box * 0.68);
    }
  }

  // -------------------------------------------------------------- level up
  openLevelUp() {
    const s = this.s;
    const c = this.pinScreen(s.add.container(0, 0).setScrollFactor(0).setDepth(D.overlay));
    const dim = s.add.rectangle(0, 0, this.w, this.h, 0x04101d, 0.82).setOrigin(0);
    const header = this.makeHeader();
    // Beats 4 and 5 put their own line of copy over this panel, which says the same
    // thing as "SELECT A SKILL" only better - two headings stacked is the clutter, and
    // on a short screen they land on each other.
    header.setVisible(!this.cueOn);
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
    const u = this.ui;
    const d = 62 * u; // portrait diameter
    const cx = pad + d / 2;
    const cy = 46 * u;
    // Leave a deliberate gutter after the portrait badge. Previously the slab tucked
    // underneath it, which read as one crowded shape instead of the in-game badge next
    // to the health / XP unit.
    const x0 = cx + d / 2 + 8 * u;
    const x1 = width - pad;
    const top = cy - 23 * u;
    const h = 46 * u;
    const barX = x0 + 22 * u; // clear of the cap icons
    const barW = Math.max(10, x1 - 10 * u - barX);
    const hpY = cy - 10 * u;
    const xpY = cy + 11 * u;

    this.plate.clear();
    this.plate.fillStyle(HUD.plate, 1).fillRoundedRect(x0, top, x1 - x0, h, 11 * u);
    this.plate.lineStyle(3 * u, HUD.plateRim, 1).strokeRoundedRect(x0, top, x1 - x0, h, 11 * u);

    for (const [y, bg, fill, shine] of [
      [hpY, this.hpBg, this.hpFill, this.hpShine],
      [xpY, this.xpBg, this.xpFill, this.xpShine]
    ] as [number, Phaser.GameObjects.Rectangle, Phaser.GameObjects.Rectangle, Phaser.GameObjects.Rectangle][]) {
      bg.setPosition(barX, y).setSize(barW, 13 * u);
      fill.setPosition(barX, y).setSize(barW, 13 * u);
      shine.setPosition(barX + 3 * u, y - 3 * u).setSize(barW, 4 * u);
    }

    // a heart at the health cap, the game's XP gem at the other
    const hx = barX - 11 * u;
    this.heart.clear();
    const r = 5.5 * u;
    for (const [col, off] of [
      [HUD.heartShade, 1.5 * u],
      [HUD.heart, 0]
    ] as [number, number][]) {
      this.heart.fillStyle(col, 1);
      this.heart.fillCircle(hx - r * 0.52, hpY - r * 0.42 + off, r * 0.74);
      this.heart.fillCircle(hx + r * 0.52, hpY - r * 0.42 + off, r * 0.74);
      this.heart.fillTriangle(hx - r * 1.12, hpY - r * 0.16 + off, hx + r * 1.12, hpY - r * 0.16 + off, hx, hpY + r * 1.18 + off);
    }
    this.xpGem.setPosition(hx, xpY).setScale(0.62 * u);

    this.portrait.setPosition(cx, cy).setDisplaySize(d, d);
    this.lvlText.setPosition(cx, cy + d / 2 - 7 * u);
    // What the rest of the HUD hangs below. The level badge sits on the portrait's rim
    // and hangs past the slab, so it - not the slab - is the real bottom edge.
    this.barsBottom = Math.max(top + h, this.lvlText.y + this.lvlText.height / 2);
  }

  /** A store badge: the official artwork, drawn to a common height so the pair sits on
   *  one line, and hit-tested over its own rectangle. Both badges do the same thing -
   *  hand off to the network's install call. */
  private makeStoreBadge(key: 'playstore' | 'appstore') {
    const s = this.s;
    const img = s.add.image(0, 0, key).setOrigin(0.5);
    const hit = s.add.rectangle(0, 0, img.width, img.height, 0x000000, 0).setOrigin(0.5);
    hit.setInteractive({ useHandCursor: true }).on('pointerdown', () => sdk.install());
    return s.add.container(0, 0, [img, hit]);
  }

  /** Top of the panel's own stack: under the run HUD, never on it. */
  private panelTop() {
    return Math.max(Phaser.Math.Clamp(this.h * 0.12, 30, 110), this.hudBottom + 10 * this.ui);
  }

  /** Height of the heading band - the beat cue when one is up, otherwise the rule. */
  private headBand() {
    return this.cueOn ? this.cueH + 24 * this.ui : 46 * this.ui;
  }

  /** A short, wide viewport has room across the arena but not below the HUD. A two-card
   *  grid uses that width; keeping the phone's one-column stack there forces every card
   *  down to its minimum scale. */
  private panelColumns() {
    return this.w > this.h * 1.2 ? 2 : 1;
  }

  /** Uniform scale that fits the card to the width and the stack to what is left of the
   *  height once the HUD, the heading band and Refresh have taken their share. */
  private cardScale() {
    const cols = this.panelColumns();
    const rows = Math.ceil(3 / cols);
    // In landscape the Refresh control is deliberately compact. Reserving the portrait
    // button's tall footer is what made the upgrade cards collapse into tiny strips.
    const footer = (cols > 1 ? 52 : 96) * this.ui;
    const room = this.h - this.panelTop() - this.headBand() - footer;
    const widthScale =
      (this.w - 32 * this.ui) / (cols * CARD.w + (cols - 1) * CARD.gap);
    const heightScale = (room - (rows - 1) * CARD.gap) / (rows * CARD.h);
    // Capped at the UI scale, not at 1: on a tablet the HUD grows and a card stack still
    // pinned to its phone size reads as a postage stamp in the middle of the screen.
    return Phaser.Math.Clamp(Math.min(widthScale, heightScale), 0.3, this.ui);
  }

  private layoutOverlay(header: Phaser.GameObjects.Container, refresh: Phaser.GameObjects.Container) {
    if (!this.overlay) return;
    const c = this.overlay;
    (c.getAt(0) as Phaser.GameObjects.Rectangle).setSize(this.w, this.h);

    const k = this.cardScale();
    const cols = this.panelColumns();
    const rows = Math.ceil(3 / cols);
    const cardH = CARD.h * k;
    const cardW = CARD.w * k;
    const gap = CARD.gap * k;
    const span = rows * cardH + (rows - 1) * gap;
    const gridW = cols * cardW + (cols - 1) * gap;

    // One vertical stack, measured rather than guessed: the run HUD, then the heading
    // band - the beat cue when one is up, the "SELECT A SKILL" rule otherwise - then the
    // three cards, then Refresh. The cue used to sit at a fixed row and land on the top
    // card on anything that was not a 400x720 phone.
    const u = this.ui;
    const footer = (cols > 1 ? 52 : 96) * u;
    const stackTop = this.panelTop();
    const band = this.headBand();
    // `cue` is its own screen-pinned root, unlike the cards which are children of the
    // panel. Place it through pinTo so rotation cannot apply the new camera zoom twice.
    if (this.cueOn) this.s.pinTo(this.cue, this.w / 2, stackTop + band / 2);
    header.setPosition(this.w / 2, stackTop + band / 2).setScale(k);

    const top = stackTop + band;
    const centre = Phaser.Math.Clamp(
      top + span / 2 + Math.max(0, (this.h - top - span - footer) / 2),
      top + span / 2,
      Math.max(top + span / 2, this.h - span / 2 - (cols > 1 ? 48 : 84) * u)
    );

    refresh
      .setPosition(this.w / 2, Math.min(centre + span / 2 + (cols > 1 ? 30 : 46) * u, this.h - 28 * u))
      .setScale(cols > 1 ? Math.min(k, 0.55) : k);

    for (let i = 3; i < c.length; i++) {
      const card = c.getAt(i) as Phaser.GameObjects.Container;
      const idx = card.getData('index') as number;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      // A three-item choice in a two-column grid leaves one final card. Centre it rather
      // than making the composition look accidentally left-aligned.
      const x = idx === 2 && cols === 2 ? this.w / 2 : this.w / 2 - gridW / 2 + cardW / 2 + col * (cardW + gap);
      card
        .setPosition(
          x,
          centre - span / 2 + cardH / 2 + row * (cardH + gap)
        )
        .setScale(k);
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
    // nothing from the run belongs over the card
    this.hush();
    this.xpGlow.setVisible(false);
    this.bannerText.setAlpha(0);
    const c = s.add.container(0, 0).setScrollFactor(0).setDepth(D.overlay);

    // Only ever seen in landscape, where the art is shown whole rather than cropped: a
    // 40px copy of the same art blown up to fill the card, which is a blur by any other
    // name, dimmed so the sharp copy in front of it stays the thing you look at.
    const backdrop = s.add.image(0, 0, 'endcard_bg').setOrigin(0.5).setTint(0x8f9bbd);
    const art = s.add.image(0, 0, 'endcard').setOrigin(0.5);
    // A ramp of thin slices, not a panel: any band wide enough to see the edge of reads
    // as a box sitting on the art, which is exactly what this must not look like.
    const shade = s.add.graphics();

    // Both badges do the same thing: hand off to the network's own install call. The
    // store is the network's to choose - a playable must never carry its own store URL.
    const google = this.makeStoreBadge('playstore');
    const apple = this.makeStoreBadge('appstore');
    // Nested: the inner container carries the pulse, the outer one the layout scale. A
    // tween writes an absolute scale, so pulsing the laid-out container throws its
    // fitted size away and the badges run off the sides of a narrow screen.
    const pulse = s.add.container(0, 0, [google, apple]);
    const btn = s.add.container(0, 0, [pulse]);
    s.tweens.add({ targets: pulse, scale: 1.04, duration: 760, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    c.add([backdrop, art, shade, btn]);
    btn.setData('pair', [google, apple]);
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

    // Side by side on one line - that is how a store lockup reads, and stacking them
    // buries the art. The two badges have different aspects, so they are matched on
    // height and the pair is centred on their combined width.
    const [google, apple] = btn.getData('pair') as Phaser.GameObjects.Container[];
    const gap = BADGE.gap * this.ui;
    const h = BADGE.h * this.ui;
    const widths = [google, apple].map((c) => {
      const img = c.list[0] as Phaser.GameObjects.Image;
      const k = h / img.height;
      img.setScale(k);
      (c.list[1] as Phaser.GameObjects.Rectangle).setScale(k);
      return img.width * k;
    });
    const total = widths[0] + widths[1] + gap;
    google.setPosition(-total / 2 + widths[0] / 2, 0);
    apple.setPosition(total / 2 - widths[1] / 2, 0);
    btn
      .setPosition(this.w / 2, this.h - Math.max(46, this.h * 0.085))
      // 1.04 of headroom for the pulse the inner container is running
      .setScale(Math.min(1, (this.w - 24) / (total * 1.04)));
  }

  // ----------------------------------------------------------------- resize
  resize(width: number, height: number) {
    this.w = width;
    this.h = height;
    // The short side is what decides it: a 1280x800 tablet and a 280x480 phone should
    // give the HUD the same share of the screen, not the same pixel count.
    this.ui = Phaser.Math.Clamp(Math.min(width, height) / 400, 0.7, 2.2);
    const u = this.ui;
    this.restyle();
    this.screens = this.screens.filter((c) => c.scene);
    for (const c of this.screens) this.s.pinTo(c);

    const pad = 14 * u;
    this.drawCue();
    this.layoutBars(width, pad);
    this.layoutLoadout();

    // Everything under the slab stacks off its bottom edge rather than sitting at a
    // fixed row, so nothing lands on top of it when the scale changes.
    const statY = this.barsBottom + 16 * u;
    this.stats.forEach((st, i) => {
      const x = pad + 16 * u + i * Math.min(110 * u, (width - pad * 2) / 3);
      st.icon.setPosition(x, statY).setScale(0.5 * u);
      st.label.setPosition(x + 18 * u, statY);
    });

    this.hudBottom = statY + 14 * u;
    this.loadout.setPosition(pad, height - 54 * u);
    this.bossBar.setPosition(width / 2, statY + 42 * u).setScale(u);

    // Hints sit in the play area, clear of the run stats above them and of the card
    // stack below: a fixed fraction of the height puts them on the HUD on a short screen.
    const hintTop = statY + 34 * u;
    this.bannerText.setPosition(width / 2, Math.max(hintTop + 30 * u, height * 0.26));
    // while a panel is open the panel owns the cue's slot (see layoutOverlay)
    if (!this.overlay || this.overlay.getData('end') || !this.cueOn) {
      this.s.pinTo(this.cue, width / 2, Math.max(hintTop, Math.min(height * 0.2, height * 0.5)));
    }
    this.s.pinTo(this.intro, width / 2, Phaser.Math.Clamp(height * 0.3, hintTop + 40 * u, height * 0.55));
    // "Survive, Upgrade, Evolve!" is authored for a 400px phone and is wider than a
    // small one; the whole overlay shrinks rather than the headline wrapping mid-word.
    const [introTitle, introSub] = this.introInner.list as Phaser.GameObjects.Text[];
    introTitle.setPosition(0, 0);
    introSub.setPosition(0, introTitle.height * 0.72 + 8 * u);
    const introW = Math.max(...this.introInner.list.map((o) => (o as Phaser.GameObjects.Text).width || 0));
    this.introInner.setScale(Math.min(1, (width - 28) / Math.max(1, introW)));

    if (this.overlay?.getData('end')) {
      this.layoutEnd();
    } else if (this.overlay) {
      this.relayout?.();
    }
  }
}
