import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { MedicamentoCatalogoService } from './medicamento-catalogo.service';
import { MedicamentoDto } from './documento.service';

describe('MedicamentoCatalogoService', () => {
  let service: MedicamentoCatalogoService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/medicamentos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(MedicamentoCatalogoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('buscar hace GET a /medicamentos/buscar con el texto como query param', () => {
    service.buscar('ibup').subscribe();

    const req = httpMock.expectOne(
      r => r.url === `${apiUrl}/buscar` && r.params.get('q') === 'ibup'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('registrarUso hace POST con los datos del medicamento', () => {
    const med: MedicamentoDto = {
      nombreGenerico: 'Ibuprofeno',
      nombreComercial: 'Ibupirac',
      presentacion: 'Tabletas 400mg',
      indicaciones: 'Cada 8 horas'
    };

    service.registrarUso(med).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/registrar-uso`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(med);
    req.flush({});
  });
});