import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EnterSubmit } from './enter-submit';

@Component({
  imports: [EnterSubmit],
  template: `
    <div appEnterSubmit>
      <input id="name" />
      <textarea id="note"></textarea>
      <button type="button" data-submit [disabled]="off()" (click)="sent = sent + 1">Go</button>
    </div>
  `,
})
class Host {
  sent = 0;
  off = signal(false);
}

const enter = (el: Element, init: KeyboardEventInit = {}) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, ...init }));

describe('EnterSubmit', () => {
  it('submits from a text field when the button is enabled', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    enter(el.querySelector('#name')!);
    expect(fixture.componentInstance.sent).toBe(1);

    enter(el.querySelector('#note')!);
    expect(fixture.componentInstance.sent).toBe(1);
    enter(el.querySelector('#note')!, { metaKey: true });
    expect(fixture.componentInstance.sent).toBe(2);

    fixture.componentInstance.off.set(true);
    await fixture.whenStable();
    enter(el.querySelector('#name')!);
    expect(fixture.componentInstance.sent).toBe(2);
  });
});
