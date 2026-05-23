import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, LoginRequest, LoginResponse, UsuarioSesion } from '../models';

const TOKEN_KEY = 'hclinicas_token';
const USER_KEY  = 'hclinicas_user';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // ── Signals de sesión ─────────────────────────────────────────────────────
  private _sesion = signal<UsuarioSesion | null>(this.cargarSesion());

  readonly sesion   = this._sesion.asReadonly();
  readonly isLoggedIn = computed(() => this._sesion() !== null);
  readonly rolActual  = computed(() => this._sesion()?.rol ?? null);
  readonly nombreUsuario = computed(() => this._sesion()?.nombreCompleto ?? '');

  constructor(private http: HttpClient, private router: Router) {}

  // ── Login ─────────────────────────────────────────────────────────────────
  login(request: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(
      `${this.apiUrl}/login`, request
    ).pipe(
      tap(response => {
        if (response.exitoso && response.data) {
          this.guardarSesion(response.data);
        }
      })
    );
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._sesion.set(null);
    this.router.navigate(['/auth/login']);
  }

  // ── Token ─────────────────────────────────────────────────────────────────
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  // ── Verificación de roles ─────────────────────────────────────────────────
  tieneRol(...roles: string[]): boolean {
    const rol = this.rolActual();
    if (!rol) return false;
    return roles.some(r => rol.includes(r));
  }

  esSuperAdmin(): boolean {
    return this.tieneRol('SUPERADMINISTRADOR');
  }

  esAdmin(): boolean {
    return this.tieneRol('ADMINISTRADOR', 'SUPERADMINISTRADOR');
  }

  esMedico(): boolean {
    return this.tieneRol('MEDICO_ESPECIALISTA', 'SUPERADMINISTRADOR');
  }

  // ── Helpers privados ──────────────────────────────────────────────────────
  private guardarSesion(data: LoginResponse): void {
    const sesion: UsuarioSesion = {
      usuarioId:      data.usuarioId,
      nombreCompleto: data.nombreCompleto,
      correo:         data.correo,
      rol:            data.rol,
      token:          data.token
    };
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(sesion));
    this._sesion.set(sesion);
  }

  private cargarSesion(): UsuarioSesion | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch { return null; }
  }
}
