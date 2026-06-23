import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { MedicamentoDto }     from './documento.service';
import {environment} from '../../../environments/environment';

export interface MedicamentoSugerencia {
  id: number;
  nombre: string;
  dosisSugerida: string;
  cantidadSugerida: string;
  indicacionesSugeridas: string;
  vecesUsado: number;
}

@Injectable({ providedIn: 'root' })
export class MedicamentoCatalogoService {

  private http = inject(HttpClient);
  private url  = `${environment.apiUrl}/medicamentos`;

  /** Busca sugerencias de medicamentos por texto parcial (mín. 2 letras) */
  buscar(texto: string): Observable<any> {
    return this.http.get(`${this.url}/buscar`, { params: { q: texto } });
  }

  /** Registra el uso de un medicamento para mejorar futuras sugerencias */
  registrarUso(med: MedicamentoDto): Observable<any> {
    return this.http.post(`${this.url}/registrar-uso`, med);
  }
}
