import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphQLService } from './graphql.service';

export interface Health {
  status: string;
  version: string;
  database: string;
}

const HEALTH_QUERY = /* GraphQL */ `
  query Health {
    health {
      status
      version
      database
    }
  }
`;

@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly gql = inject(GraphQLService);

  check(): Observable<Health> {
    return this.gql.query<{ health: Health }>(HEALTH_QUERY).pipe(map((d) => d.health));
  }
}
