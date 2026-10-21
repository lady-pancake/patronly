import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Medium } from './medium';

describe('Medium page', () => {
  it('lists painters and filters by availability', async () => {
    await TestBed.configureTestingModule({
      imports: [Medium],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(Medium);
    fixture.componentRef.setInput('name', 'painting');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Showing 3');

    const waitlist = [...el.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Waitlist open',
    );
    waitlist?.click();
    await fixture.whenStable();
    expect(el.textContent).toContain('Showing 1');
    expect(el.textContent).toContain('Maren Oduya');
  });
});
