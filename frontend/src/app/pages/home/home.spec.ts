import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Home } from './home';

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('shows the API status returned by the health query', async () => {
    const fixture = TestBed.createComponent(Home);
    const http = TestBed.inject(HttpTestingController);

    const req = http.expectOne(environment.graphqlUrl);
    expect(req.request.body.query).toContain('health');
    req.flush({ data: { health: { status: 'ok', version: '0.1.0', database: 'ok' } } });

    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="api-status"]')?.textContent).toContain('ok');
    http.verify();
  });

  it('shows unreachable when the API errors', async () => {
    const fixture = TestBed.createComponent(Home);
    const http = TestBed.inject(HttpTestingController);

    http.expectOne(environment.graphqlUrl).error(new ProgressEvent('error'));

    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="api-status"]')?.textContent).toContain('unreachable');
  });
});
