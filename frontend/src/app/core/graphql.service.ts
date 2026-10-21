import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

/** Minimal GraphQL client. Swap for Apollo Angular once we need caching. */
@Injectable({ providedIn: 'root' })
export class GraphQLService {
  private readonly http = inject(HttpClient);

  query<T>(query: string, variables?: Record<string, unknown>): Observable<T> {
    return this.http.post<GraphQLResponse<T>>(environment.graphqlUrl, { query, variables }).pipe(
      map((res) => {
        if (res.errors?.length) {
          throw new Error(res.errors.map((e) => e.message).join('; '));
        }
        return res.data as T;
      }),
    );
  }
}
