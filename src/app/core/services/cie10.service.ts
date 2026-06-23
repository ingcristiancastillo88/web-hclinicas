import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import {environment} from '../../../environments/environment';

export interface Cie10Sugerencia {
  codigo:      string;
  descripcion: string;
  label:       string;  // "O80 — PARTO UNICO ESPONTANEO"
}

@Injectable({ providedIn: 'root' })
export class Cie10Service {

  private http = inject(HttpClient);
  private url  = `${environment.apiUrl}/cie10`;

  /** Busca códigos CIE-10 por código o descripción (mín. 2 chars) */
  buscar(texto: string): Observable<any> {
    return this.http.get(`${this.url}/buscar`, { params: { q: texto } });
  }
}
