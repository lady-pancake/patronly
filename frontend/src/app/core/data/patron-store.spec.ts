import { TestBed } from '@angular/core/testing';
import { PatronStore } from './patron-store';

describe('PatronStore', () => {
  let store: PatronStore;

  beforeEach(() => {
    sessionStorage.clear();
    store = TestBed.inject(PatronStore);
  });

  it('toggles favourites', () => {
    expect(store.isFav('hana')).toBe(false);
    store.toggleFav('hana');
    expect(store.isFav('hana')).toBe(true);
    store.toggleFav('hana');
    expect(store.isFav('hana')).toBe(false);
  });

  it('subscribes to and unsubscribes from a newsletter', () => {
    expect(store.isSubscribed('theo')).toBe(false);
    store.toggleNewsletter('theo');
    expect(store.isSubscribed('theo')).toBe(true);
    store.toggleNewsletter('theo');
    expect(store.isSubscribed('theo')).toBe(false);
  });

  it('starts with the artists from saved searches hearted', () => {
    expect(store.isFav('sol')).toBe(true);
    expect(store.isFav('june')).toBe(true);
  });

  it('keeps a saved search with no artists on its list', () => {
    store.saveSearch({ name: 'Bowls', wiz: { mediums: ['Ceramics'] }, ids: [] });
    expect(store.searchList('Bowls')).toEqual([]);
    store.toggleInSearch('Bowls', 'hana');
    expect(store.searchList('Bowls')).toEqual(['hana']);
    expect(store.isFav('hana')).toBe(false);
  });

  it('lists the sample recent search', () => {
    const names = store.searches().map((s) => s.name);
    expect(names).toContain('Oil portrait of my parents');
  });

  it('checks and unchecks artists in a search without touching favourites', () => {
    const name = 'Oil portrait of my parents';
    store.toggleInSearch(name, 'june');
    expect(store.searchList(name)).toEqual(['sol']);
    expect(store.isFav('june')).toBe(true);
    store.toggleInSearch(name, 'clem');
    expect(store.searchList(name)).toEqual(['sol', 'clem']);
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
