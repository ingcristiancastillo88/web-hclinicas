import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterLink }     from '@angular/router';
import { FormsModule }    from '@angular/forms';
import { TableModule }    from 'primeng/table';
import { ButtonModule }   from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule }      from 'primeng/tag';
import { ToastModule }    from 'primeng/toast';
import { TooltipModule }  from 'primeng/tooltip';
import { AvatarModule }   from 'primeng/avatar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToggleButtonModule }  from 'primeng/togglebutton';
import { ChipModule }     from 'primeng/chip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { PacienteService } from '../../../core/services/paciente.service';
import { PacienteResumen } from '../../../core/models';

@Component({
  selector: 'app-paciente-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    TableModule, ButtonModule, InputTextModule,
    TagModule, ToastModule, TooltipModule,
    AvatarModule, ConfirmDialogModule,
    ToggleButtonModule, ChipModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <!-- Header -->
    <div class="page-header">
      <div class="page-title">
        <div class="page-icon"><i class="pi pi-id-card"></i></div>
        <div>
          <h2>Gestión de Pacientes</h2>
          <p>Registro y administración de pacientes del consultorio</p>
        </div>
      </div>
      <a routerLink="/pacientes/nuevo">
        <p-button label="Nuevo Paciente" icon="pi pi-user-plus" styleClass="btn-primary" />
      </a>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <span class="p-input-icon-left search-box">
        <i class="pi pi-search"></i>
        <input
          pInputText
          type="text"
          placeholder="Buscar por nombre, cédula, historia o correo..."
          [(ngModel)]="busqueda"
          (ngModelChange)="onBusquedaChange($event)"
          class="search-input"
        />
      </span>

      <div class="toolbar-right">
        <!-- Toggle activos/todos -->
        <div class="toggle-wrapper">
          <span class="toggle-label">Solo activos</span>
          <p-toggleButton
            [(ngModel)]="soloActivos"
            onLabel="Sí"
            offLabel="No"
            onIcon="pi pi-check"
            offIcon="pi pi-times"
            (onChange)="recargar()"
            styleClass="toggle-sm"
          />
        </div>

        <!-- Contador -->
        <div class="stat-pill">
          <i class="pi pi-users"></i>
          {{ totalElementos() }} pacientes
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div class="table-container">
      <p-table
        [value]="pacientes()"
        [loading]="cargando()"
        [lazy]="true"
        [paginator]="true"
        [rows]="tamano"
        [totalRecords]="totalElementos()"
        [rowsPerPageOptions]="[10, 25, 50]"
        (onPage)="onPageChange($event)"
        styleClass="p-datatable-gridlines"
        [tableStyle]="{'min-width': '68rem'}"
        [rowHover]="true"
      >
        <ng-template pTemplate="header">
          <tr>
            <th style="width:52px"></th>
            <th>Paciente</th>
            <th>Cédula</th>
            <th>Historia</th>
            <th>Edad</th>
            <th>Contacto</th>
            <th>Grupo Sanguíneo</th>
            <th>Estado</th>
            <th style="width:130px; text-align:center">Acciones</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-pac>
          <tr>

            <!-- Avatar -->
            <td>
              <p-avatar
                [label]="getInitials(pac)"
                shape="circle"
                [style]="{ background: '#dbeafe', color: '#1e40af',
                            fontWeight: '700', fontSize: '0.85rem' }"
              />
            </td>

            <!-- Nombre -->
            <td>
              <div class="paciente-cell">
                <span class="pac-nombre">{{ pac.nombreCompleto }}</span>
                <span class="pac-ciudad">
                  <i class="pi pi-map-marker"></i>
                  {{ pac.ciudad ?? '—' }}
                </span>
              </div>
            </td>

            <!-- Cédula -->
            <td><code class="code-pill">{{ pac.cedula }}</code></td>

            <!-- Historia -->
            <td>
              @if (pac.historiaNumero) {
                <code class="code-pill historia">{{ pac.historiaNumero }}</code>
              } @else {
                <span class="text-muted">—</span>
              }
            </td>

            <!-- Edad -->
            <td>
              @if (pac.edad != null) {
                <span class="edad-badge">{{ pac.edad }} años</span>
              } @else {
                <span class="text-muted">—</span>
              }
            </td>

            <!-- Contacto -->
            <td>
              <div class="contacto-cell">
                @if (pac.celular) {
                  <span><i class="pi pi-phone"></i> {{ pac.celular }}</span>
                }
                @if (pac.correo) {
                  <span class="text-xs"><i class="pi pi-envelope"></i> {{ pac.correo }}</span>
                }
              </div>
            </td>

            <!-- Grupo Sanguíneo -->
            <td>
              @if (pac.grupoSanguineo) {
                <span class="sangre-badge">
                  {{ formatGrupoSanguineo(pac.grupoSanguineo) }}
                </span>
              } @else {
                <span class="text-muted">—</span>
              }
            </td>

            <!-- Estado -->
            <td>
              <span class="estado-badge" [class]="'estado-' + pac.estado.toLowerCase()">
                <i [class]="'pi ' + (pac.estado === 'ACTIVO' ? 'pi-check-circle' : 'pi-times-circle')"></i>
                {{ pac.estado }}
              </span>
            </td>

            <!-- Acciones -->
            <td>
              <div class="actions">
                <a [routerLink]="['/pacientes', pac.id]">
                  <p-button icon="pi pi-eye" [rounded]="true" [text]="true"
                            severity="secondary" pTooltip="Ver detalle" tooltipPosition="top" />
                </a>
                <a [routerLink]="['/pacientes/editar', pac.id]">
                  <p-button icon="pi pi-pencil" [rounded]="true" [text]="true"
                            severity="info" pTooltip="Editar" tooltipPosition="top" />
                </a>
                @if (pac.estado === 'ACTIVO') {
                  <p-button icon="pi pi-ban" [rounded]="true" [text]="true"
                            severity="warn" pTooltip="Desactivar" tooltipPosition="top"
                            (onClick)="confirmarDesactivar(pac)" />
                } @else {
                  <p-button icon="pi pi-check" [rounded]="true" [text]="true"
                            severity="success" pTooltip="Activar" tooltipPosition="top"
                            (onClick)="activar(pac)" />
                }
              </div>
            </td>

          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="9">
              <div class="empty-state">
                <i class="pi pi-id-card"></i>
                <p>No se encontraron pacientes</p>
                <small>Intenta ajustar los filtros o registra un nuevo paciente</small>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
    }
    .page-title { display: flex; align-items: center; gap: 1rem; }
    .page-icon {
      width: 52px; height: 52px;
      background: linear-gradient(135deg, #8b5cf6, #6366f1);
      border-radius: 14px; display: flex; align-items: center; justify-content: center;
    }
    .page-icon .pi { font-size: 1.4rem; color: white; }
    .page-title h2 { margin: 0 0 2px; font-size: 1.4rem; font-weight: 700; color: #0a2342; }
    .page-title p  { margin: 0; color: #64748b; font-size: 0.85rem; }

    /* Toolbar */
    .toolbar {
      display: flex; align-items: center; gap: 1rem;
      margin-bottom: 1rem; flex-wrap: wrap;
    }
    .search-box { flex: 1; min-width: 280px; }
    .search-input { width: 100%; border-radius: 10px; padding-left: 2.5rem !important; }
    .toolbar-right {
      display: flex; align-items: center;
      gap: 0.75rem; margin-left: auto; flex-wrap: wrap;
    }
    .toggle-wrapper {
      display: flex; align-items: center;
      gap: 8px; font-size: 0.83rem; color: #475569;
    }
    .toggle-label { font-weight: 600; white-space: nowrap; }
    .stat-pill {
      display: inline-flex; align-items: center; gap: 6px;
      background: white; border: 1px solid #e2e8f0;
      padding: 6px 14px; border-radius: 20px;
      font-size: 0.83rem; font-weight: 600; color: #334155;
    }
    .stat-pill .pi { color: #8b5cf6; }

    /* Table container */
    .table-container {
      background: white; border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06); overflow: hidden;
    }

    /* Cells */
    .paciente-cell { display: flex; flex-direction: column; }
    .pac-nombre { font-weight: 600; color: #0a2342; font-size: 0.9rem; }
    .pac-ciudad { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }
    .pac-ciudad .pi { font-size: 0.7rem; }

    .code-pill {
      background: #f1f5f9; padding: 2px 8px;
      border-radius: 6px; font-size: 0.8rem; font-family: monospace; color: #0a2342;
    }

    .code-pill.historia {
      background: #ede9fe; color: #5b21b6;
    }

    .edad-badge {
      background: #f0fdf4; color: #166534;
      padding: 3px 10px; border-radius: 20px;
      font-size: 0.78rem; font-weight: 600;
    }

    .contacto-cell {
      display: flex; flex-direction: column; gap: 2px;
      font-size: 0.78rem; color: #475569;
    }
    .contacto-cell .pi { font-size: 0.7rem; color: #94a3b8; }
    .text-xs { font-size: 0.72rem; }

    .sangre-badge {
      background: #fee2e2; color: #991b1b;
      padding: 3px 10px; border-radius: 20px;
      font-size: 0.78rem; font-weight: 700;
      font-family: monospace;
    }

    .estado-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 10px; border-radius: 20px;
      font-size: 0.78rem; font-weight: 600;
    }
    .estado-activo   { background: #dcfce7; color: #166534; }
    .estado-inactivo { background: #fef3c7; color: #92400e; }

    .actions { display: flex; align-items: center; justify-content: center; gap: 2px; }
    .text-muted { color: #cbd5e1; font-size: 0.85rem; }

    .empty-state {
      display: flex; flex-direction: column;
      align-items: center; padding: 3rem; color: #94a3b8;
    }
    .empty-state .pi { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state p   { margin: 0; font-weight: 600; color: #64748b; }
    .empty-state small { font-size: 0.83rem; margin-top: 4px; }
  `]
})
export class PacienteListComponent implements OnInit, OnDestroy {

  private pacienteService  = inject(PacienteService);
  private toast            = inject(MessageService);
  private confirmService   = inject(ConfirmationService);
  private destroy$         = new Subject<void>();
  private busqueda$        = new Subject<string>();

  pacientes      = signal<PacienteResumen[]>([]);
  cargando       = signal(false);
  totalElementos = signal(0);
  busqueda       = '';
  soloActivos    = true;
  pagina         = 0;
  tamano         = 10;

  ngOnInit(): void {
    this.busqueda$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.busqueda = term;
      this.pagina   = 0;
      this.cargar();
    });
    this.cargar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargar(): void {
    this.cargando.set(true);
    this.pacienteService.listar(
      this.busqueda, this.pagina, this.tamano, this.soloActivos
    ).subscribe({
      next: res => {
        this.pacientes.set(res.data?.contenido ?? []);
        this.totalElementos.set(res.data?.totalElementos ?? 0);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'Error',
          detail: 'No se pudieron cargar los pacientes' });
        this.cargando.set(false);
      }
    });
  }

  recargar(): void { this.pagina = 0; this.cargar(); }

  onBusquedaChange(term: string): void { this.busqueda$.next(term); }

  onPageChange(event: any): void { this.pagina = event.page; this.cargar(); }

  confirmarDesactivar(pac: PacienteResumen): void {
    this.confirmService.confirm({
      message: `¿Desea desactivar al paciente <strong>${pac.nombreCompleto}</strong>?`,
      header: 'Confirmar desactivación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => this.desactivar(pac)
    });
  }

  desactivar(pac: PacienteResumen): void {
    this.pacienteService.desactivar(pac.id).subscribe({
      next: () => {
        this.toast.add({ severity: 'warn', summary: 'Desactivado',
          detail: `${pac.nombreCompleto} fue desactivado` });
        this.cargar();
      },
      error: () => this.toast.add({ severity: 'error', summary: 'Error',
        detail: 'No se pudo desactivar el paciente' })
    });
  }

  activar(pac: PacienteResumen): void {
    this.pacienteService.activar(pac.id).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Activado',
          detail: `${pac.nombreCompleto} fue activado` });
        this.cargar();
      },
      error: () => this.toast.add({ severity: 'error', summary: 'Error',
        detail: 'No se pudo activar el paciente' })
    });
  }

  getInitials(pac: PacienteResumen): string {
    return pac.nombreCompleto.split(' ').map(n => n[0])
      .slice(0, 2).join('').toUpperCase();
  }

  formatGrupoSanguineo(g: string): string {
    return g.replace('_POSITIVO', '+').replace('_NEGATIVO', '-');
  }
}
