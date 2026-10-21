import { DestroyRef, Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/**
 * Plays a video, muted, while at least half of it is on screen, and pauses it
 * when it scrolls away. Once the visitor pauses it themselves it stays paused.
 * Does nothing for visitors who ask their system for reduced motion.
 */
@Directive({
  selector: 'video[appPlayInView]',
  host: { '(pause)': 'onPause()' },
})
export class PlayInView {
  private readonly video = inject<ElementRef<HTMLVideoElement>>(ElementRef).nativeElement;
  private visible = false;
  private userPaused = false;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      // Browsers only allow autoplay without a click when the video is muted.
      this.video.muted = true;
      const observer = new IntersectionObserver(
        ([entry]) => {
          this.visible = entry.isIntersecting;
          if (this.visible && !this.userPaused) void this.video.play().catch(() => {});
          else if (!this.visible) this.video.pause();
        },
        { threshold: 0.5 },
      );
      observer.observe(this.video);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  /** A pause while the video is on screen came from the visitor, not from scrolling. */
  protected onPause() {
    if (this.visible) this.userPaused = true;
  }
}
