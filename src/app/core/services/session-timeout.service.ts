import { Injectable, inject, NgZone } from '@angular/core';
import { Router }                      from '@angular/router';
import { AuthService }                 from './auth.service';

/**
 * Servicio de control de inactividad de sesión.
 * - Detecta inactividad del usuario (mouse, teclado, scroll, touch)
 * - Cierra la sesión automáticamente después de TIMEOUT_MS sin actividad
 * - Muestra aviso 1 minuto antes de cerrar
 */
@Injectable({ providedIn: 'root' })
export class SessionTimeoutService {

  private router = inject(Router);
  private auth   = inject(AuthService);
  private zone   = inject(NgZone);

  // ── Configuración ──────────────────────────────────────────────────────
  private readonly TIMEOUT_MS = 10 * 60 * 1000;   // 10 minutos
  private readonly AVISO_MS   =  9 * 60 * 1000;   //  9 minutos (1 min antes)

  private timerSesion?: ReturnType<typeof setTimeout>;
  private timerAviso?:  ReturnType<typeof setTimeout>;
  private activo = false;

  // Eventos que resetean el contador
  private readonly EVENTOS = [
    'mousemove', 'mousedown', 'keydown',
    'touchstart', 'scroll', 'click'
  ];

  private readonly handlerActividad = () => this.resetTimer();

  // ── API pública ────────────────────────────────────────────────────────

  /** Inicia el monitoreo de inactividad — llamar al hacer login */
  iniciar(): void {
    if (this.activo) return;
    this.activo = true;
    this.zone.runOutsideAngular(() => {
      this.EVENTOS.forEach(ev =>
        window.addEventListener(ev, this.handlerActividad, { passive: true })
      );
    });
    this.resetTimer();
  }

  /** Detiene el monitoreo — llamar al hacer logout */
  detener(): void {
    this.activo = false;
    this.EVENTOS.forEach(ev =>
      window.removeEventListener(ev, this.handlerActividad)
    );
    clearTimeout(this.timerSesion);
    clearTimeout(this.timerAviso);
  }

  // ── Lógica interna ─────────────────────────────────────────────────────

  private resetTimer(): void {
    clearTimeout(this.timerSesion);
    clearTimeout(this.timerAviso);

    // Oculta el aviso si estaba visible
    this.zone.run(() => this.ocultarAviso());

    // Timer de aviso (9 min)
    this.timerAviso = setTimeout(() => {
      this.zone.run(() => this.mostrarAviso());
    }, this.AVISO_MS);

    // Timer de cierre (10 min)
    this.timerSesion = setTimeout(() => {
      this.zone.run(() => this.cerrarSesion());
    }, this.TIMEOUT_MS);
  }

  private mostrarAviso(): void {
    const el = document.getElementById('session-timeout-warning');
    if (el) el.style.display = 'flex';
  }

  private ocultarAviso(): void {
    const el = document.getElementById('session-timeout-warning');
    if (el) el.style.display = 'none';
  }

  private cerrarSesion(): void {
    this.detener();
    this.auth.logout();
    this.router.navigate(['/auth/login'], {
      queryParams: { motivo: 'inactividad' }
    });
  }

  /** Permite al usuario extender la sesión desde el aviso */
  extenderSesion(): void {
    this.resetTimer();
  }
}
