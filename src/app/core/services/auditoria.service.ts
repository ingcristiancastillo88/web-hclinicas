import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Auditoria, PageResponse } from '../models';


@Injectable({ providedIn: 'root' })
export class AuditoriaService {

  private readonly apiUrl = `${environment.apiUrl}/auditoria`;

  constructor(private http: HttpClient) {}

  /**
   * Lista registros de auditoría con filtros opcionales y paginación.
   * GET /api/auditoria?modulo=&accion=&correo=&pagina=0&tamano=20
   */
  listar(
    filtros: { modulo?: string; accion?: string; correo?: string },
    pagina = 0,
    tamano = 20
  ): Observable<ApiResponse<PageResponse<Auditoria>>> {
    let params = new HttpParams()
      .set('pagina', pagina)
      .set('tamano', tamano);

    if (filtros.modulo) params = params.set('modulo', filtros.modulo);
    if (filtros.accion) params = params.set('accion', filtros.accion);
    if (filtros.correo) params = params.set('correo', filtros.correo);

    return this.http.get<ApiResponse<PageResponse<Auditoria>>>(
      this.apiUrl, { params }
    );
  }

  /**
   * Obtiene auditoría de un usuario específico.
   * GET /api/auditoria/usuario/{correo}
   */
  porUsuario(
    correo: string, pagina = 0, tamano = 20
  ): Observable<ApiResponse<PageResponse<Auditoria>>> {
    const params = new HttpParams()
      .set('pagina', pagina)
      .set('tamano', tamano);
    return this.http.get<ApiResponse<PageResponse<Auditoria>>>(
      `${this.apiUrl}/usuario/${encodeURIComponent(correo)}`, { params }
    );
  }

  /**
   * Obtiene auditoría de un módulo específico.
   * GET /api/auditoria/modulo/{modulo}
   */
  porModulo(
    modulo: string, pagina = 0, tamano = 20
  ): Observable<ApiResponse<PageResponse<Auditoria>>> {
    const params = new HttpParams()
      .set('pagina', pagina)
      .set('tamano', tamano);
    return this.http.get<ApiResponse<PageResponse<Auditoria>>>(
      `${this.apiUrl}/modulo/${modulo}`, { params }
    );
  }
}
