import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * A round profile picture. Without a photo it shows the person's first initial on
 * their colour, the same way the account button does. Size it with classes,
 * e.g. `class="size-10 text-base"`.
 */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'grid shrink-0 place-items-center overflow-hidden rounded-full font-serif leading-none text-[oklch(0.3_0.02_60)] select-none',
    '[style.background]': 'background()',
    '[attr.role]': "'img'",
    '[attr.aria-label]': 'name()',
  },
  template: `@if (!photo()) {
    <span aria-hidden="true">{{ initial() }}</span>
  }`,
})
export class Avatar {
  readonly name = input.required<string>();
  /** Image URL of their photo, if they have one. */
  readonly photo = input<string | null | undefined>(null);
  /** Background colour behind the initial (and while the photo loads). */
  readonly tint = input('oklch(0.86 0.05 60)');

  protected readonly initial = computed(() => (this.name().trim()[0] ?? '?').toUpperCase());
  protected readonly background = computed(() => {
    const src = this.photo();
    return src ? `${this.tint()} url('${src}') center 20%/cover no-repeat` : this.tint();
  });
}
