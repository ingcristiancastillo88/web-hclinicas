import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { RouterLink }      from '@angular/router';
import { FormsModule }     from '@angular/forms';
import { TableModule }     from 'primeng/table';
import { ButtonModule }    from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule }  from 'primeng/dropdown';
import { CalendarModule }  from 'primeng/calendar';
import { TagModule }       from 'primeng/tag';
import { ToastModule }     from 'primeng/toast';
import { TooltipModule }   from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule }    from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { CitaMedicaService } from '../../../core/services/cita-medica.service';
import { CitaResumen, EstadoCita } from '../../../core/models/cita.models';

@Component({
  selector: 'app-cita-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    TableModule, ButtonModule, InputTextModule,
    DropdownModule, CalendarModule, TagModule,
    ToastModule, TooltipModule, ConfirmDialogModule,
    DialogModule, InputTextareaModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <!-- Header -->
    <div class="page-header">
      <div class="page-title">
        <div class="page-icon"><i class="pi pi-calendar"></i></div>
        <div>
          <h2>Gestión de Citas Médicas</h2>
          <p>Agendamiento y seguimiento de citas del consultorio</p>
        </div>
      </div>
      <div class="header-actions">
        <a routerLink="/citas/calendario">
          <p-button label="Ver Calendario" icon="pi pi-calendar-times"
                    [outlined]="true" severity="secondary" />
        </a>
        <a routerLink="/citas/nueva">
          <p-button label="Nueva Cita" icon="pi pi-plus"
                    styleClass="btn-primary" />
        </a>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filtros-card">
      <div class="filtros-grid">

        <div class="filter-field">
          <label>Buscar paciente</label>
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search"></i>
            <input pInputText type="text"
                   placeholder="Nombre o cédula..."
                   [(ngModel)]="busqueda"
                   (ngModelChange)="onBusqueda($event)"
                   class="w-full" />
          </span>
        </div>

        <div class="filter-field">
          <label>Estado</label>
          <p-dropdown [(ngModel)]="filtroEstado"
                      [options]="opEstados"
                      optionLabel="label" optionValue="value"
                      placeholder="Todos" styleClass="w-full"
                      [showClear]="true"
                      (onChange)="aplicarFiltros()" />
        </div>

        <div class="filter-field">
          <label>Fecha</label>
          <p-calendar [(ngModel)]="filtroFecha"
                      dateFormat="yy-mm-dd"
                      placeholder="Seleccionar fecha"
                      styleClass="w-full"
                      [showIcon]="true"
                      [showClear]="true"
                      (onSelect)="aplicarFiltros()"
                      (onClear)="limpiarFecha()" />
        </div>

        <div class="filter-actions">
          <p-button label="Limpiar" icon="pi pi-filter-slash"
                    [outlined]="true" severity="secondary"
                    (onClick)="limpiarFiltros()" />
        </div>

      </div>

      <!-- Stats rápidas -->
      <div class="stats-row">
        @for (s of statsEstados; track s.label) {
          <div class="stat-item" [class]="'stat-'+s.key">
            <span class="stat-n">{{ s.count }}</span>
            <span class="stat-l">{{ s.label }}</span>
          </div>
        }
      </div>
    </div>

    <!-- Tabla -->
    <div class="table-container">
      <p-table
        [value]="citas()"
        [loading]="cargando()"
        [lazy]="true"
        [paginator]="true"
        [rows]="tamano"
        [totalRecords]="totalElementos()"
        [rowsPerPageOptions]="[10,25,50]"
        (onPage)="onPage($event)"
        styleClass="p-datatable-gridlines"
        [tableStyle]="{'min-width':'62rem'}"
        [rowHover]="true"
      >
        <ng-template pTemplate="header">
          <tr>
            <th>Fecha y Hora</th>
            <th>Paciente</th>
            <th>Tipo</th>
            <th>Motivo</th>
            <th>Estado</th>
            <th style="width:160px; text-align:center">Acciones</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-cita>
          <tr [class.row-cancelada]="cita.estado==='CANCELADA'"
              [class.row-atendida]="cita.estado==='ATENDIDA'">

            <!-- Fecha y hora -->
            <td>
              <div class="fecha-cell">
                <span class="fc-fecha">
                  {{ cita.fechaCita | date:'dd/MM/yyyy' }}
                </span>
                <span class="fc-hora">
                  <i class="pi pi-clock"></i>
                  {{ cita.horaInicio }} — {{ cita.horaFin }}
                </span>
                <span class="fc-dur">{{ cita.duracionMinutos }} min</span>
              </div>
            </td>

            <!-- Paciente -->
            <td>
              <div class="pac-cell">
                <span class="pac-nombre">{{ cita.pacienteNombreCompleto }}</span>
                <span class="pac-cedula">{{ cita.pacienteCedula }}</span>
                @if (cita.pacienteCelular) {
                  <span class="pac-tel">
                    <i class="pi pi-phone"></i> {{ cita.pacienteCelular }}
                  </span>
                }
              </div>
            </td>

            <!-- Tipo -->
            <td>
              <span class="tipo-badge" [class]="'tipo-'+cita.tipoCita.toLowerCase()">
                <i [class]="'pi ' + getTipoIcon(cita.tipoCita)"></i>
                {{ getTipoLabel(cita.tipoCita) }}
              </span>
            </td>

            <!-- Motivo -->
            <td>
              <span class="motivo-txt"
                    [pTooltip]="cita.motivoCita ?? ''"
                    tooltipPosition="top">
                {{ cita.motivoCita
                   ? (cita.motivoCita | slice:0:45) + (cita.motivoCita.length > 45 ? '...' : '')
                   : '—' }}
              </span>
            </td>

            <!-- Estado -->
            <td>
              <p-tag
                [value]="getEstadoLabel(cita.estado)"
                [severity]="getEstadoSeverity(cita.estado)"
              />
            </td>

            <!-- Acciones -->
            <td>
              <div class="actions">
                <a [routerLink]="['/citas', cita.id]">
                  <p-button icon="pi pi-eye" [rounded]="true" [text]="true"
                            severity="secondary"
                            pTooltip="Ver detalle" tooltipPosition="top" />
                </a>

                @if (cita.estado === 'PROGRAMADA' || cita.estado === 'CONFIRMADA') {
                  <a [routerLink]="['/citas', cita.id, 'editar']">
                    <p-button icon="pi pi-pencil" [rounded]="true" [text]="true"
                              severity="info"
                              pTooltip="Editar" tooltipPosition="top" />
                  </a>
                  <p-button icon="pi pi-check" [rounded]="true" [text]="true"
                            severity="success"
                            pTooltip="Marcar atendida" tooltipPosition="top"
                            (onClick)="confirmarAtendida(cita)" />
                  <p-button icon="pi pi-times" [rounded]="true" [text]="true"
                            severity="warning"
                            pTooltip="No asistió" tooltipPosition="top"
                            (onClick)="confirmarNoAsistio(cita)" />
                  <p-button icon="pi pi-ban" [rounded]="true" [text]="true"
                            severity="danger"
                            pTooltip="Cancelar" tooltipPosition="top"
                            (onClick)="abrirCancelar(cita)" />
                }
              </div>
            </td>

          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="6">
            <div class="empty">
              <i class="pi pi-calendar"></i>
              <p>No se encontraron citas</p>
              <small>Ajusta los filtros o registra una nueva cita</small>
            </div>
          </td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Diálogo cancelar -->
    <p-dialog [(visible)]="dialogCancelar"
              header="Cancelar Cita"
              [modal]="true" [style]="{width:'480px'}"
              [draggable]="false">
      <div class="dialog-body">
        @if (citaACancelar()) {
          <p class="dialog-info">
            <i class="pi pi-exclamation-triangle"></i>
            Cancelar la cita de
            <strong>{{ citaACancelar()!.pacienteNombreCompleto }}</strong>
            del <strong>{{ citaACancelar()!.fechaCita | date:'dd/MM/yyyy' }}</strong>
            a las <strong>{{ citaACancelar()!.horaInicio }}</strong>
          </p>
        }
        <div class="field">
          <label>Motivo de cancelación <span class="req">*</span></label>
          <textarea pInputTextarea [(ngModel)]="motivoCancelacion"
                    rows="3" class="w-full"
                    placeholder="Ingresa el motivo de la cancelación...">
          </textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="Cancelar" icon="pi pi-times"
                  [text]="true" severity="secondary"
                  (onClick)="cerrarCancelar()" />
        <p-button label="Confirmar cancelación" icon="pi pi-ban"
                  severity="danger"
                  [loading]="procesando()"
                  [disabled]="!motivoCancelacion.trim()"
                  (onClick)="ejecutarCancelar()" />
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    /* Header */
    .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem; }
    .page-title  { display:flex; align-items:center; gap:1rem; }
    .page-icon   { width:52px; height:52px; background:linear-gradient(135deg,#6366f1,#8b5cf6); border-radius:14px; display:flex; align-items:center; justify-content:center; }
    .page-icon .pi { font-size:1.4rem; color:white; }
    .page-title h2 { margin:0 0 2px; font-size:1.4rem; font-weight:700; color:#0a2342; }
    .page-title p  { margin:0; color:#64748b; font-size:.85rem; }
    .header-actions { display:flex; gap:8px; flex-wrap:wrap; }

    /* Filtros */
    .filtros-card { background:white; border-radius:16px; padding:1.5rem; margin-bottom:1.2rem; box-shadow:0 2px 12px rgba(0,0,0,.07); }
    .filtros-grid { display:grid; grid-template-columns:1fr 1fr 1fr auto; gap:1rem; align-items:end; margin-bottom:1rem; }
    @media (max-width:900px) { .filtros-grid { grid-template-columns:1fr 1fr; } }
    @media (max-width:600px) { .filtros-grid { grid-template-columns:1fr; } }
    .filter-field { display:flex; flex-direction:column; gap:5px; }
    .filter-field label { font-size:.82rem; font-weight:600; color:#334155; }
    .filter-actions { display:flex; align-items:flex-end; }

    /* Stats */
    .stats-row { display:flex; gap:1rem; flex-wrap:wrap; padding-top:1rem; border-top:1px solid #f1f5f9; }
    .stat-item { display:flex; flex-direction:column; align-items:center; padding:8px 16px; border-radius:10px; background:#f8fafc; border:1px solid #e2e8f0; min-width:80px; }
    .stat-n    { font-size:1.4rem; font-weight:800; color:#0a2342; line-height:1; }
    .stat-l    { font-size:.72rem; color:#64748b; margin-top:2px; }
    .stat-programada .stat-n { color:#6366f1; }
    .stat-atendida   .stat-n { color:#16a34a; }
    .stat-cancelada  .stat-n { color:#dc2626; }
    .stat-noasistio  .stat-n { color:#d97706; }

    /* Table */
    .table-container { background:white; border-radius:16px; box-shadow:0 2px 12px rgba(0,0,0,.06); overflow:hidden; }
    .row-cancelada { opacity:.7; }
    .row-atendida  { background:#f0fdf4 !important; }

    /* Cells */
    .fecha-cell { display:flex; flex-direction:column; gap:2px; }
    .fc-fecha { font-weight:700; color:#0a2342; font-size:.9rem; }
    .fc-hora  { font-size:.78rem; color:#6366f1; display:flex; align-items:center; gap:4px; }
    .fc-hora .pi { font-size:.7rem; }
    .fc-dur   { font-size:.72rem; color:#94a3b8; }

    .pac-cell   { display:flex; flex-direction:column; gap:1px; }
    .pac-nombre { font-weight:600; color:#0a2342; font-size:.9rem; }
    .pac-cedula { font-size:.75rem; color:#94a3b8; font-family:monospace; }
    .pac-tel    { font-size:.75rem; color:#64748b; display:flex; align-items:center; gap:3px; }
    .pac-tel .pi { font-size:.68rem; }

    /* Tipo badge */
    .tipo-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:20px; font-size:.75rem; font-weight:700; }
    .tipo-primera_vez { background:#eff6ff; color:#1d4ed8; }
    .tipo-control     { background:#f0fdf4; color:#166534; }
    .tipo-urgencia    { background:#fef2f2; color:#991b1b; }
    .tipo-prenatal    { background:#fdf2f8; color:#9d174d; }
    .tipo-postparto   { background:#fdf4ff; color:#7e22ce; }
    .tipo-resultado   { background:#fffbeb; color:#92400e; }
    .tipo-otro        { background:#f8fafc; color:#475569; }

    .motivo-txt { font-size:.85rem; color:#475569; }

    .actions { display:flex; align-items:center; justify-content:center; gap:2px; }

    /* Empty */
    .empty { display:flex; flex-direction:column; align-items:center; padding:2.5rem; color:#94a3b8; }
    .empty .pi { font-size:2.5rem; margin-bottom:1rem; }
    .empty p   { margin:0 0 4px; font-weight:600; color:#64748b; }
    .empty small { font-size:.83rem; }

    /* Dialog */
    .dialog-body { padding:.5rem 0; }
    .dialog-info { display:flex; align-items:flex-start; gap:8px; background:#fffbeb; border:1px solid #fcd34d; border-radius:10px; padding:10px 14px; font-size:.88rem; color:#78350f; margin-bottom:1.2rem; }
    .dialog-info .pi { color:#f59e0b; margin-top:1px; flex-shrink:0; }
    .field { display:flex; flex-direction:column; gap:5px; }
    .field label { font-size:.83rem; font-weight:600; color:#334155; }
    .req { color:#ef4444; }
    :deep(textarea.p-inputtextarea) { border-radius:10px !important; resize:vertical; }
  `]
})
export class CitaListComponent implements OnInit, OnDestroy {

  private citaService = inject(CitaMedicaService);
  private toast       = inject(MessageService);
  private confirm     = inject(ConfirmationService);
  private destroy$    = new Subject<void>();
  private busqueda$   = new Subject<string>();

  citas          = signal<CitaResumen[]>([]);
  cargando       = signal(false);
  procesando     = signal(false);
  totalElementos = signal(0);
  busqueda       = '';
  filtroEstado   : EstadoCita | null = null;
  filtroFecha    : Date | null = null;
  pagina         = 0;
  tamano         = 10;

  // Dialog cancelar
  dialogCancelar   = false;
  citaACancelar    = signal<CitaResumen | null>(null);
  motivoCancelacion = '';

  statsEstados = [
    { key:'programada', label:'Programadas', count:0 },
    { key:'atendida',   label:'Atendidas',   count:0 },
    { key:'cancelada',  label:'Canceladas',  count:0 },
    { key:'noasistio',  label:'No asistió',  count:0 },
  ];

  opEstados = [
    { label:'Programada', value:'PROGRAMADA' },
    { label:'Confirmada', value:'CONFIRMADA' },
    { label:'Atendida',   value:'ATENDIDA'   },
    { label:'Cancelada',  value:'CANCELADA'  },
    { label:'No asistió', value:'NO_ASISTIO' },
  ];

  ngOnInit(): void {
    this.busqueda$.pipe(
      debounceTime(350), distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(t => { this.busqueda = t; this.pagina = 0; this.cargar(); });
    this.cargar();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  cargar(): void {
    this.cargando.set(true);
    const fecha = this.filtroFecha
      ? this.filtroFecha.toISOString().split('T')[0]
      : undefined;

    this.citaService.listar(
      this.filtroEstado ?? undefined,
      fecha,
      this.busqueda,
      this.pagina,
      this.tamano
    ).subscribe({
      next: r => {
        this.citas.set(r.data?.contenido ?? []);
        this.totalElementos.set(r.data?.totalElementos ?? 0);
        this.actualizarStats(r.data?.contenido ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.add({ severity:'error', summary:'Error', detail:'No se pudieron cargar las citas' });
        this.cargando.set(false);
      }
    });
  }

  onBusqueda(t: string): void { this.busqueda$.next(t); }

  aplicarFiltros(): void { this.pagina = 0; this.cargar(); }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroEstado = null;
    this.filtroFecha  = null;
    this.pagina = 0;
    this.cargar();
  }

  limpiarFecha(): void { this.filtroFecha = null; this.aplicarFiltros(); }

  onPage(e: any): void { this.pagina = e.page; this.cargar(); }

  actualizarStats(citas: CitaResumen[]): void {
    this.statsEstados[0].count = citas.filter(c => c.estado === 'PROGRAMADA' || c.estado === 'CONFIRMADA').length;
    this.statsEstados[1].count = citas.filter(c => c.estado === 'ATENDIDA').length;
    this.statsEstados[2].count = citas.filter(c => c.estado === 'CANCELADA').length;
    this.statsEstados[3].count = citas.filter(c => c.estado === 'NO_ASISTIO').length;
  }

  // ── Acciones de estado ────────────────────────────────────────────────────
  confirmarAtendida(cita: CitaResumen): void {
    this.confirm.confirm({
      message: `¿Marcar como <strong>ATENDIDA</strong> la cita de ${cita.pacienteNombreCompleto}?`,
      header: 'Confirmar',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, marcar atendida',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        this.citaService.marcarAtendida(cita.id).subscribe({
          next: () => { this.toast.add({ severity:'success', summary:'Actualizado', detail:'Cita marcada como atendida' }); this.cargar(); },
          error: () => this.toast.add({ severity:'error', summary:'Error', detail:'No se pudo actualizar' })
        });
      }
    });
  }

  confirmarNoAsistio(cita: CitaResumen): void {
    this.confirm.confirm({
      message: `¿Marcar que <strong>${cita.pacienteNombreCompleto}</strong> no asistió?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, no asistió',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.citaService.marcarNoAsistio(cita.id).subscribe({
          next: () => { this.toast.add({ severity:'warn', summary:'Actualizado', detail:'Cita marcada como no asistió' }); this.cargar(); },
          error: () => this.toast.add({ severity:'error', summary:'Error', detail:'No se pudo actualizar' })
        });
      }
    });
  }

  abrirCancelar(cita: CitaResumen): void {
    this.citaACancelar.set(cita);
    this.motivoCancelacion = '';
    this.dialogCancelar = true;
  }

  cerrarCancelar(): void { this.dialogCancelar = false; this.citaACancelar.set(null); }

  ejecutarCancelar(): void {
    const cita = this.citaACancelar();
    if (!cita || !this.motivoCancelacion.trim()) return;
    this.procesando.set(true);
    this.citaService.cancelar(cita.id, { motivoCancelacion: this.motivoCancelacion }).subscribe({
      next: () => {
        this.toast.add({ severity:'warn', summary:'Cancelada', detail:'Cita cancelada exitosamente' });
        this.cerrarCancelar();
        this.cargar();
        this.procesando.set(false);
      },
      error: err => {
        this.toast.add({ severity:'error', summary:'Error', detail: err.error?.mensaje ?? 'No se pudo cancelar' });
        this.procesando.set(false);
      }
    });
  }

  // ── Helpers visuales ──────────────────────────────────────────────────────
  getEstadoLabel(e: EstadoCita): string {
    const m: Record<string,string> = {
      PROGRAMADA:'Programada', CONFIRMADA:'Confirmada',
      ATENDIDA:'Atendida', CANCELADA:'Cancelada', NO_ASISTIO:'No asistió'
    };
    return m[e] ?? e;
  }

  getEstadoSeverity(e: EstadoCita): 'info'|'success'|'warning'|'danger'|'secondary' {
    const m: Record<string,'info'|'success'|'warning'|'danger'|'secondary'> = {
      PROGRAMADA:'info', CONFIRMADA:'info',
      ATENDIDA:'success', CANCELADA:'danger', NO_ASISTIO:'warning'
    };
    return m[e] ?? 'secondary';
  }

  getTipoLabel(t: string): string {
    const m: Record<string,string> = {
      PRIMERA_VEZ:'Primera vez', CONTROL:'Control',
      URGENCIA:'Urgencia', PRENATAL:'Prenatal',
      POSTPARTO:'Postparto', RESULTADO:'Resultado', OTRO:'Otro'
    };
    return m[t] ?? t;
  }

  getTipoIcon(t: string): string {
    const m: Record<string,string> = {
      PRIMERA_VEZ:'pi-star', CONTROL:'pi-refresh',
      URGENCIA:'pi-exclamation-triangle', PRENATAL:'pi-heart-fill',
      POSTPARTO:'pi-heart', RESULTADO:'pi-file', OTRO:'pi-calendar'
    };
    return m[t] ?? 'pi-calendar';
  }
}