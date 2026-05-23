import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterLink }     from '@angular/router';
import { FormsModule }    from '@angular/forms';
import { TableModule }    from 'primeng/table';
import { ButtonModule }   from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule }      from 'primeng/tag';
import { ToastModule }    from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule }  from 'primeng/tooltip';
import { AvatarModule }   from 'primeng/avatar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Usuario } from '../../../core/models';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    TableModule, ButtonModule, InputTextModule,
    TagModule, ToastModule, ConfirmDialogModule,
    TooltipModule, AvatarModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <!-- Header de página -->
    <div class="page-header">
      <div class="page-title">
        <div class="page-icon"><i class="pi pi-users"></i></div>
        <div>
          <h2>Gestión de Usuarios</h2>
          <p>Administra los usuarios y sus roles</p>
        </div>
      </div>
      <a routerLink="/usuarios/nuevo">
        <p-button
          label="Nuevo Usuario"
          icon="pi pi-plus"
          styleClass="btn-primary"
        />
      </a>
    </div>

    <!-- Barra de búsqueda + stats -->
    <div class="toolbar">
      <span class="p-input-icon-left search-box">
        <i class="pi pi-search"></i>
        <input
          pInputText
          type="text"
          placeholder="Buscar por nombre, cédula o correo..."
          [(ngModel)]="busqueda"
          (ngModelChange)="onBusquedaChange($event)"
          class="search-input"
        />
      </span>
      <div class="toolbar-stats">
        <span class="stat-pill">
          <i class="pi pi-users"></i>
          {{ totalElementos() }} usuarios
        </span>
      </div>
    </div>

    <!-- Tabla -->
    <div class="table-container">
      <p-table
        [value]="usuarios()"
        [loading]="cargando()"
        [lazy]="true"
        [paginator]="true"
        [rows]="tamano"
        [totalRecords]="totalElementos()"
        (onPage)="onPageChange($event)"
        styleClass="p-datatable-gridlines"
        [tableStyle]="{'min-width': '60rem'}"
        [rowHover]="true"
      >
        <ng-template pTemplate="header">
          <tr>
            <th style="width:56px"></th>
            <th pSortableColumn="nombres">
              Usuario <p-sortIcon field="nombres" />
            </th>
            <th>Cédula</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Estado</th>
            <th style="width:140px; text-align:center">Acciones</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-usuario>
          <tr>
            <!-- Avatar -->
            <td>
              <p-avatar
                [label]="getInitials(usuario)"
                shape="circle"
                [style]="{'background': getAvatarColor(usuario.rol), 'color': '#fff', 'font-weight': '700'}"
              />
            </td>

            <!-- Nombre -->
            <td>
              <div class="user-cell">
                <span class="user-name">{{ usuario.nombreCompleto }}</span>
                <span class="user-email-sm">{{ usuario.correo }}</span>
              </div>
            </td>

            <!-- Cédula -->
            <td>
              <code class="cedula-code">{{ usuario.cedula ?? '—' }}</code>
            </td>

            <!-- Correo -->
            <td class="hide-md">{{ usuario.correo }}</td>

            <!-- Rol -->
            <td>
              <p-tag
                [value]="getRolLabel(usuario.rol)"
                [severity]="getRolSeverity(usuario.rol)"
              />
            </td>

            <!-- Estado -->
            <td>
              <span class="estado-badge" [class]="'estado-' + usuario.estado.toLowerCase()">
                <i [class]="'pi ' + (usuario.estado === 'ACTIVO' ? 'pi-check-circle' : 'pi-times-circle')"></i>
                {{ usuario.estado }}
              </span>
            </td>

            <!-- Acciones -->
            <td>
              <div class="actions">
                <a [routerLink]="['/usuarios/editar', usuario.id]">
                  <p-button
                    icon="pi pi-pencil"
                    [rounded]="true"
                    [text]="true"
                    severity="info"
                    pTooltip="Editar"
                    tooltipPosition="top"
                  />
                </a>

                @if (usuario.estado === 'ACTIVO') {
                  <p-button
                    icon="pi pi-ban"
                    [rounded]="true"
                    [text]="true"
                    severity="warning"
                    pTooltip="Desactivar"
                    tooltipPosition="top"
                    (onClick)="confirmarDesactivar(usuario)"
                  />
                } @else {
                  <p-button
                    icon="pi pi-check"
                    [rounded]="true"
                    [text]="true"
                    severity="success"
                    pTooltip="Activar"
                    tooltipPosition="top"
                    (onClick)="activar(usuario)"
                  />
                }
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7">
              <div class="empty-state">
                <i class="pi pi-users"></i>
                <p>No se encontraron usuarios</p>
                <small>Intenta ajustar los filtros de búsqueda</small>
              </div>
            </td>
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

    .page-title { display: flex; align-items: center; gap: 1rem; }

    .page-icon {
      width: 52px; height: 52px;
      background: linear-gradient(135deg, #2d7dd2, #0fb8ad);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
    }

    .page-icon .pi { font-size: 1.4rem; color: white; }

    .page-title h2 { margin: 0 0 2px; font-size: 1.4rem; font-weight: 700; color: #0a2342; }
    .page-title p  { margin: 0; color: #64748b; font-size: 0.85rem; }

    /* Toolbar */
    .toolbar {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .search-box { flex: 1; min-width: 260px; }

    .search-input {
      width: 100%;
      border-radius: 10px;
      padding-left: 2.5rem !important;
    }

    .toolbar-stats { margin-left: auto; }

    .stat-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: white;
      border: 1px solid #e2e8f0;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.83rem;
      font-weight: 600;
      color: #334155;
    }

    .stat-pill .pi { color: #2d7dd2; }

    /* Table */
    .table-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    .user-cell { display: flex; flex-direction: column; }
    .user-name { font-weight: 600; color: #0a2342; font-size: 0.9rem; }
    .user-email-sm { font-size: 0.75rem; color: #94a3b8; display: none; }

    @media (max-width: 768px) {
      .user-email-sm { display: block; }
      .hide-md { display: none; }
    }

    .cedula-code {
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-family: monospace;
    }

    /* Estado badge */
    .estado-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 600;
    }

    .estado-activo   { background: #dcfce7; color: #166534; }
    .estado-inactivo { background: #fef3c7; color: #92400e; }
    .estado-eliminado{ background: #fee2e2; color: #991b1b; }

    /* Actions */
    .actions { display: flex; align-items: center; justify-content: center; gap: 4px; }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      color: #94a3b8;
    }

    .empty-state .pi { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state p   { margin: 0; font-size: 1rem; font-weight: 600; color: #64748b; }
    .empty-state small { font-size: 0.83rem; }
  `]
})
export class UsuarioListComponent implements OnInit {

  private usuarioService    = inject(UsuarioService);
  private toast             = inject(MessageService);
  private confirmService    = inject(ConfirmationService);

  usuarios       = signal<Usuario[]>([]);
  cargando       = signal(false);
  totalElementos = signal(0);
  busqueda       = '';
  pagina         = 0;
  tamano         = 10;

  private busqueda$ = new Subject<string>();

  ngOnInit(): void {
    this.busqueda$.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(term => {
      this.busqueda = term;
      this.pagina   = 0;
      this.cargar();
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.usuarioService.listar(this.busqueda, this.pagina, this.tamano).subscribe({
      next: res => {
        this.usuarios.set(res.data?.contenido ?? []);
        this.totalElementos.set(res.data?.totalElementos ?? 0);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios' });
        this.cargando.set(false);
      }
    });
  }

  onBusquedaChange(term: string): void {
    this.busqueda$.next(term);
  }

  onPageChange(event: any): void {
    this.pagina = event.page;
    this.cargar();
  }

  confirmarDesactivar(usuario: Usuario): void {
    this.confirmService.confirm({
      message: `¿Desea desactivar al usuario <strong>${usuario.nombreCompleto}</strong>?`,
      header: 'Confirmar desactivación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => this.desactivar(usuario)
    });
  }

  desactivar(usuario: Usuario): void {
    this.usuarioService.desactivar(usuario.id).subscribe({
      next: () => {
        this.toast.add({ severity: 'warn', summary: 'Desactivado', detail: `${usuario.nombreCompleto} fue desactivado` });
        this.cargar();
      },
      error: () => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo desactivar el usuario' })
    });
  }

  activar(usuario: Usuario): void {
    this.usuarioService.activar(usuario.id).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Activado', detail: `${usuario.nombreCompleto} fue activado` });
        this.cargar();
      },
      error: () => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo activar el usuario' })
    });
  }

  getInitials(u: Usuario): string {
    return u.nombreCompleto.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  getAvatarColor(rol: string): string {
    const colors: Record<string, string> = {
      'ROLE_SUPERADMINISTRADOR': '#ef4444',
      'ROLE_ADMINISTRADOR':      '#f59e0b',
      'ROLE_MEDICO_ESPECIALISTA':'#2d7dd2',
      'ROLE_PACIENTE':           '#0fb8ad'
    };
    return colors[rol] ?? '#64748b';
  }

  getRolLabel(rol: string): string {
    const labels: Record<string, string> = {
      'ROLE_SUPERADMINISTRADOR': 'Superadmin',
      'ROLE_ADMINISTRADOR':      'Administrador',
      'ROLE_MEDICO_ESPECIALISTA':'Médico',
      'ROLE_PACIENTE':           'Paciente'
    };
    return labels[rol] ?? rol;
  }

  getRolSeverity(rol: string): 'danger' | 'warning' | 'info' | 'success' {
    if (rol.includes('SUPERADMINISTRADOR')) return 'danger';
    if (rol.includes('ADMINISTRADOR'))      return 'warning';
    if (rol.includes('MEDICO'))             return 'info';
    return 'success';
  }
}
