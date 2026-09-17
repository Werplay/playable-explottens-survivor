import * as Phaser from 'phaser';
// Side-effect import: the bundle hangs the plugin class off window.SpinePlugin.
// It carries the Spine 3.8.95 runtime the player skeleton is converted for.
import 'phaser/plugins/spine/dist/SpinePlugin.min.js';
// Side-effect import: the bundle hangs the plugin class off window.SpinePlugin.
// It carries the Spine 3.8.95 runtime the player skeleton is converted for.
import { GameScene } from './GameScene';

export class Game extends Phaser.Game {
  // Every size in the game - the HUD's `ui` scale, the world camera's zoom - is already
  // computed as a ratio of the canvas's own pixel dimensions rather than a fixed pixel
  // count, so drawing at a higher pixel density is just a matter of feeding it a bigger
  // canvas: everything scales up with it and lands back at the same on-screen size once
  // the CSS box is pinned back down to the logical one (see fitCanvas). Capped at 2x - a
  // playable has to run smoothly on the cheapest device a network throws at it, and 3x
  // would roughly double the WebGL fill-rate cost over 2x for a sharpness gain nobody's
  // eye can tell apart on a phone screen.
  private static readonly MAX_DPR = 2;
  private dpr = Game.dprOf();

  constructor(width: number, height: number) {
    super({
      type: Phaser.AUTO,
      width: width * Game.dprOf(),
      height: height * Game.dprOf(),
      backgroundColor: '#57bdf9',
      parent: document.body,
      powerPreference: 'high-performance',
      render: { antialias: true, roundPixels: false },
      // Playables run in a cross-origin iframe where Phaser's window.top listeners
      // throw; the canvas listeners are all this game needs.
      input: { windowEvents: false },
      scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.CENTER_BOTH },
      plugins: {
        scene: [{ key: 'SpinePlugin', plugin: (window as any).SpinePlugin, mapping: 'spine' }]
      },
      scene: GameScene
    });
    this.fitCanvas(width, height);
  }

  private static dprOf(): number {
    return Phaser.Math.Clamp(window.devicePixelRatio || 1, 1, Game.MAX_DPR);
  }

  private get main(): GameScene | undefined {
    return this.scene.getScene('GameScene') as GameScene | undefined;
  }

  /** Phaser sizes the canvas's CSS box to match the drawing-buffer size passed to it -
   *  pull it back down to the logical size the ad container actually gave us, so the
   *  larger buffer supersamples into that box instead of rendering oversized. */
  private fitCanvas(width: number, height: number): void {
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  public resize(width: number, height: number): void {
    this.scale.resize(width * this.dpr, height * this.dpr);
    this.fitCanvas(width, height);
    this.main?.resize(width * this.dpr, height * this.dpr);
  }

  public pause(): void {
    this.scene.pause('GameScene');
    // Pausing the scene stops nothing that is already playing - the music would carry on
    // over whatever the network put in front of the ad.
    this.sound.pauseAll();
  }

  public resume(): void {
    this.scene.resume('GameScene');
    this.sound.resumeAll();
  }

  public volume(value: number): void {
    this.sound.setVolume(value);
  }

  public finish(): void {
    /* ad network ended the placement — nothing to tear down */
  }
}
