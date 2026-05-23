import { Component, inject, signal, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ButtonModule }  from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule }  from 'primeng/ripple';
import { AvatarModule }  from 'primeng/avatar';
import { MenuModule }    from 'primeng/menu';
import { MenuItem as PrimeMenuItem } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { MenuItem } from '../../core/models';

type SidebarMode = 'expanded' | 'collapsed' | 'hidden';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    ButtonModule, TooltipModule, RippleModule, AvatarModule, MenuModule
  ],
  template: `
    <!-- Overlay para modo móvil -->
    @if (sidebarMode() === 'hidden' && mobileOpen()) {
      <div class="sidebar-overlay" (click)="closeMobile()"></div>
    }

    <div class="layout-wrapper" [class]="'mode-' + sidebarMode()"
         [class.mobile-open]="mobileOpen()">

      <!-- ── SIDEBAR ──────────────────────────────────────────────── -->
      <aside class="sidebar">

        <!-- Logo -->
        <div class="sidebar-logo">
          <div class="logo-icon">
            <i class="pi pi-heart-fill"></i>
          </div>
          <span class="logo-text">HClínicas</span>
        </div>

        <!-- Nav items -->
        <nav class="sidebar-nav">
          @for (item of menuItems(); track item.route) {
            @if (canSeeItem(item)) {
              <a
                class="nav-item"
                [routerLink]="item.route"
                routerLinkActive="active"
                [pTooltip]="sidebarMode() === 'collapsed' ? item.label : ''"
                tooltipPosition="right"
                pRipple
                (click)="onNavClick()"
              >
                <i [class]="'pi ' + item.icon"></i>
                <span class="nav-label">{{ item.label }}</span>
                @if (item.badge) {
                  <span class="nav-badge">{{ item.badge }}</span>
                }
              </a>
            }
          }
        </nav>

        <!-- Spacer + user info en el fondo -->
        <div class="sidebar-bottom">
          <div class="user-card"
               [pTooltip]="sidebarMode() === 'collapsed' ? authService.nombreUsuario() : ''"
               tooltipPosition="right">
            <p-avatar
              [label]="getInitials()"
              styleClass="user-avatar"
              shape="circle"
            />
            <div class="user-info">
              <span class="user-name">{{ authService.nombreUsuario() }}</span>
              <span class="user-rol">{{ rolLabel() }}</span>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()"
                  [pTooltip]="sidebarMode() === 'collapsed' ? 'Cerrar sesión' : ''"
                  tooltipPosition="right">
            <i class="pi pi-sign-out"></i>
            <span class="nav-label">Cerrar sesión</span>
          </button>
        </div>

      </aside>

      <!-- ── CONTENIDO PRINCIPAL ───────────────────────────────────── -->
      <div class="layout-content">

        <!-- Topbar -->
        <header class="topbar">
          <!-- Botón toggle sidebar -->
          <button class="toggle-btn" (click)="toggleSidebar()"
                  pRipple pTooltip="Expandir/Colapsar menú" tooltipPosition="bottom">
            <i class="pi" [class.pi-bars]="sidebarMode() !== 'expanded'"
                          [class.pi-arrow-left]="sidebarMode() === 'expanded'"></i>
          </button>

          <!-- Breadcrumb -->
          <div class="topbar-title">
            <i class="pi pi-angle-right breadcrumb-sep"></i>
            <span>{{ pageTitle() }}</span>
          </div>

          <div class="topbar-right">
            <span class="topbar-date">{{ fechaHoy }}</span>
          </div>
        </header>

        <!-- Vista del router -->
        <main class="content-area">
          <router-outlet />
        </main>

      </div>
    </div>
  `,
  styles: [`
    :host {
      --sidebar-w-expanded:  260px;
      --sidebar-w-collapsed: 72px;
      --topbar-h:            64px;
      --azul-oscuro:         #0a2342;
      --azul-medio:          #1a4a7a;
      --azul-claro:          #2d7dd2;
      --teal:                #0fb8ad;
      --sidebar-bg:          #0d2d4e;
      --sidebar-text:        rgba(255,255,255,0.75);
      --sidebar-active:      rgba(45,125,210,0.25);
      --sidebar-hover:       rgba(255,255,255,0.07);
      --content-bg:          #f4f7fb;
      --topbar-bg:           #ffffff;
      --transition:          0.28s cubic-bezier(0.4, 0, 0.2, 1);
      display: block;
      height: 100vh;
    }

    /* ── Overlay móvil ───────────────────────────────────────────── */
    .sidebar-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 99;
      backdrop-filter: blur(2px);
    }

    /* ── Wrapper ─────────────────────────────────────────────────── */
    .layout-wrapper {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* ── SIDEBAR ─────────────────────────────────────────────────── */
    .sidebar {
      width: var(--sidebar-w-expanded);
      background: var(--sidebar-bg);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      transition: width var(--transition), transform var(--transition);
      overflow: hidden;
      position: relative;
      z-index: 100;
    }

    /* Modo collapsed: solo iconos */
    .mode-collapsed .sidebar { width: var(--sidebar-w-collapsed); }

    /* Modo hidden: oculto (móvil) */
    .mode-hidden .sidebar {
      position: fixed;
      top: 0; left: 0; bottom: 0;
      width: var(--sidebar-w-expanded);
      transform: translateX(-100%);
    }

    .mode-hidden.mobile-open .sidebar {
      transform: translateX(0);
    }

    /* ── Logo ────────────────────────────────────────────────────── */
    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 1.4rem 1.2rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      flex-shrink: 0;
    }

    .logo-icon {
      min-width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--azul-claro), var(--teal));
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-icon .pi { color: white; font-size: 1.1rem; }

    .logo-text {
      font-size: 1.25rem;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      opacity: 1;
      transition: opacity var(--transition), max-width var(--transition);
    }

    .mode-collapsed .logo-text { opacity: 0; max-width: 0; }

    /* ── Nav ─────────────────────────────────────────────────────── */
    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.6rem;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      color: var(--sidebar-text);
      text-decoration: none;
      transition: background 0.18s, color 0.18s;
      white-space: nowrap;
      cursor: pointer;
      min-height: 48px;
    }

    .nav-item:hover { background: var(--sidebar-hover); color: #fff; }

    .nav-item.active {
      background: var(--sidebar-active);
      color: #ffffff;
      border-left: 3px solid var(--azul-claro);
    }

    .nav-item .pi {
      font-size: 1.1rem;
      min-width: 20px;
      text-align: center;
    }

    .nav-label {
      font-size: 0.88rem;
      font-weight: 500;
      overflow: hidden;
      white-space: nowrap;
      transition: opacity var(--transition), max-width var(--transition);
    }

    .mode-collapsed .nav-label { opacity: 0; max-width: 0; }

    .nav-badge {
      margin-left: auto;
      background: var(--teal);
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 20px;
      transition: opacity var(--transition);
    }

    .mode-collapsed .nav-badge { opacity: 0; }

    /* ── Sidebar bottom ──────────────────────────────────────────── */
    .sidebar-bottom {
      padding: 0.6rem;
      border-top: 1px solid rgba(255,255,255,0.08);
      flex-shrink: 0;
    }

    .user-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0.75rem;
      border-radius: 10px;
      margin-bottom: 4px;
      overflow: hidden;
    }

    :deep(.user-avatar) {
      min-width: 36px;
      width: 36px !important;
      height: 36px !important;
      background: linear-gradient(135deg, var(--azul-claro), var(--teal)) !important;
      font-size: 0.85rem !important;
      font-weight: 700 !important;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: opacity var(--transition), max-width var(--transition);
    }

    .mode-collapsed .user-info { opacity: 0; max-width: 0; }

    .user-name {
      font-size: 0.82rem;
      font-weight: 600;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-rol {
      font-size: 0.72rem;
      color: var(--teal);
      white-space: nowrap;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0.7rem 1rem;
      border-radius: 10px;
      color: rgba(255,255,255,0.6);
      background: none;
      border: none;
      cursor: pointer;
      width: 100%;
      white-space: nowrap;
      transition: background 0.18s, color 0.18s;
    }

    .logout-btn:hover {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
    }

    .logout-btn .pi { font-size: 1rem; min-width: 20px; text-align: center; }

    /* ── Layout content ──────────────────────────────────────────── */
    .layout-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: margin-left var(--transition);
    }

    /* ── Topbar ──────────────────────────────────────────────────── */
    .topbar {
      height: var(--topbar-h);
      background: var(--topbar-bg);
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0 1.5rem;
      flex-shrink: 0;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }

    .toggle-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--content-bg);
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--azul-oscuro);
      font-size: 1rem;
      transition: background 0.18s;
      flex-shrink: 0;
    }

    .toggle-btn:hover { background: #e2e8f0; }

    .topbar-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 1rem;
      font-weight: 600;
      color: var(--azul-oscuro);
    }

    .breadcrumb-sep { font-size: 0.85rem; color: #94a3b8; }

    .topbar-right {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .topbar-date {
      font-size: 0.82rem;
      color: #64748b;
    }

    /* ── Content area ────────────────────────────────────────────── */
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
      background: var(--content-bg);
    }

    /* ── Modo hidden (móvil) ─────────────────────────────────────── */
    .mode-hidden .layout-content { width: 100%; }

    @media (max-width: 768px) {
      .topbar-date { display: none; }
      .content-area { padding: 1rem; }
    }
  `]
})
export class MainLayoutComponent {

