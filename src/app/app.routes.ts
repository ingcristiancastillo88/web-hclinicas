import { Routes } from '@angular/router';
import { noAuthGuard } from './core/guards/no-auth.guard';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';


export const appRoutes: Routes = [

  // ── Autenticación ─────────────────────────────────────────────────────────
  {
    path: 'auth',
    canActivate: [noAuthGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component')
            .then(m => m.LoginComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },

  // ── Área protegida con layout ─────────────────────────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component')
        .then(m => m.MainLayoutComponent),
    children: [

      // Dashboard
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },

      // Gestión de Usuarios
      {
        path: 'usuarios',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_SUPERADMINISTRADOR', 'ROLE_ADMINISTRADOR'] },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/usuarios/usuario-list/usuario-list.component')
                .then(m => m.UsuarioListComponent)
          },
          {
            path: 'nuevo',
            loadComponent: () =>
              import('./features/usuarios/usuario-form/usuario-form.component')
                .then(m => m.UsuarioFormComponent)
          },
          {
            path: 'editar/:id',
            loadComponent: () =>
              import('./features/usuarios/usuario-form/usuario-form.component')
                .then(m => m.UsuarioFormComponent)
          }
        ]
      },

      // Gestión de Roles
      {
        path: 'roles',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_SUPERADMINISTRADOR', 'ROLE_ADMINISTRADOR'] },
        loadComponent: () =>
          import('./features/roles/roles.component')
            .then(m => m.RolesComponent)
      },

      // Auditoría
      {
        path: 'auditoria',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_SUPERADMINISTRADOR', 'ROLE_ADMINISTRADOR'] },
        loadComponent: () =>
          import('./features/auditoria/auditoria.component')
            .then(m => m.AuditoriaComponent)
      },

      // Gestión de Pacientes
      {
        path: 'pacientes',
        canActivate: [roleGuard],
        data: {
          roles: [
            'ROLE_SUPERADMINISTRADOR',
            'ROLE_ADMINISTRADOR',
            'ROLE_MEDICO_ESPECIALISTA'
          ]
        },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/pacientes/paciente-list/paciente-list.component')
                .then(m => m.PacienteListComponent)
          },
          {
            path: 'nuevo',
            loadComponent: () =>
              import('./features/pacientes/paciente-form/paciente-form.component')
                .then(m => m.PacienteFormComponent)
          },
          {
            path: 'editar/:id',
            loadComponent: () =>
              import('./features/pacientes/paciente-form/paciente-form.component')
                .then(m => m.PacienteFormComponent)
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/pacientes/paciente-detalle/paciente-detalle.component')
                .then(m => m.PacienteDetalleComponent)
          }
        ]
      },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // ── Acceso denegado ───────────────────────────────────────────────────────
  {
    path: 'acceso-denegado',
    loadComponent: () =>
      import('./shared/components/access-denied/access-denied.component')
        .then(m => m.AccessDeniedComponent)
  },

  // ── Fallback ──────────────────────────────────────────────────────────────
  { path: '**', redirectTo: 'dashboard' }
];