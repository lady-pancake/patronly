import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CleanText, censorText } from './clean-text';

@Component({
  imports: [FormsModule, CleanText],
  template: `<textarea appCleanText [(ngModel)]="text"></textarea>`,
})
class Host {
  text = signal('');
}

describe('CleanText', () => {
  it('stars out profanity and keeps clean text as is', () => {
    expect(censorText('what the fuck')).toBe('what the ****');
    expect(censorText('A portrait of my parents')).toBe('A portrait of my parents');
  });

  it('stars out a blocked word as it is typed and shows a note', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const field = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    field.value = 'this is shit';
    field.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(field.value).toBe('this is ****');
    expect(fixture.componentInstance.text()).toBe('this is ****');
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('Please keep it kind');
  });
});
