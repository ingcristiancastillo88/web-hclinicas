import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActualizarCitaRequest, CancelarCitaRequest, CitaMedica, CitaResumen, CrearCitaRequest, Disponibilidad, EstadoCita } from '../models/cita.models';
import { ApiResponse, PageResponse } from '../models';


@Injectable({ providedIn: 'root' })
export class CitaMedicaService {

  private readonly url = `${environment.apiUrl}/citas`;

  constructor(private http: HttpClient) {}

  // ── CRUD ──────────────────────────────────────────────────────────────────
  crear(req: CrearCitaRequest): Observable<ApiResponse<CitaMedica>> {
    return this.http.post<ApiResponse<CitaMedica>>(this.url, req);
  }

  listar(
    estado?: EstadoCita,
    fecha?: string,
    busqueda = '',
    pagina = 0,
    tamano = 10
  ): Observable<ApiResponse<PageResponse<CitaResumen>>> {
    let params = new HttpParams()
      .set('busqueda', busqueda)
      .set('pagina',   pagina)
      .set('tamano',   tamano);
    if (estado) params = params.set('estado', estado);
    if (fecha)  params = params.set('fecha',  fecha);
    return this.http.get<ApiResponse<PageResponse<CitaResumen>>>(
      this.url, { params }
    );
  }

  obtener(id: number): Observable<ApiResponse<CitaMedica>> {
    return this.http.get<ApiResponse<CitaMedica>>(`${this.url}/${id}`);
  }

  actualizar(
    id: number, req: ActualizarCitaRequest
  ): Observable<ApiResponse<CitaMedica>> {
    return this.http.put<ApiResponse<CitaMedica>>(`${this.url}/${id}`, req);
  }

  // ── Estados ───────────────────────────────────────────────────────────────
  cancelar(
    id: number, req: CancelarCitaRequest
  ): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(
      `${this.url}/${id}/cancelar`, req
    );
  }

  marcarAtendida(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(
      `${this.url}/${id}/atendida`, {}
    );
  }

  marcarNoAsistio(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(
      `${this.url}/${id}/no-asistio`, {}
    );
  }

  // ── Calendario ────────────────────────────────────────────────────────────
  calendario(
    inicio: string, fin: string
  ): Observable<ApiResponse<CitaResumen[]>> {
    const params = new HttpParams()
      .set('inicio', inicio)
      .set('fin',    fin);
    return this.http.get<ApiResponse<CitaResumen[]>>(
      `${this.url}/calendario`, { params }
    );
  }

  porDia(fecha: string): Observable<ApiResponse<CitaResumen[]>> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<ApiResponse<CitaResumen[]>>(
      `${this.url}/dia`, { params }
    );
  }

  // ── Disponibilidad ────────────────────────────────────────────────────────
  verificarDisponibilidad(
    fecha: string, hora: string, duracion = 30
  ): Observable<ApiResponse<Disponibilidad>> {
    const params = new HttpParams()
      .set('fecha',    fecha)
      .set('hora',     hora)
      .set('duracion', duracion);
    return this.http.get<ApiResponse<Disponibilidad>>(
      `${this.url}/disponibilidad`, { params }
    );
  }

  // ── Paciente ──────────────────────────────────────────────────────────────
  porPaciente(
    pacienteId: number, pagina = 0, tamano = 10
  ): Observable<ApiResponse<PageResponse<CitaResumen>>> {
    const params = new HttpParams()
      .set('pagina', pagina)
      .set('tamano', tamano);
    return this.http.get<ApiResponse<PageResponse<CitaResumen>>>(
      `${this.url}/paciente/${pacienteId}`, { params }
    );
  }
}