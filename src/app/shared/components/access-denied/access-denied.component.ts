import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [RouterLink, ButtonModule],
  template: `
    <div class="denied-wrapper">
      <div class="denied-card">
        <div class="denied-icon"><i class="pi pi-lock"></i></div>
        <h2>Acceso Denegado</h2>
        <p>No tienes permisos para acceder a este módulo.<br/>Contacta al administrador del sistema.</p>
        <a routerLink="/dashboard">
          <p-button label="Volver al Dashboard" icon="pi pi-home" />
        </a>
      </div>
    </div>
  `,
  styles: [`
    .denied-wrapper {
      min-height: 100vh; display: flex;
      align-items: center; justify-content: center;
      background: #f4f7fb;
    }
    .denied-card {
      background: white; border-radius: 20px;
      padding: 3rem; text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.1);
      max-width: 420px; width: 90%;
    }
    .denied-icon {
      width: 80px; height: 80px; border-radius: 50%;
      background: #fee2e2; display: flex;
      align-items: center; justify-content: center;
      margin: 0 auto 1.5rem;
    }
    .denied-icon .pi { font-size: 2rem; color: #ef4444; }
    h2 { margin: 0 0 1rem; color: #0a2342; font-size: 1.5rem; }
    p  { margin: 0 0 2rem; color: #64748b; line-height: 1.7; }
  `]
})
export class AccessDeniedComponent {}
