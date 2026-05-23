import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActualizarPacienteRequest, ApiResponse, CrearPacienteRequest, Paciente, PacienteResumen, PageResponse } from '../models';


@Injectable({ providedIn: 'root' })
export class PacienteService {

  private readonly apiUrl = `${environment.apiUrl}/pacientes`;

  constructor(private http: HttpClient) {}

  listar(
    busqueda = '', pagina = 0, tamano = 10, soloActivos = true
  ): Observable<ApiResponse<PageResponse<PacienteResumen>>> {
    const params = new HttpParams()
      .set('busqueda',    busqueda)
      .set('pagina',      pagina)
      .set('tamano',      tamano)
      .set('soloActivos', soloActivos);
    return this.http.get<ApiResponse<PageResponse<PacienteResumen>>>(
      this.apiUrl, { params }
    );
  }

  obtener(id: number): Observable<ApiResponse<Paciente>> {
    return this.http.get<ApiResponse<Paciente>>(`${this.apiUrl}/${id}`);
  }

  obtenerPorCedula(cedula: string): Observable<ApiResponse<Paciente>> {
    return this.http.get<ApiResponse<Paciente>>(
      `${this.apiUrl}/cedula/${cedula}`
    );
  }

  crear(request: CrearPacienteRequest): Observable<ApiResponse<Paciente>> {
    return this.http.post<ApiResponse<Paciente>>(this.apiUrl, request);
  }

  actualizar(
    id: number, request: ActualizarPacienteRequest
  ): Observable<ApiResponse<Paciente>> {
    return this.http.put<ApiResponse<Paciente>>(
      `${this.apiUrl}/${id}`, request
    );
  }

  desactivar(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(
      `${this.apiUrl}/${id}/desactivar`, {}
    );
  }

  activar(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(
      `${this.apiUrl}/${id}/activar`, {}
    );
  }
}
