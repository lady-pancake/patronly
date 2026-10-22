import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Feed } from './feed';

describe('Feed', () => {
  beforeEach(() => sessionStorage.clear());

  async function render() {
    await TestBed.configureTestingModule({
      imports: [Feed],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(Feed);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('marks posts from artists you have not hearted as suggested', async () => {
    const { el } = await render();
    const posts = [...el.querySelectorAll('article')];
    const theo = posts.find((a) => a.textContent?.includes('Theo Laskaris'))!;
    const clem = posts.find((a) => a.textContent?.includes('Clémence Aubry'))!;
    expect(theo.textContent).toContain('Suggested for you');
    expect(clem.textContent).not.toContain('Suggested for you');
  });

  it('hearts an artist and subscribes to their newsletter from a post', async () => {
    const { fixture, el } = await render();
    const theo = () =>
      [...el.querySelectorAll('article')].find((a) => a.textContent?.includes('Theo Laskaris'))!;
    const button = (label: string) =>
      [...theo().querySelectorAll('button')].find((b) => b.textContent?.includes(label))!;
    button('Favorite').click();
    button('Subscribe').click();
    await fixture.whenStable();
    expect(theo().textContent).not.toContain('Suggested for you');
    expect(button('Favorited').getAttribute('aria-pressed')).toBe('true');
    expect(button('Subscribed').getAttribute('aria-pressed')).toBe('true');
  });
});
