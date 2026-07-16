import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/dashboard`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('statsAdmin hace GET a /dashboard/stats', () => {
    service.statsAdmin().subscribe();

    const req = httpMock.expectOne(`${apiUrl}/stats`);
    expect(req.request.method).toBe('GET');
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('statsMedico hace GET a /dashboard/medico', () => {
    service.statsMedico().subscribe();

    const req = httpMock.expectOne(`${apiUrl}/medico`);
    expect(req.request.method).toBe('GET');
    req.flush({ exitoso: true, mensaje: '', data: {} });
  });

  it('citasHoy hace GET a /dashboard/citas-hoy con el tamaño solicitado', () => {
    service.citasHoy(5).subscribe();

    const req = httpMock.expectOne(
      r => r.url === `${apiUrl}/citas-hoy` && r.params.get('tamano') === '5'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ exitoso: true, mensaje: '', data: [] });
  });

  it('citasHoy usa 20 como tamaño por defecto', () => {
    service.citasHoy().subscribe();

    const req = httpMock.expectOne(r => r.url === `${apiUrl}/citas-hoy`);
    expect(req.request.params.get('tamano')).toBe('20');
    req.flush({ exitoso: true, mensaje: '', data: [] });
  });
});