  authService = inject(AuthService);
  private router = inject(Router);

  sidebarMode = signal<SidebarMode>('expanded');
  mobileOpen  = signal(false);

  readonly fechaHoy = new Date().toLocaleDateString('es-EC', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // ── Menú lateral ─────────────────────────────────────────────────────────
  menuItems = signal<MenuItem[]>([
  {
    label: 'Dashboard',
    icon: 'pi-home',
    route: '/dashboard',
    roles: []
  },
  {
    label: 'Usuarios',
    icon: 'pi-users',
    route: '/usuarios',
    roles: ['ROLE_SUPERADMINISTRADOR', 'ROLE_ADMINISTRADOR']
  },
  {
    label: 'Roles',
    icon: 'pi-shield',
    route: '/roles',
    roles: ['ROLE_SUPERADMINISTRADOR', 'ROLE_ADMINISTRADOR']
  },
  {
    label: 'Auditoría',
    icon: 'pi-history',
    route: '/auditoria',
    roles: ['ROLE_SUPERADMINISTRADOR', 'ROLE_ADMINISTRADOR']
  },
  {
    label: 'Pacientes',
    icon: 'pi-id-card',
    route: '/pacientes',
    roles: [
      'ROLE_SUPERADMINISTRADOR',
      'ROLE_ADMINISTRADOR',
      'ROLE_MEDICO_ESPECIALISTA'
    ]
  },
  {
    label: 'Historias Clínicas',
    icon: 'pi-file-edit',
    route: '/historias',
    roles: [
      'ROLE_SUPERADMINISTRADOR',
      'ROLE_ADMINISTRADOR',
      'ROLE_MEDICO_ESPECIALISTA',
      'ROLE_PACIENTE'
    ]
  }
]);

  // ── Título dinámico ───────────────────────────────────────────────────────
  pageTitle = computed(() => {
  const url = this.router.url;
  if (url.includes('dashboard'))  return 'Dashboard';
  if (url.includes('usuarios'))   return 'Gestión de Usuarios';
  if (url.includes('roles'))      return 'Gestión de Roles';
  if (url.includes('auditoria'))  return 'Auditoría del Sistema';
  if (url.includes('historias'))  return 'Historias Clínicas';
  if (url.includes('pacientes'))  return 'Gestión de Pacientes';
  return 'Sistema HClínicas';
});

  rolLabel = computed(() => {
    const rol = this.authService.rolActual() ?? '';
    const labels: Record<string, string> = {
      'ROLE_SUPERADMINISTRADOR': 'Superadministrador',
      'ROLE_ADMINISTRADOR':      'Administrador',
      'ROLE_MEDICO_ESPECIALISTA':'Médico Especialista',
      'ROLE_PACIENTE':           'Paciente'
    };
    return labels[rol] ?? rol;
  });

  // ── Detección de tamaño de pantalla ──────────────────────────────────────
  constructor() {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  checkScreenSize(): void {
    const w = window.innerWidth;
    if (w <= 768) {
      this.sidebarMode.set('hidden');
      this.mobileOpen.set(false);
    } else if (w <= 1024) {
      this.sidebarMode.set('collapsed');
    } else {
      this.sidebarMode.set('expanded');
    }
  }

  // ── Toggle sidebar ────────────────────────────────────────────────────────
  toggleSidebar(): void {
    const mode = this.sidebarMode();
    if (mode === 'hidden') {
      this.mobileOpen.update(v => !v);
    } else {
      this.sidebarMode.set(mode === 'expanded' ? 'collapsed' : 'expanded');
    }
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  onNavClick(): void {
    if (this.sidebarMode() === 'hidden') {
      this.mobileOpen.set(false);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  canSeeItem(item: MenuItem): boolean {
    if (!item.roles || item.roles.length === 0) return true;
    return this.authService.tieneRol(...item.roles);
  }

  getInitials(): string {
    const name = this.authService.nombreUsuario();
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  logout(): void {
    this.authService.logout();
  }
}
