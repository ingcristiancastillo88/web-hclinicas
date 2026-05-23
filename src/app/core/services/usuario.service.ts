import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActualizarUsuarioRequest, ApiResponse, CrearUsuarioRequest, PageResponse, Rol, Usuario } from '../models';


@Injectable({ providedIn: 'root' })
export class UsuarioService {

  private readonly apiUrl     = `${environment.apiUrl}/usuarios`;
  private readonly rolesUrl   = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  // ── Roles ─────────────────────────────────────────────────────────────────
  getRoles(): Observable<ApiResponse<Rol[]>> {
    return this.http.get<ApiResponse<Rol[]>>(this.rolesUrl);
  }

  // ── Listar con búsqueda paginada ──────────────────────────────────────────
  listar(busqueda = '', pagina = 0, tamano = 10):
      Observable<ApiResponse<PageResponse<Usuario>>> {
    const params = new HttpParams()
      .set('busqueda', busqueda)
      .set('pagina', pagina)
      .set('tamano', tamano);
    return this.http.get<ApiResponse<PageResponse<Usuario>>>(
      this.apiUrl, { params }
    );
  }

  // ── Obtener por ID ────────────────────────────────────────────────────────
  obtener(id: number): Observable<ApiResponse<Usuario>> {
    return this.http.get<ApiResponse<Usuario>>(`${this.apiUrl}/${id}`);
  }

  // ── Crear ─────────────────────────────────────────────────────────────────
  crear(request: CrearUsuarioRequest): Observable<ApiResponse<Usuario>> {
    return this.http.post<ApiResponse<Usuario>>(this.apiUrl, request);
  }

  // ── Actualizar ────────────────────────────────────────────────────────────
  actualizar(id: number, request: ActualizarUsuarioRequest):
      Observable<ApiResponse<Usuario>> {
    return this.http.put<ApiResponse<Usuario>>(`${this.apiUrl}/${id}`, request);
  }

  // ── Desactivar ────────────────────────────────────────────────────────────
  desactivar(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(
      `${this.apiUrl}/${id}/desactivar`, {}
    );
  }

  // ── Activar ───────────────────────────────────────────────────────────────
  activar(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(
      `${this.apiUrl}/${id}/activar`, {}
    );
  }
}
