import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink }   from '@angular/router';
import { CardModule }   from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/services/auth.service';

interface StatCard {
  titulo: string;
  valor: string;
  icono: string;
  color: string;
  descripcion: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, ButtonModule],
  template: `
    <div class="dashboard">

      <!-- Saludo -->
      <div class="welcome-banner">
        <div class="welcome-text">
          <h2>Bienvenido, <strong>{{ authService.nombreUsuario() }}</strong> 👋</h2>
          <p>Sistema de Historias Clínicas — Ginecología y Obstetricia · Hospital San Juan</p>
        </div>
        <div class="welcome-icon">
          <i class="pi pi-heart-fill"></i>
        </div>
      </div>

      <!-- Tarjetas de estadísticas -->
      <div class="stats-grid">
        @for (card of statCards(); track card.titulo) {
          <div class="stat-card" [style.--card-color]="card.color">
            <div class="stat-icon">
              <i [class]="'pi ' + card.icono"></i>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ card.valor }}</span>
              <span class="stat-title">{{ card.titulo }}</span>
              <span class="stat-desc">{{ card.descripcion }}</span>
            </div>
          </div>
        }
      </div>

      <!-- Accesos rápidos -->
      <div class="quick-access">
        <h3 class="section-title">
          <i class="pi pi-bolt"></i>
          Accesos Rápidos
        </h3>
        <div class="quick-grid">
          <a routerLink="/usuarios" class="quick-card">
            <i class="pi pi-users"></i>
            <span>Gestión de Usuarios</span>
          </a>
          <a routerLink="/roles" class="quick-card">
            <i class="pi pi-shield"></i>
            <span>Gestión de Roles</span>
          </a>
          <a routerLink="/pacientes" class="quick-card">
            <i class="pi pi-id-card"></i>
            <span>Pacientes</span>
          </a>
          <a routerLink="/historias" class="quick-card">
            <i class="pi pi-file-edit"></i>
            <span>Historias Clínicas</span>
          </a>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .dashboard { display: flex; flex-direction: column; gap: 1.8rem; }

    /* Banner de bienvenida */
    .welcome-banner {
      background: linear-gradient(135deg, #0a2342 0%, #1a4a7a 60%, #2d7dd2 100%);
      border-radius: 16px;
      padding: 2rem 2.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: white;
    }

    .welcome-text h2 {
      margin: 0 0 0.5rem;
      font-size: 1.6rem;
      font-weight: 400;
    }

    .welcome-text h2 strong { font-weight: 700; }

    .welcome-text p {
      margin: 0;
      opacity: 0.75;
      font-size: 0.9rem;
    }

    .welcome-icon .pi {
      font-size: 3.5rem;
      opacity: 0.3;
      color: #ff6b8a;
    }

    /* Stats grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: white;
      border-radius: 14px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.2rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      border-left: 4px solid var(--card-color);
      transition: transform 0.18s, box-shadow 0.18s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    }

    .stat-icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      background: color-mix(in srgb, var(--card-color) 15%, transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon .pi {
      font-size: 1.4rem;
      color: var(--card-color);
    }

    .stat-body { display: flex; flex-direction: column; }

    .stat-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: #0a2342;
      line-height: 1;
    }

    .stat-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
      margin-top: 4px;
    }

    .stat-desc {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 2px;
    }

    /* Quick access */
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1rem;
      font-weight: 600;
      color: #0a2342;
      margin: 0 0 1rem;
    }

    .section-title .pi { color: #2d7dd2; }

    .quick-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
    }

    .quick-card {
      background: white;
      border-radius: 14px;
      padding: 1.5rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: #334155;
      font-size: 0.87rem;
      font-weight: 600;
      box-shadow: 0 2px 10px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
      transition: all 0.18s;
      text-align: center;
    }

    .quick-card:hover {
      border-color: #2d7dd2;
      color: #2d7dd2;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(45,125,210,0.15);
    }

    .quick-card .pi { font-size: 1.6rem; }
  `]
})
export class DashboardComponent implements OnInit {

  authService = inject(AuthService);

  statCards = signal<StatCard[]>([
    { titulo: 'Usuarios Activos',    valor: '4',  icono: 'pi-users',     color: '#2d7dd2', descripcion: 'Registrados en el sistema' },
    { titulo: 'Roles del Sistema',   valor: '4',  icono: 'pi-shield',    color: '#0fb8ad', descripcion: 'Perfiles configurados' },
    { titulo: 'Pacientes',           valor: '—',  icono: 'pi-id-card',   color: '#8b5cf6', descripcion: 'Módulo en desarrollo' },
    { titulo: 'Historias Clínicas',  valor: '—',  icono: 'pi-file-edit', color: '#f59e0b', descripcion: 'Módulo en desarrollo' },
  ]);

  ngOnInit(): void {}
}
