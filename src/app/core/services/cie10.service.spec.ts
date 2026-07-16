import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { Cie10Service } from './cie10.service';

describe('Cie10Service', () => {
  let service: Cie10Service;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/cie10`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(Cie10Service);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('buscar hace GET a /cie10/buscar con el texto como query param', () => {
    const resultado = [{ codigo: 'O80', descripcion: 'PARTO UNICO ESPONTANEO', label: 'O80 — PARTO UNICO ESPONTANEO' }];

    service.buscar('parto').subscribe(res => expect(res).toEqual(resultado));

    const req = httpMock.expectOne(
      r => r.url === `${apiUrl}/buscar` && r.params.get('q') === 'parto'
    );
    expect(req.request.method).toBe('GET');
    req.flush(resultado);
  });
});