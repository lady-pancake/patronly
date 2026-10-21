import { Injectable, signal } from '@angular/core';

const KEY = 'patronly.guestPass';

function read(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/**
 * The guest pass the API hands out after the password gate.
 * Kept in session storage, so each new tab session starts at the gate (and is logged as a visit).
 */
@Injectable({ providedIn: 'root' })
export class GuestSession {
  private readonly _token = signal<string | null>(read());
  readonly token = this._token.asReadonly();

  set(token: string | null): void {
    this._token.set(token);
    try {
      if (token) sessionStorage.setItem(KEY, token);
      else sessionStorage.removeItem(KEY);
    } catch {
      // Without storage the pass lasts until the page reloads.
    }
  }
}
