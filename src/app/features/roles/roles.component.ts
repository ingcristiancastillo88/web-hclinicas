import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { CardModule }    from 'primeng/card';
import { TagModule }     from 'primeng/tag';
import { TableModule }   from 'primeng/table';
import { ToastModule }   from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UsuarioService } from '../../core/services/usuario.service';
import { Rol } from '../../core/models';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, TableModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />

    <div class="page-header">
      <div class="page-title">
        <div class="page-icon"><i class="pi pi-shield"></i></div>
        <div>
          <h2>Gestión de Roles</h2>
          <p>Roles y permisos del sistema</p>
        </div>
      </div>
    </div>

    <!-- Cards de roles -->
    <div class="roles-grid">
      @for (rol of roles(); track rol.id) {
        <div class="rol-card" [class]="'rol-' + getRolKey(rol.nombre)">
          <div class="rol-icon">
            <i [class]="'pi ' + getRolIcon(rol.nombre)"></i>
          </div>
          <div class="rol-body">
            <h3>{{ getRolLabel(rol.nombre) }}</h3>
            <p>{{ rol.descripcion }}</p>
            <div class="rol-permisos">
              @for (permiso of getPermisos(rol.nombre); track permiso) {
                <span class="permiso-tag">
                  <i class="pi pi-check"></i> {{ permiso }}
                </span>
              }
            </div>
          </div>
          <div class="rol-badge">
            <span>ID {{ rol.id }}</span>
          </div>
        </div>
      }
    </div>

    <!-- Tabla detalle -->
    <div class="table-section">
      <h3 class="section-title">
        <i class="pi pi-list"></i> Detalle de Roles
      </h3>
      <p-table
        [value]="roles()"
        [loading]="cargando()"
        styleClass="p-datatable-gridlines p-datatable-sm"
        [tableStyle]="{'min-width': '50rem'}"
      >
        <ng-template pTemplate="header">
          <tr>
            <th>ID</th>
            <th>Nombre del Rol</th>
            <th>Etiqueta</th>
            <th>Descripción</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-rol>
          <tr>
            <td>{{ rol.id }}</td>
            <td><code class="rol-code">{{ rol.nombre }}</code></td>
            <td>
              <p-tag
                [value]="getRolLabel(rol.nombre)"
                [severity]="getRolSeverity(rol.nombre)"
              />
            </td>
            <td>{{ rol.descripcion }}</td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="4" class="text-center p-4">No se encontraron roles</td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [`
    /* Header */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .page-icon {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #2d7dd2, #0fb8ad);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .page-icon .pi { font-size: 1.4rem; color: white; }

    .page-title h2 {
      margin: 0 0 2px;
      font-size: 1.4rem;
      font-weight: 700;
      color: #0a2342;
    }

    .page-title p {
      margin: 0;
      color: #64748b;
      font-size: 0.85rem;
    }

    /* Roles grid */
    .roles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.2rem;
      margin-bottom: 2rem;
    }

    .rol-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.07);
      border-top: 4px solid #e2e8f0;
      position: relative;
      transition: transform 0.18s, box-shadow 0.18s;
    }

    .rol-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 28px rgba(0,0,0,0.1);
    }

    .rol-superadministrador { border-top-color: #ef4444; }
    .rol-administrador      { border-top-color: #f59e0b; }
    .rol-medico             { border-top-color: #2d7dd2; }
    .rol-paciente           { border-top-color: #0fb8ad; }

    .rol-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #f4f7fb;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .rol-icon .pi { font-size: 1.3rem; color: #0a2342; }

    .rol-body h3 {
      margin: 0 0 6px;
      font-size: 1rem;
      font-weight: 700;
      color: #0a2342;
    }

    .rol-body p {
      margin: 0 0 1rem;
      font-size: 0.83rem;
      color: #64748b;
      line-height: 1.5;
    }

    .rol-permisos {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .permiso-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #f0f9ff;
      color: #0369a1;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 20px;
      border: 1px solid #bae6fd;
    }

    .permiso-tag .pi { font-size: 0.65rem; }

    .rol-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
    }

    .rol-badge span {
      background: #f4f7fb;
      color: #94a3b8;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 20px;
    }

    /* Table section */
    .table-section {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }

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

    .rol-code {
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.8rem;
      color: #0a2342;
      font-family: monospace;
    }
  `]
})
export class RolesComponent implements OnInit {

  private usuarioService = inject(UsuarioService);
  private toast = inject(MessageService);

  roles    = signal<Rol[]>([]);
  cargando = signal(false);

  ngOnInit(): void { this.cargarRoles(); }

  cargarRoles(): void {
    this.cargando.set(true);
    this.usuarioService.getRoles().subscribe({
      next: res => {
        this.roles.set(res.data ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los roles' });
        this.cargando.set(false);
      }
    });
  }

  getRolKey(nombre: string): string {
    if (nombre.includes('SUPERADMINISTRADOR')) return 'superadministrador';
    if (nombre.includes('ADMINISTRADOR'))      return 'administrador';
    if (nombre.includes('MEDICO'))             return 'medico';
    return 'paciente';
  }

  getRolLabel(nombre: string): string {
    const labels: Record<string, string> = {
      'ROLE_SUPERADMINISTRADOR': 'Superadministrador',
      'ROLE_ADMINISTRADOR':      'Administrador',
      'ROLE_MEDICO_ESPECIALISTA':'Médico Especialista',
      'ROLE_PACIENTE':           'Paciente'
    };
    return labels[nombre] ?? nombre;
  }

  getRolIcon(nombre: string): string {
    if (nombre.includes('SUPERADMINISTRADOR')) return 'pi-crown';
    if (nombre.includes('ADMINISTRADOR'))      return 'pi-cog';
    if (nombre.includes('MEDICO'))             return 'pi-heart';
    return 'pi-user';
  }

  getRolSeverity(nombre: string): 'danger' | 'warning' | 'info' | 'success' {
    if (nombre.includes('SUPERADMINISTRADOR')) return 'danger';
    if (nombre.includes('ADMINISTRADOR'))      return 'warning';
    if (nombre.includes('MEDICO'))             return 'info';
    return 'success';
  }

  getPermisos(nombre: string): string[] {
    const map: Record<string, string[]> = {
      'ROLE_SUPERADMINISTRADOR': ['Acceso total', 'Configuración', 'Base de datos', 'Auditoría'],
      'ROLE_ADMINISTRADOR':      ['Gestión usuarios', 'Supervisión', 'Reportes'],
      'ROLE_MEDICO_ESPECIALISTA':['Pacientes', 'Historias clínicas', 'Citas', 'Documentos PDF'],
      'ROLE_PACIENTE':           ['Consultar citas', 'Ver historial', 'Perfil propio']
    };
    return map[nombre] ?? [];
  }
}
