import type { LayoutStore } from "./store.ts";
import { isLocalMedia, loadMedia } from "./media.ts";

/**
 * The L0 background canvas: a fixed, non-interactive layer under #root that
 * paints a color, an image, or a looping video. Every frosted surface samples
 * it through backdrop-filter, which is why it must stay fixed and static —
 * the glass caches hold while the conversation scrolls.
 *
 * Sources may be remote URLs or `idb:` markers pointing at locally picked
 * files (IndexedDB); markers resolve to object URLs asynchronously, with a
 * generation counter so a stale blob can never overwrite a newer setting.
 *
 * Lifecycle guards: the video pauses whenever the tab is hidden or the user
 * prefers reduced motion, and playback errors fall back to the color fill so
 * a dead source never leaves a blank page.
 */
export class BackgroundRuntime {
  private host: HTMLDivElement | undefined;
  private layer: HTMLDivElement | undefined;
  private video: HTMLVideoElement | undefined;
  private unsubscribe: (() => void) | undefined;
  private objectUrl: string | undefined;
  private objectUrlFor = "";
  private generation = 0;
  private readonly handleVisibility = (): void => {
    this.syncVideo();
  };

  constructor(
    private readonly store: LayoutStore,
    private readonly doc: Document,
  ) {}

  install(): () => void {
    const host = this.doc.createElement("div");
    host.className = "dsh-layout-background";
    host.setAttribute("aria-hidden", "true");
    const layer = this.doc.createElement("div");
    layer.className = "dsh-layout-background__layer";
    const video = this.doc.createElement("video");
    video.className = "dsh-layout-background__video";
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("disablepictureinpicture", "");
    video.setAttribute("aria-hidden", "true");
    host.append(layer, video);
    this.doc.body.prepend(host);
    this.host = host;
    this.layer = layer;
    this.video = video;
    this.unsubscribe = this.store.subscribe(() => this.render());
    this.doc.addEventListener("visibilitychange", this.handleVisibility);
    this.render();
    return () => this.dispose();
  }

  dispose(): void {
    this.generation += 1;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.doc.removeEventListener("visibilitychange", this.handleVisibility);
    this.host?.remove();
    this.host = undefined;
    this.layer = undefined;
    this.video = undefined;
    this.revokeObjectUrl();
  }

  private render(): void {
    const host = this.host;
    const layer = this.layer;
    if (host === undefined || layer === undefined) return;
    const settings = this.store.getSnapshot().global.background;
    host.hidden = this.store.getPeek() || settings.mode === "native";
    host.dataset.mode = settings.mode;
    layer.removeAttribute("style");
    if (host.hidden) {
      this.stopVideo();
      return;
    }
    const generation = ++this.generation;
    if (settings.mode === "color") {
      layer.style.background = settings.color;
      this.stopVideo();
    } else if (settings.mode === "image") {
      // The color fill paints first; a resolving local file replaces it.
      layer.style.background = settings.color;
      this.stopVideo();
      if (settings.imageUrl !== "") {
        void this.resolveSource(settings.imageUrl, generation).then(source => {
          if (source === "" || generation !== this.generation) return;
          layer.style.backgroundImage = `url(${JSON.stringify(source)})`;
          layer.style.backgroundSize = "cover";
          layer.style.backgroundPosition = "center";
        });
      }
    } else {
      // Video mode: the color fill stays beneath the element so load errors
      // and the pre-first-frame window never flash a blank canvas.
      layer.style.background = settings.color;
      if (settings.videoUrl !== "") {
        void this.resolveSource(settings.videoUrl, generation).then(source => {
          if (generation !== this.generation) return;
          this.startVideo(source);
        });
      } else {
        this.stopVideo();
      }
    }
  }

  /** Remote URLs pass through; `idb:` markers resolve to fresh object URLs. */
  private async resolveSource(url: string, generation: number): Promise<string> {
    if (!isLocalMedia(url)) return url;
    if (this.objectUrlFor === url && this.objectUrl !== undefined) return this.objectUrl;
    const blob = await loadMedia(url);
    if (blob === undefined || generation !== this.generation) return "";
    this.revokeObjectUrl();
    this.objectUrl = URL.createObjectURL(blob);
    this.objectUrlFor = url;
    return this.objectUrl;
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl !== undefined) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = undefined;
    this.objectUrlFor = "";
  }

  private startVideo(url: string): void {
    const video = this.video;
    if (video === undefined) return;
    if (url === "") return;
    if (video.getAttribute("src") !== url) video.setAttribute("src", url);
    video.hidden = false;
    this.syncVideo();
  }

  private stopVideo(): void {
    const video = this.video;
    if (video === undefined || video.hidden) return;
    video.pause();
    video.removeAttribute("src");
    video.hidden = true;
  }

  /** Pause off-screen playback; resume only while actually visible. The
      performance tier keeps the video parked on its first frame. */
  private syncVideo(): void {
    const video = this.video;
    if (video === undefined || video.hidden) return;
    const reduced = this.prefersReducedMotion() || this.store.getSnapshot().global.quality === "performance";
    const shouldPlay = this.doc.visibilityState === "visible" && !reduced;
    if (shouldPlay && video.paused) video.play().catch(() => {});
    else if (!shouldPlay && !video.paused) video.pause();
  }

  private prefersReducedMotion(): boolean {
    const view = this.doc.defaultView;
    if (view?.matchMedia === undefined) return false;
    return view.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
}
