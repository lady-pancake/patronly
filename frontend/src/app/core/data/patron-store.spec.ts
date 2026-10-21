import { TestBed } from '@angular/core/testing';
import { PatronStore } from './patron-store';

describe('PatronStore', () => {
  let store: PatronStore;

  beforeEach(() => {
    sessionStorage.clear();
    store = TestBed.inject(PatronStore);
  });

  it('toggles favourites', () => {
    expect(store.isFav('sol')).toBe(false);
    store.toggleFav('sol');
    expect(store.isFav('sol')).toBe(true);
    store.toggleFav('sol');
    expect(store.isFav('sol')).toBe(false);
  });

  it('hides sample searches whose artists are not listed', () => {
    const names = store.searches().map((s) => s.name);
    expect(names).toContain('Oil portrait of my parents');
    expect(names).not.toContain('Large textile for a stairwell');
  });

  it('removes a sample recent search', () => {
    store.removeSearch('Oil portrait of my parents');
    expect(store.searches().map((s) => s.name)).not.toContain('Oil portrait of my parents');
  });

  it('starts a conversation when an inquiry is sent', () => {
    const id = store.sendInquiry('sol', {
      works: [0],
      type: 'Small',
      budget: null,
      timeline: 'Flexible',
      msg: 'Our riad in spring',
    });
    const t = store.threads()[0];
    expect(t.id).toBe(id);
    expect(t.status).toBe('Awaiting reply');
    store.sendMessage(id, 'Hello');
    expect(store.threads()[0].msgs.at(-1)).toMatchObject({ me: true, text: 'Hello' });
  });
});
