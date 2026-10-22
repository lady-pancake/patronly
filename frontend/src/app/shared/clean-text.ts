import { DestroyRef, Directive, ElementRef, Renderer2, inject, signal } from '@angular/core';
import {
  RegExpMatcher,
  TextCensor,
  asteriskCensorStrategy,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity';

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});
const censor = new TextCensor().setStrategy(asteriskCensorStrategy());

/** Replaces profanity with asterisks of the same length. Returns the text unchanged if clean. */
export function censorText(text: string): string {
  const matches = matcher.getAllMatches(text);
  return matches.length ? censor.applyTo(text, matches) : text;
}

const NOTE = 'Please keep it kind. That word isn’t allowed, so we’ve starred it out.';

/**
 * Put on any text field patrons or artists type into. Blocked words are starred
 * out as they are typed, and the field shows a red outline and note for a few
 * seconds.
 */
@Directive({
  selector: 'input[appCleanText], textarea[appCleanText]',
  host: {
    '(input)': 'check()',
    '[attr.aria-invalid]': 'flagged() || null',
    '[class.!ring-2]': 'flagged()',
    '[class.!ring-destructive]': 'flagged()',
    '[class.!border-destructive]': 'flagged()',
  },
})
export class CleanText {
  private readonly el = inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  protected readonly flagged = signal(false);
  private note?: HTMLElement;
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
      this.note?.remove();
    });
  }

  protected check() {
    const field = this.el.nativeElement;
    const clean = censorText(field.value);
    if (clean === field.value) return;
    const { selectionStart, selectionEnd } = field;
    field.value = clean;
    field.setSelectionRange(selectionStart, selectionEnd);
    // Let ngModel and (input) handlers pick up the starred-out text.
    field.dispatchEvent(new Event('input', { bubbles: true }));
    this.flag();
  }

  private flag() {
    this.flagged.set(true);
    if (!this.note) {
      this.note = this.renderer.createElement('p');
      this.note!.className = 'mt-1.5 text-xs font-medium text-destructive';
      this.note!.setAttribute('role', 'alert');
      this.note!.textContent = NOTE;
      this.el.nativeElement.insertAdjacentElement('afterend', this.note!);
    }
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.flagged.set(false);
      this.note?.remove();
      this.note = undefined;
    }, 5000);
  }
}
