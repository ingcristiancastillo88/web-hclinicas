import { Component, inject } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { ButtonModule }      from 'primeng/button';
import { SessionTimeoutService } from '../../../core/services/session-timeout.service';

/**
 * Banner de aviso que aparece 1 minuto antes de que la sesión expire.
 * Se incluye UNA VEZ en el MainLayoutComponent con id="session-timeout-warning".
 * El SessionTimeoutService lo muestra/oculta directamente por DOM
 * para evitar dependencias de ChangeDetection.
 */
@Component({
  selector: 'app-session-warning',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div id="session-timeout-warning" class="session-warning-overlay" style="display:none">
      <div class="session-warning-card">
        <div class="sw-icon">
          <i class="pi pi-clock"></i>
        </div>
        <div class="sw-content">
          <span class="sw-titulo">Sesión por expirar</span>
          <span class="sw-texto">
            Tu sesión se cerrará en <strong>1 minuto</strong> por inactividad.
          </span>
        </div>
        <p-button
          label="Continuar sesión"
          icon="pi pi-refresh"
          styleClass="btn-continuar"
          (onClick)="extender()"
        />
      </div>
    </div>
  `,
  styles: [`
    .session-warning-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.45);
      z-index: 9999;
      align-items: center;
      justify-content: center;
    }

    .session-warning-card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      max-width: 520px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideIn .25s ease;
    }

    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to   { transform: translateY(0);     opacity: 1; }
    }

    .sw-icon {
      width: 52px; height: 52px;
      border-radius: 14px;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .sw-icon .pi {
      font-size: 1.4rem;
      color: #d97706;
    }

    .sw-content {
      display: flex; flex-direction: column; gap: 4px; flex: 1;
    }

    .sw-titulo {
      font-size: .95rem; font-weight: 700; color: #0a2342;
    }

    .sw-texto {
      font-size: .85rem; color: #64748b;
    }

    .sw-texto strong { color: #dc2626; }

    :deep(.btn-continuar) {
      background: linear-gradient(135deg, #0a2342, #1a4a7a) !important;
      border-color: #0a2342 !important;
      color: white !important;
      white-space: nowrap;
      border-radius: 8px !important;
      flex-shrink: 0;
    }
  `]
})
export class SessionWarningComponent {
  private sessionSvc = inject(SessionTimeoutService);

  extender(): void {
    this.sessionSvc.extenderSesion();
  }
}
