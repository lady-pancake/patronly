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
    expect(el.textContent).toContain('Showing 5');

    const availability = el.querySelector<HTMLSelectElement>('select[aria-label="Availability"]')!;
    availability.value = 'Waitlist open';
    availability.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(el.textContent).toContain('Showing 1');
    expect(el.textContent).toContain('Maren Oduya');
  });
});
