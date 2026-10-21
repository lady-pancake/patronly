import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { GuestSession } from './auth/guest-session';

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

/** Minimal GraphQL client. Swap for Apollo Angular once we need caching. */
@Injectable({ providedIn: 'root' })
export class GraphQLService {
  private readonly http = inject(HttpClient);
  private readonly guest = inject(GuestSession);

  /** Runs a query or mutation, sending the guest pass when there is one. */
  query<T>(query: string, variables?: Record<string, unknown>): Observable<T> {
    const token = this.guest.token();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http
      .post<GraphQLResponse<T>>(environment.graphqlUrl, { query, variables }, { headers })
      .pipe(
        map((res) => {
          if (res.errors?.length) {
            throw new Error(res.errors.map((e) => e.message).join('; '));
          }
          return res.data as T;
        }),
      );
  }
}
