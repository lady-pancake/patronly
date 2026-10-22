import { TestBed } from '@angular/core/testing';
import { artistById } from '../../core/data/catalog';
import type { Artist } from '../../core/data/models';
import { InquireButton } from './inquire-button';

describe('InquireButton', () => {
  async function render(artist: Artist) {
    await TestBed.configureTestingModule({ imports: [InquireButton] }).compileComponents();
    const fixture = TestBed.createComponent(InquireButton);
    fixture.componentRef.setInput('artist', artist);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows for a studio taking commissions', async () => {
    const el = await render(artistById('june')!);
    expect(el.style.display).toBe('');
  });

  it('is hidden when the studio is not taking commissions', async () => {
    const el = await render({ ...artistById('june')!, availability: 'Closed' });
    expect(el.style.display).toBe('none');
  });
});
