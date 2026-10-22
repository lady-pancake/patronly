import { Directive, ElementRef, inject } from '@angular/core';

/**
 * Pressing Enter in a text field presses the area's main button (the one marked
 * `data-submit`), as long as that button is enabled. In a textarea, Enter adds a
 * new line and Cmd/Ctrl+Enter submits. Fields that already use Enter, like tag
 * inputs, keep their own behaviour.
 */
@Directive({
  selector: '[appEnterSubmit]',
  host: { '(keydown)': 'onKey($event)' },
})
export class EnterSubmit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected onKey(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.defaultPrevented || event.isComposing) return;
    const target = event.target as HTMLElement;
    if (target.getAttribute('role') === 'radio') {
      // Choosing an option with Enter picks it and moves on, like a form would.
      target.click();
    } else if (target.tagName === 'TEXTAREA') {
      if (!event.metaKey && !event.ctrlKey) return;
    } else if (target.tagName !== 'INPUT') {
      return;
    }
    const button = this.host.nativeElement.querySelector<HTMLButtonElement>('[data-submit]');
    if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') return;
    event.preventDefault();
    button.click();
  }
}
