import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import { TableModule }     from 'primeng/table';
import { TagModule }       from 'primeng/tag';
import { ToastModule }     from 'primeng/toast';
import { ButtonModule }    from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule }  from 'primeng/dropdown';
import { TooltipModule }   from 'primeng/tooltip';
import { ChipModule }      from 'primeng/chip';
import { SkeletonModule }  from 'primeng/skeleton';
import { MessageService }  from 'primeng/api';
import { AuditoriaService } from '../../core/services/auditoria.service';
import { Auditoria } from '../../core/models';


@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, TagModule, ToastModule, ButtonModule,
    InputTextModule, DropdownModule, TooltipModule,
    ChipModule, SkeletonModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <!-- Header -->
    <div class="page-header">
      <div class="page-title">
        <div class="page-icon"><i class="pi pi-history"></i></div>
        <div>
          <h2>Auditoría del Sistema</h2>
          <p>Registro completo de acciones realizadas en el sistema</p>
        </div>
      </div>
      <div class="header-stats">
        <div class="stat-pill success">
          <i class="pi pi-check-circle"></i>
          {{ totalExitosos() }} exitosos
        </div>
        <div class="stat-pill danger">
          <i class="pi pi-times-circle"></i>
          {{ totalFallidos() }} fallidos
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-card">
      <div class="filters-grid">

        <!-- Buscar por correo -->
        <div class="filter-field">
          <label>Usuario (correo)</label>
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search"></i>
            <input
              pInputText
              type="text"
              placeholder="usuario@clinica.com"
              [(ngModel)]="filtroCorreo"
              class="w-full"
            />
          </span>
        </div>

        <!-- Módulo -->
        <div class="filter-field">
          <label>Módulo</label>
          <p-dropdown
            [(ngModel)]="filtroModulo"
            [options]="opcionesModulo"
            optionLabel="label"
            optionValue="value"
            placeholder="Todos los módulos"
            styleClass="w-full"
            [showClear]="true"
          />
        </div>

        <!-- Acción -->
        <div class="filter-field">
          <label>Acción</label>
          <p-dropdown
            [(ngModel)]="filtroAccion"
            [options]="opcionesAccion"
            optionLabel="label"
            optionValue="value"
            placeholder="Todas las acciones"
            styleClass="w-full"
            [showClear]="true"
          />
        </div>

        <!-- Botones -->
        <div class="filter-actions">
          <p-button
            label="Buscar"
            icon="pi pi-search"
            (onClick)="aplicarFiltros()"
            styleClass="btn-primary"
          />
          <p-button
            label="Limpiar"
            icon="pi pi-filter-slash"
            [outlined]="true"
            severity="secondary"
            (onClick)="limpiarFiltros()"
          />
        </div>

      </div>

      <!-- Chips de filtros activos -->
      @if (tieneFilstrosActivos()) {
        <div class="active-filters">
          <span class="filters-label">Filtros activos:</span>
          @if (filtroCorreo) {
            <p-chip [label]="'Usuario: ' + filtroCorreo" [removable]="true"
                    (onRemove)="filtroCorreo = ''; aplicarFiltros()" />
          }
          @if (filtroModulo) {
            <p-chip [label]="'Módulo: ' + filtroModulo" [removable]="true"
                    (onRemove)="filtroModulo = ''; aplicarFiltros()" />
          }
          @if (filtroAccion) {
            <p-chip [label]="'Acción: ' + filtroAccion" [removable]="true"
                    (onRemove)="filtroAccion = ''; aplicarFiltros()" />
          }
        </div>
      }
    </div>

    <!-- Tabla -->
    <div class="table-container">
      <p-table
        [value]="registros()"
        [loading]="cargando()"
        [lazy]="true"
        [paginator]="true"
        [rows]="tamano"
        [totalRecords]="totalElementos()"
        (onPage)="onPageChange($event)"
        styleClass="p-datatable-gridlines p-datatable-sm auditoria-table"
        [tableStyle]="{'min-width': '70rem'}"
        [rowHover]="true"
        [scrollable]="true"
      >
        <ng-template pTemplate="header">
          <tr>
            <th style="width: 50px"></th>
            <th>Fecha y Hora</th>
            <th>Usuario</th>
            <th>Módulo</th>
            <th>Acción</th>
            <th>Descripción</th>
            <th>IP Origen</th>
            <th style="width: 90px; text-align: center">Estado</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-reg let-i="rowIndex">
          <tr [class.row-error]="!reg.exitoso">

            <!-- Índice -->
            <td class="text-center">
              <span class="row-index">{{ i + 1 }}</span>
            </td>

            <!-- Fecha -->
            <td>
              <div class="fecha-cell">
                <span class="fecha-date">{{ reg.fechaAccion | date:'dd/MM/yyyy' }}</span>
                <span class="fecha-time">{{ reg.fechaAccion | date:'HH:mm:ss' }}</span>
              </div>
            </td>

            <!-- Usuario -->
            <td>
              <div class="user-cell">
                <span class="user-name">{{ reg.nombreUsuario }}</span>
                <span class="user-correo">{{ reg.usuarioCorreo }}</span>
              </div>
            </td>

            <!-- Módulo -->
            <td>
              <span class="modulo-badge" [class]="'mod-' + reg.modulo.toLowerCase()">
                <i [class]="'pi ' + getModuloIcon(reg.modulo)"></i>
                {{ reg.modulo }}
              </span>
            </td>

            <!-- Acción -->
            <td>
              <p-tag
                [value]="reg.accion"
                [severity]="getAccionSeverity(reg.accion)"
              />
            </td>

            <!-- Descripción -->
            <td>
              <span class="descripcion-text"
                    [pTooltip]="reg.descripcion"
                    tooltipPosition="top">
                {{ reg.descripcion | slice:0:60 }}{{ reg.descripcion?.length > 60 ? '...' : '' }}
              </span>
              @if (!reg.exitoso && reg.detalleError) {
                <div class="error-detail">
                  <i class="pi pi-exclamation-triangle"></i>
                  {{ reg.detalleError | slice:0:50 }}
                </div>
              }
            </td>

            <!-- IP -->
            <td>
              <code class="ip-code">{{ reg.ipOrigen }}</code>
            </td>

            <!-- Estado -->
            <td class="text-center">
              @if (reg.exitoso) {
                <span class="estado-ok" pTooltip="Exitoso">
                  <i class="pi pi-check-circle"></i>
                </span>
              } @else {
                <span class="estado-err" pTooltip="Fallido">
                  <i class="pi pi-times-circle"></i>
                </span>
              }
            </td>

          </tr>
        </ng-template>

        <!-- Skeleton mientras carga -->
        <ng-template pTemplate="loadingbody">
          @for (i of [1,2,3,4,5,6,7,8]; track i) {
            <tr>
              @for (j of [1,2,3,4,5,6,7,8]; track j) {
                <td><p-skeleton height="1.2rem" /></td>
              }
            </tr>
          }
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="8">
              <div class="empty-state">
                <i class="pi pi-history"></i>
                <p>No se encontraron registros de auditoría</p>
                <small>Intenta ajustar los filtros de búsqueda</small>
              </div>
            </td>
          </tr>
        </ng-template>

      </p-table>
    </div>
  `,
  styles: [`
    /* ── Header ─────────────────────────────────────────────────────── */
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
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
    }

    .page-icon .pi { font-size: 1.4rem; color: white; }

    .page-title h2 {
      margin: 0 0 2px;
      font-size: 1.4rem;
      font-weight: 700;
      color: #0a2342;
    }

    .page-title p { margin: 0; color: #64748b; font-size: 0.85rem; }

    .header-stats {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .stat-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.83rem;
      font-weight: 700;
    }

    .stat-pill.success { background: #dcfce7; color: #166534; }
    .stat-pill.danger  { background: #fee2e2; color: #991b1b; }

    /* ── Filtros ─────────────────────────────────────────────────────── */
    .filters-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.2rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr auto;
      gap: 1rem;
      align-items: end;
    }

    @media (max-width: 900px) {
      .filters-grid { grid-template-columns: 1fr 1fr; }
    }

    @media (max-width: 600px) {
      .filters-grid { grid-template-columns: 1fr; }
    }

    .filter-field { display: flex; flex-direction: column; gap: 6px; }

    .filter-field label {
      font-size: 0.82rem;
      font-weight: 600;
      color: #334155;
    }

    .filter-actions {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      padding-bottom: 1px;
    }

    .active-filters {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 1rem;
      flex-wrap: wrap;
    }

    .filters-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
    }

    /* ── Tabla ───────────────────────────────────────────────────────── */
    .table-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    .row-error td { background: #fff8f8 !important; }

    .row-index {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: #f1f5f9;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
    }

    /* Fecha */
    .fecha-cell { display: flex; flex-direction: column; }
    .fecha-date { font-size: 0.85rem; font-weight: 600; color: #0a2342; }
    .fecha-time { font-size: 0.75rem; color: #94a3b8; font-family: monospace; }

    /* Usuario */
    .user-cell { display: flex; flex-direction: column; }
    .user-name  { font-size: 0.85rem; font-weight: 600; color: #334155; }
    .user-correo { font-size: 0.75rem; color: #94a3b8; }

    /* Módulo badge */
    .modulo-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #334155;
      white-space: nowrap;
    }

    .mod-autenticacion { background: #ede9fe; color: #5b21b6; }
    .mod-usuarios      { background: #dbeafe; color: #1e40af; }
    .mod-pacientes     { background: #d1fae5; color: #065f46; }
    .mod-historias_clinicas { background: #fef3c7; color: #92400e; }
    .mod-citas         { background: #fce7f3; color: #9d174d; }

    /* Descripción */
    .descripcion-text {
      font-size: 0.83rem;
      color: #475569;
      cursor: default;
    }

    .error-detail {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: #ef4444;
      margin-top: 3px;
    }

    /* IP */
    .ip-code {
      font-family: monospace;
      font-size: 0.78rem;
      background: #f8fafc;
      padding: 2px 6px;
      border-radius: 4px;
      color: #64748b;
    }

    /* Estado */
    .estado-ok  { font-size: 1.2rem; color: #16a34a; }
    .estado-err { font-size: 1.2rem; color: #dc2626; }

    /* Empty */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      color: #94a3b8;
    }

    .empty-state .pi { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state p   { margin: 0; font-weight: 600; color: #64748b; }
    .empty-state small { font-size: 0.83rem; margin-top: 4px; }

    .text-center { text-align: center; }
  `]
})
export class AuditoriaComponent implements OnInit {

  private auditoriaService = inject(AuditoriaService);
  private toast = inject(MessageService);

  // ── Estado ────────────────────────────────────────────────────────────────
  registros      = signal<Auditoria[]>([]);
  cargando       = signal(false);
  totalElementos = signal(0);
  pagina         = 0;
  tamano         = 20;

  // ── Filtros ───────────────────────────────────────────────────────────────
  filtroCorreo = '';
  filtroModulo = '';
  filtroAccion = '';

  // ── Stats calculadas ──────────────────────────────────────────────────────
  totalExitosos = computed(() => this.registros().filter(r => r.exitoso).length);
  totalFallidos = computed(() => this.registros().filter(r => !r.exitoso).length);

  tieneFilstrosActivos = computed(() =>
    !!(this.filtroCorreo || this.filtroModulo || this.filtroAccion)
  );

  // ── Opciones de filtro ────────────────────────────────────────────────────
  opcionesModulo = [
    { label: 'Autenticación',      value: 'AUTENTICACION' },
    { label: 'Usuarios',           value: 'USUARIOS' },
    { label: 'Pacientes',          value: 'PACIENTES' },
    { label: 'Historias Clínicas', value: 'HISTORIAS_CLINICAS' },
    { label: 'Citas Médicas',      value: 'CITAS' },
  ];

  opcionesAccion = [
    { label: 'Login',          value: 'LOGIN' },
    { label: 'Login Fallido',  value: 'LOGIN_FALLIDO' },
    { label: 'Login Bloqueado',value: 'LOGIN_BLOQUEADO' },
    { label: 'Crear',          value: 'CREATE' },
    { label: 'Actualizar',     value: 'UPDATE' },
    { label: 'Desactivar',     value: 'DEACTIVATE' },
    { label: 'Activar',        value: 'ACTIVATE' },
  ];

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);

    const filtros = {
      modulo: this.filtroModulo || undefined,
      accion: this.filtroAccion || undefined,
      correo: this.filtroCorreo || undefined,
    };

    this.auditoriaService.listar(filtros, this.pagina, this.tamano).subscribe({
      next: res => {
        this.registros.set(res.data?.contenido ?? []);
        this.totalElementos.set(res.data?.totalElementos ?? 0);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los registros de auditoría'
        });
        this.cargando.set(false);
      }
    });
  }

  aplicarFiltros(): void {
    this.pagina = 0;
    this.cargar();
  }

  limpiarFiltros(): void {
    this.filtroCorreo = '';
    this.filtroModulo = '';
    this.filtroAccion = '';
    this.pagina = 0;
    this.cargar();
  }

  onPageChange(event: any): void {
    this.pagina = event.page;
    this.cargar();
  }

  // ── Helpers visuales ──────────────────────────────────────────────────────
  getModuloIcon(modulo: string): string {
    const icons: Record<string, string> = {
      'AUTENTICACION':      'pi-lock',
      'USUARIOS':           'pi-users',
      'PACIENTES':          'pi-id-card',
      'HISTORIAS_CLINICAS': 'pi-file-edit',
      'CITAS':              'pi-calendar',
    };
    return icons[modulo] ?? 'pi-circle';
  }

  getAccionSeverity(accion: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
      'LOGIN':           'success',
      'CREATE':          'info',
      'UPDATE':          'info',
      'ACTIVATE':        'success',
      'DEACTIVATE':      'warning',
      'LOGIN_FALLIDO':   'danger',
      'LOGIN_BLOQUEADO': 'danger',
      'DELETE':          'danger',
    };
    return map[accion] ?? 'secondary';
  }
}
