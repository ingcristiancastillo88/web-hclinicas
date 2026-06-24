import { Component, inject } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule }      from 'primeng/button';
import { AuthService }       from '../../../core/services/auth.service';

/**
 * Pantalla de acceso denegado.
 * Cubre dos casos:
 * 1. Usuario sin permisos para la ruta solicitada
 * 2. Sesión expirada por inactividad (queryParam motivo=inactividad)
 */
@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="denied-wrapper">
      <div class="denied-card">

        <!-- Ícono según el motivo -->
        <div class="denied-icon" [class.icon-timeout]="esInactividad()">
          <i [class]="'pi ' + (esInactividad() ? 'pi-clock' : 'pi-lock')"></i>
        </div>

        <!-- Título y mensaje -->
        @if (esInactividad()) {
          <h2>Sesión cerrada por inactividad</h2>
          <p>
            Tu sesión se cerró automáticamente después de
            <strong>10 minutos</strong> sin actividad
            para proteger la información del sistema.
          </p>
        } @else {
          <h2>Acceso Denegado</h2>
          <p>
            No tienes permisos suficientes para acceder a esta sección.
            Contacta al administrador si crees que esto es un error.
          </p>
        }

        <!-- Acciones -->
        <div class="denied-actions">
          @if (estaAutenticado()) {
            <!-- Usuario logueado pero sin permisos → ir al dashboard -->
            <p-button
              label="Ir al Dashboard"
              icon="pi pi-home"
              styleClass="btn-primary"
              (onClick)="irDashboard()"
            />
          } @else {
            <!-- Sin sesión → iniciar sesión -->
            <p-button
              label="Iniciar Sesión"
              icon="pi pi-sign-in"
              styleClass="btn-primary"
              (onClick)="irLogin()"
            />
          }
        </div>

      </div>
    </div>
  `,
  styles: [`
    .denied-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 2rem;
    }

    .denied-card {
      background: white;
      border-radius: 20px;
      padding: 3rem 2.5rem;
      text-align: center;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    }

    .denied-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #fee2e2, #fecaca);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }

    .denied-icon.icon-timeout {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
    }

    .denied-icon .pi {
      font-size: 2rem;
      color: #dc2626;
    }

    .denied-icon.icon-timeout .pi {
      color: #d97706;
    }

    h2 {
      margin: 0 0 1rem;
      font-size: 1.5rem;
      font-weight: 700;
      color: #0a2342;
    }

    p {
      margin: 0 0 2rem;
      color: #64748b;
      font-size: .95rem;
      line-height: 1.7;
    }

    p strong {
      color: #0a2342;
    }

    .denied-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }

    :deep(.btn-primary) {
      background: linear-gradient(135deg, #0a2342, #1a4a7a) !important;
      border-color: #0a2342 !important;
      color: white !important;
      padding: .75rem 2rem !important;
      border-radius: 10px !important;
      font-size: .95rem !important;
      font-weight: 600 !important;
    }

    :deep(.btn-primary:hover) {
      background: linear-gradient(135deg, #1a4a7a, #2563eb) !important;
    }
  `]
})
export class AccessDeniedComponent {

  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private auth   = inject(AuthService);

  esInactividad(): boolean {
    return this.route.snapshot.queryParamMap.get('motivo') === 'inactividad';
  }

  estaAutenticado(): boolean {
    return !!this.auth.sesion();
  }

  irLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  irDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
