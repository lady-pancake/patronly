import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StudioFeed } from './studio-feed';

describe('StudioFeed', () => {
  beforeEach(() => sessionStorage.clear());

  it('shows only that studio’s posts, with no per-post buttons', async () => {
    await TestBed.configureTestingModule({
      imports: [StudioFeed],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(StudioFeed);
    fixture.componentRef.setInput('id', 'theo');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Theo’s feed');
    expect(el.querySelectorAll('app-feed-post').length).toBe(1);
    expect(el.textContent).not.toContain('Suggested for you');
    expect(el.querySelectorAll('app-feed-post button').length).toBe(0);
  });
});
