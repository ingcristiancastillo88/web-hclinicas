import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { RouterLink }    from '@angular/router';
import { FormsModule }   from '@angular/forms';
import { ButtonModule }  from 'primeng/button';
import { ToastModule }   from 'primeng/toast';
import { TagModule }     from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CalendarModule }from 'primeng/calendar';
import { MessageService} from 'primeng/api';
import { CitaResumen, EstadoCita } from '../../../core/models/cita.models';
import { CitaMedicaService } from '../../../core/services/cita-medica.service';


interface DiaCalendario {
  fecha: Date;
  esHoy: boolean;
  esMesActual: boolean;
  citas: CitaResumen[];
}

@Component({
  selector: 'app-cita-calendario',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    ButtonModule, ToastModule, TagModule,
    TooltipModule, CalendarModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <!-- Header -->
    <div class="page-header">
      <div class="page-title">
        <div class="page-icon"><i class="pi pi-calendar-times"></i></div>
        <div>
          <h2>Calendario de Citas</h2>
          <p>Vista mensual del consultorio</p>
        </div>
      </div>
      <div class="header-actions">
        <a routerLink="/citas">
          <p-button label="Lista de Citas" icon="pi pi-list"
                    [outlined]="true" severity="secondary" />
        </a>
        <a routerLink="/citas/nueva">
          <p-button label="Nueva Cita" icon="pi pi-plus"
                    styleClass="btn-primary" />
        </a>
      </div>
    </div>

    <!-- Navegación del mes -->
    <div class="cal-nav">
      <p-button icon="pi pi-chevron-left" [rounded]="true" [text]="true"
                severity="secondary" (onClick)="mesPrevio()" />
      <h3 class="mes-titulo">
        {{ nombreMes() }} {{ anioActual() }}
      </h3>
      <p-button icon="pi pi-chevron-right" [rounded]="true" [text]="true"
                severity="secondary" (onClick)="mesSiguiente()" />
      <p-button label="Hoy" [outlined]="true" severity="secondary"
                styleClass="btn-hoy" (onClick)="irHoy()" />
    </div>

    <!-- Leyenda -->
    <div class="leyenda">
      @for (l of leyenda; track l.label) {
        <div class="ley-item">
          <span class="ley-dot" [class]="l.clase"></span>
          <span>{{ l.label }}</span>
        </div>
      }
    </div>

    <!-- Calendario -->
    <div class="calendario-card">

      <!-- Días de la semana -->
      <div class="cal-header-row">
        @for (d of diasSemana; track d) {
          <div class="cal-header-cell">{{ d }}</div>
        }
      </div>

      <!-- Grid de días -->
      @if (cargando()) {
        <div class="cal-loading">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Cargando citas...</span>
        </div>
      } @else {
        <div class="cal-grid">
          @for (dia of diasCalendario(); track dia.fecha.toISOString()) {
            <div class="cal-cell"
                 [class.hoy]="dia.esHoy"
                 [class.otro-mes]="!dia.esMesActual"
                 [class.seleccionado]="esDiaSeleccionado(dia)"
                 (click)="seleccionarDia(dia)">

              <span class="num-dia">{{ dia.fecha.getDate() }}</span>

              <!-- Indicadores de citas -->
              <div class="citas-indicadores">
                @for (cita of dia.citas.slice(0,3); track cita.id) {
                  <div class="cita-chip"
                       [class]="'chip-' + cita.estado.toLowerCase()"
                       [pTooltip]="cita.pacienteNombreCompleto + ' · ' + cita.horaInicio"
                       tooltipPosition="top">
                    {{ cita.horaInicio }}
                  </div>
                }
                @if (dia.citas.length > 3) {
                  <div class="cita-mas">+{{ dia.citas.length - 3 }} más</div>
                }
              </div>

            </div>
          }
        </div>
      }
    </div>

    <!-- Panel lateral — detalle del día seleccionado -->
    @if (diaSeleccionado()) {
      <div class="dia-detalle">
        <div class="dia-det-header">
          <h3>
            {{ diaSeleccionado()!.fecha | date:'EEEE d \' MMMM' }}
          </h3>
          <span class="citas-count">
            {{ citasDia().length }} cita(s)
          </span>
        </div>

        @if (cargandoDia()) {
          <div class="dia-loading">
            <i class="pi pi-spin pi-spinner"></i> Cargando...
          </div>
        } @else if (citasDia().length === 0) {
          <div class="dia-empty">
            <i class="pi pi-calendar"></i>
            <p>Sin citas para este día</p>
            <a [routerLink]="['/citas/nueva']">
              <p-button label="Agendar cita" icon="pi pi-plus"
                        styleClass="btn-primary" />
            </a>
          </div>
        } @else {
          <div class="citas-dia-list">
            @for (cita of citasDia(); track cita.id) {
              <a [routerLink]="['/citas', cita.id]" class="cita-dia-card"
                 [class]="'borde-' + cita.estado.toLowerCase()">
                <div class="hora-col">
                  <span class="hora-ini">{{ cita.horaInicio }}</span>
                  <span class="hora-fin">{{ cita.horaFin }}</span>
                </div>
                <div class="cita-dia-info">
                  <span class="cita-pac">{{ cita.pacienteNombreCompleto }}</span>
                  <span class="cita-tipo">
                    {{ getTipoLabel(cita.tipoCita) }}
                  </span>
                  @if (cita.motivoCita) {
                    <span class="cita-motivo">{{ cita.motivoCita | slice:0:50 }}</span>
                  }
                </div>
                <p-tag
                  [value]="getEstadoLabel(cita.estado)"
                  [severity]="getEstadoSev(cita.estado)"
                  styleClass="tag-sm"
                />
              </a>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem; }
    .page-title  { display:flex; align-items:center; gap:1rem; }
    .page-icon   { width:52px; height:52px; background:linear-gradient(135deg,#6366f1,#8b5cf6); border-radius:14px; display:flex; align-items:center; justify-content:center; }
    .page-icon .pi { font-size:1.4rem; color:white; }
    .page-title h2 { margin:0 0 2px; font-size:1.4rem; font-weight:700; color:#0a2342; }
    .page-title p  { margin:0; color:#64748b; font-size:.85rem; }
    .header-actions { display:flex; gap:8px; }

    /* Navegación */
    .cal-nav { display:flex; align-items:center; gap:1rem; margin-bottom:1rem; }
    .mes-titulo { margin:0; font-size:1.2rem; font-weight:700; color:#0a2342; flex:1; text-align:center; text-transform:capitalize; }
    :deep(.btn-hoy) { font-size:.83rem !important; }

    /* Leyenda */
    .leyenda { display:flex; gap:1.2rem; flex-wrap:wrap; margin-bottom:1rem; }
    .ley-item { display:flex; align-items:center; gap:5px; font-size:.78rem; color:#64748b; }
    .ley-dot  { width:10px; height:10px; border-radius:3px; }
    .ley-dot.prog    { background:#6366f1; }
    .ley-dot.atend   { background:#16a34a; }
    .ley-dot.cancel  { background:#dc2626; }
    .ley-dot.noasis  { background:#d97706; }

    /* Calendario */
    .calendario-card { background:white; border-radius:16px; box-shadow:0 2px 12px rgba(0,0,0,.07); overflow:hidden; margin-bottom:1.5rem; }

    .cal-header-row { display:grid; grid-template-columns:repeat(7,1fr); background:#f8fafc; border-bottom:1px solid #e2e8f0; }
    .cal-header-cell { padding:.75rem; text-align:center; font-size:.75rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.5px; }

    .cal-loading { display:flex; align-items:center; justify-content:center; gap:8px; padding:3rem; color:#6366f1; font-size:.9rem; }

    .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); }

    .cal-cell { border:1px solid #f1f5f9; padding:.5rem; min-height:90px; cursor:pointer; transition:background .15s; display:flex; flex-direction:column; gap:4px; }
    .cal-cell:hover { background:#f8fafc; }
    .cal-cell.hoy { background:#eff6ff; border-color:#bfdbfe; }
    .cal-cell.otro-mes { opacity:.4; }
    .cal-cell.seleccionado { background:#eef2ff; border-color:#6366f1; border-width:2px; }

    .num-dia { font-size:.85rem; font-weight:700; color:#334155; line-height:1; }
    .cal-cell.hoy .num-dia { color:#2563eb; }

    .citas-indicadores { display:flex; flex-direction:column; gap:2px; }

    .cita-chip { font-size:.65rem; font-weight:700; padding:1px 5px; border-radius:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer; }
    .chip-programada, .chip-confirmada { background:#e0e7ff; color:#3730a3; }
    .chip-atendida   { background:#dcfce7; color:#166534; }
    .chip-cancelada  { background:#fee2e2; color:#991b1b; }
    .chip-no_asistio { background:#fef3c7; color:#92400e; }

    .cita-mas { font-size:.65rem; color:#94a3b8; font-weight:600; padding-left:2px; }

    /* Panel detalle día */
    .dia-detalle { background:white; border-radius:16px; padding:1.5rem; box-shadow:0 2px 12px rgba(0,0,0,.07); }
    .dia-det-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.2rem; }
    .dia-det-header h3 { margin:0; font-size:1rem; font-weight:700; color:#0a2342; text-transform:capitalize; }
    .citas-count { font-size:.83rem; font-weight:600; background:#eef2ff; color:#3730a3; padding:4px 12px; border-radius:20px; }

    .dia-loading, .dia-empty { display:flex; flex-direction:column; align-items:center; padding:2rem; gap:.75rem; color:#94a3b8; }
    .dia-empty .pi { font-size:2rem; }
    .dia-empty p   { margin:0; font-weight:600; color:#64748b; }

    /* Citas del día */
    .citas-dia-list { display:flex; flex-direction:column; gap:.75rem; }

    .cita-dia-card { display:flex; align-items:center; gap:1rem; padding:.9rem 1rem; border-radius:10px; border-left:4px solid #e2e8f0; background:#f8fafc; text-decoration:none; transition:background .15s, transform .15s; }
    .cita-dia-card:hover { background:#f1f5f9; transform:translateX(2px); }
    .borde-programada, .borde-confirmada { border-left-color:#6366f1; }
    .borde-atendida   { border-left-color:#16a34a; }
    .borde-cancelada  { border-left-color:#dc2626; }
    .borde-no_asistio { border-left-color:#d97706; }

    .hora-col { display:flex; flex-direction:column; align-items:center; gap:1px; min-width:42px; flex-shrink:0; }
    .hora-ini { font-size:.88rem; font-weight:800; color:#0a2342; }
    .hora-fin { font-size:.72rem; color:#94a3b8; }

    .cita-dia-info { display:flex; flex-direction:column; gap:2px; flex:1; min-width:0; }
    .cita-pac    { font-weight:700; color:#0a2342; font-size:.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .cita-tipo   { font-size:.75rem; color:#6366f1; font-weight:600; }
    .cita-motivo { font-size:.78rem; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

    :deep(.tag-sm .p-tag) { font-size:.7rem !important; padding:2px 8px !important; }
  `]
})
export class CitaCalendarioComponent implements OnInit {

  private citaSvc = inject(CitaMedicaService);
  private toast   = inject(MessageService);

  cargando     = signal(false);
  cargandoDia  = signal(false);
  citasMes     = signal<CitaResumen[]>([]);
  citasDia     = signal<CitaResumen[]>([]);
  diaSeleccionado = signal<DiaCalendario | null>(null);

  fechaActual = new Date();
  mesActual   = signal(this.fechaActual.getMonth());
  anioActual  = signal(this.fechaActual.getFullYear());

  diasSemana = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

  leyenda = [
    { clase:'ley-dot prog',   label:'Programada/Confirmada' },
    { clase:'ley-dot atend',  label:'Atendida' },
    { clase:'ley-dot cancel', label:'Cancelada' },
    { clase:'ley-dot noasis', label:'No asistió' },
  ];

  nombreMes = computed(() => {
    const date = new Date(this.anioActual(), this.mesActual(), 1);
    return date.toLocaleDateString('es-EC', { month:'long' });
  });

  diasCalendario = computed(() => {
    const anio = this.anioActual();
    const mes  = this.mesActual();
    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0);

    // Días del mes anterior para completar la primera semana
    const startDow = primerDia.getDay();
    const dias: DiaCalendario[] = [];

    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(anio, mes, -i);
      dias.push(this.crearDia(d, false));
    }

    // Días del mes actual
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      dias.push(this.crearDia(new Date(anio, mes, d), true));
    }

    // Días del mes siguiente para completar la última semana
    const restantes = 42 - dias.length;
    for (let i = 1; i <= restantes; i++) {
      dias.push(this.crearDia(new Date(anio, mes + 1, i), false));
    }

    return dias;
  });

  ngOnInit(): void { this.cargarMes(); }

  cargarMes(): void {
    this.cargando.set(true);
    const inicio = new Date(this.anioActual(), this.mesActual(), 1)
      .toISOString().split('T')[0];
    const fin = new Date(this.anioActual(), this.mesActual() + 1, 0)
      .toISOString().split('T')[0];

    this.citaSvc.calendario(inicio, fin).subscribe({
      next: r => { this.citasMes.set(r.data ?? []); this.cargando.set(false); },
      error: () => {
        this.toast.add({ severity:'error', summary:'Error', detail:'No se pudo cargar el calendario' });
        this.cargando.set(false);
      }
    });
  }

  seleccionarDia(dia: DiaCalendario): void {
    this.diaSeleccionado.set(dia);
    this.cargandoDia.set(true);
    const fechaStr = dia.fecha.toISOString().split('T')[0];
    this.citaSvc.porDia(fechaStr).subscribe({
      next: r => { this.citasDia.set(r.data ?? []); this.cargandoDia.set(false); },
      error: () => this.cargandoDia.set(false)
    });
  }

  esDiaSeleccionado(dia: DiaCalendario): boolean {
    const sel = this.diaSeleccionado();
    if (!sel) return false;
    return dia.fecha.toDateString() === sel.fecha.toDateString();
  }

  mesPrevio(): void {
    if (this.mesActual() === 0) {
      this.mesActual.set(11);
      this.anioActual.update(a => a - 1);
    } else {
      this.mesActual.update(m => m - 1);
    }
    this.diaSeleccionado.set(null);
    this.cargarMes();
  }

  mesSiguiente(): void {
    if (this.mesActual() === 11) {
      this.mesActual.set(0);
      this.anioActual.update(a => a + 1);
    } else {
      this.mesActual.update(m => m + 1);
    }
    this.diaSeleccionado.set(null);
    this.cargarMes();
  }

  irHoy(): void {
    const hoy = new Date();
    this.mesActual.set(hoy.getMonth());
    this.anioActual.set(hoy.getFullYear());
    this.diaSeleccionado.set(null);
    this.cargarMes();
  }

  private crearDia(fecha: Date, esMesActual: boolean): DiaCalendario {
    const hoy = new Date();
    const esHoy = fecha.toDateString() === hoy.toDateString();
    const fechaStr = fecha.toISOString().split('T')[0];
    const citas = this.citasMes().filter(c => c.fechaCita === fechaStr);
    return { fecha, esHoy, esMesActual, citas };
  }

  getEstadoLabel(e: EstadoCita): string {
    const m: Record<string,string> = {
      PROGRAMADA:'Programada', CONFIRMADA:'Confirmada',
      ATENDIDA:'Atendida', CANCELADA:'Cancelada', NO_ASISTIO:'No asistió'
    };
    return m[e] ?? e;
  }

  getEstadoSev(e: EstadoCita): 'info'|'success'|'warning'|'danger'|'secondary' {
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
}