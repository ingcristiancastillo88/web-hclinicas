import {
  Component, inject, OnInit, signal, computed
} from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule }    from 'primeng/button';
import { DialogModule }    from 'primeng/dialog';
import { ToastModule }     from 'primeng/toast';
import { TooltipModule }   from 'primeng/tooltip';
import { TagModule }       from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DropdownModule }  from 'primeng/dropdown';
import { CalendarModule }  from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { CitaResumen, EstadoCita } from '../../../core/models/cita.models';
import { CitaMedicaService } from '../../../core/services/cita-medica.service';
import { PacienteService } from '../../../core/services/paciente.service';
import { PacienteResumen } from '../../../core/models';

interface DiaCalendario {
  fecha: Date;
  fechaStr: string;       // 'YYYY-MM-DD'
  esHoy: boolean;
  esMesActual: boolean;
  esFinDeSemana: boolean;
  citas: CitaResumen[];
}

@Component({
  selector: 'app-cita-calendario',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    ButtonModule, DialogModule, ToastModule, TooltipModule,
    TagModule, InputTextModule, TextareaModule,
    DropdownModule, CalendarModule, InputNumberModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <!-- ══ HEADER ══════════════════════════════════════════════════════════ -->
    <div class="cal-header">
      <div class="cal-header-left">
        <div class="cal-logo">
          <i class="pi pi-calendar-times"></i>
        </div>
        <div>
          <h2>Agenda del Consultorio</h2>
          <p>{{ nombreMes() }} {{ anioActual() }}</p>
        </div>
      </div>

      <div class="cal-nav-center">
        <p-button icon="pi pi-chevron-left" [rounded]="true" [text]="true"
                  severity="secondary" (onClick)="mesPrevio()" />
        <button class="btn-hoy" (click)="irHoy()">Hoy</button>
        <p-button icon="pi pi-chevron-right" [rounded]="true" [text]="true"
                  severity="secondary" (onClick)="mesSiguiente()" />
      </div>

      <div class="cal-header-right">
        <!-- Leyenda semáforo -->
        <div class="leyenda">
          <div class="ley"><span class="dot dot-hoy"></span>Hoy/Mañana</div>
          <div class="ley"><span class="dot dot-semana"></span>Esta semana</div>
          <div class="ley"><span class="dot dot-futuro"></span>Futuro</div>
          <div class="ley"><span class="dot dot-atendida"></span>Atendida</div>
          <div class="ley"><span class="dot dot-cancelada"></span>Cancelada</div>
          <div class="ley"><span class="dot dot-noasistio"></span>No asistió</div>
        </div>
      </div>
    </div>

    <!-- ══ GRID DÍAS SEMANA ══════════════════════════════════════════════ -->
    <div class="cal-dias-semana">
      @for (d of diasSemana; track d) {
        <div class="dia-sem" [class.finde]="d==='Sáb'||d==='Dom'">{{ d }}</div>
      }
    </div>

    <!-- ══ GRID CALENDARIO ═══════════════════════════════════════════════ -->
    @if (cargando()) {
      <div class="cal-loading">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Cargando agenda...</span>
      </div>
    } @else {
      <div class="cal-grid">
        @for (dia of diasCalendario(); track dia.fechaStr) {
          <div
            class="cal-celda"
            [class.hoy]="dia.esHoy"
            [class.otro-mes]="!dia.esMesActual"
            [class.finde]="dia.esFinDeSemana"
            [class.tiene-citas]="dia.citas.length > 0"
            (click)="abrirDia(dia)"
          >
            <!-- Número del día -->
            <div class="num-dia-wrapper">
              <span class="num-dia" [class.hoy-circle]="dia.esHoy">
                {{ dia.fecha.getDate() }}
              </span>
              @if (dia.citas.length > 0) {
                <span class="citas-count">{{ dia.citas.length }}</span>
              }
            </div>

            <!-- Chips de citas (máx 3 visibles) -->
            <div class="citas-chips">
              @for (cita of dia.citas.slice(0, 3); track cita.id) {
                <div
                  class="cita-chip"
                  [class]="getChipClass(cita, dia.fecha)"
                  [pTooltip]="cita.pacienteNombreCompleto + ' · ' + cita.horaInicio"
                  tooltipPosition="top"
                  (click)="$event.stopPropagation(); abrirDetalleCita(cita)"
                >
                  <span class="chip-hora">{{ cita.horaInicio }}</span>
                  <span class="chip-nombre">
                    {{ cita.pacienteNombreCompleto | slice:0:16 }}
                    {{ cita.pacienteNombreCompleto.length > 16 ? '...' : '' }}
                  </span>
                </div>
              }
              @if (dia.citas.length > 3) {
                <div class="chip-mas"
                     (click)="$event.stopPropagation(); abrirDia(dia)">
                  +{{ dia.citas.length - 3 }} más
                </div>
              }
            </div>
          </div>
        }
      </div>
    }

    <!-- ══ POPUP DÍA ════════════════════════════════════════════════════ -->
    <p-dialog
      [(visible)]="dialogDia"
      [header]="tituloDia()"
      [modal]="true"
      [style]="{width: '720px', maxWidth: '95vw'}"
      [draggable]="false"
      [resizable]="false"
      styleClass="dialog-dia"
    >
      <div class="popup-dia">

        <!-- Panel izquierdo: lista de citas del día -->
        <div class="popup-lista">
          <div class="popup-lista-header">
            <span class="popup-lista-titulo">
              <i class="pi pi-calendar"></i>
              {{ citasDia().length === 0 ? 'Sin citas' : citasDia().length + ' cita(s)' }}
            </span>
          </div>

          @if (cargandoDia()) {
            <div class="popup-loading">
              <i class="pi pi-spin pi-spinner"></i>
            </div>
          } @else if (citasDia().length === 0) {
            <div class="popup-empty">
              <i class="pi pi-calendar-plus"></i>
              <p>Sin citas para este día</p>
              <small>Usa el formulario para agendar</small>
            </div>
          } @else {
            <div class="popup-citas-list">
              @for (cita of citasDia(); track cita.id) {
                <div class="popup-cita-item"
                     [class]="'borde-' + getColorKey(cita, diaSeleccionado()?.fecha)"
                     (click)="abrirDetalleCita(cita)">
                  <div class="pci-hora">
                    <span class="pci-h">{{ cita.horaInicio }}</span>
                    <span class="pci-hf">{{ cita.horaFin }}</span>
                  </div>
                  <div class="pci-info">
                    <span class="pci-pac">{{ cita.pacienteNombreCompleto }}</span>
                    <span class="pci-tipo">{{ getTipoLabel(cita.tipoCita) }}</span>
                    @if (cita.motivoCita) {
                      <span class="pci-motivo">{{ cita.motivoCita | slice:0:45 }}</span>
                    }
                  </div>
                  <div class="pci-actions">
                    <p-tag
                      [value]="getEstadoLabel(cita.estado)"
                      [severity]="getEstadoSev(cita.estado)"
                      styleClass="tag-xs"
                    />
                    @if (cita.estado==='PROGRAMADA'||cita.estado==='CONFIRMADA') {
                      <p-button icon="pi pi-check" [rounded]="true" [text]="true"
                                severity="success" pTooltip="Atendida" tooltipPosition="top"
                                (onClick)="$event.stopPropagation(); marcarAtendida(cita)" />
                      <p-button icon="pi pi-times" [rounded]="true" [text]="true"
                                severity="warn" pTooltip="No asistió" tooltipPosition="top"
                                (onClick)="$event.stopPropagation(); marcarNoAsistio(cita)" />
                      <p-button icon="pi pi-ban" [rounded]="true" [text]="true"
                                severity="danger" pTooltip="Cancelar" tooltipPosition="top"
                                (onClick)="$event.stopPropagation(); confirmarCancelar(cita)" />
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Divisor vertical -->
        <div class="popup-divider"></div>

        <!-- Panel derecho: formulario nueva cita -->
        <div class="popup-form">
          <div class="popup-form-header">
            <i class="pi pi-calendar-plus"></i>
            Nueva Cita
          </div>

          <form [formGroup]="formCita" (ngSubmit)="agendarCita()">

            <!-- Búsqueda paciente -->
            <div class="pf-field">
              <label>Paciente <span class="req">*</span></label>
              <div class="pac-search-wrapper">
                <span class="p-input-icon-left w-full">
                  <i class="pi pi-search"></i>
                  <input pInputText type="text"
                         placeholder="Buscar por nombre o cédula..."
                         [(ngModel)]="busquedaPaciente"
                         [ngModelOptions]="{standalone:true}"
                         (ngModelChange)="onBuscaPaciente($event)"
                         class="w-full" />
                </span>
                @if (resultados().length > 0) {
                  <div class="pac-results">
                    @for (p of resultados(); track p.id) {
                      <div class="pac-result-item" (click)="seleccionarPaciente(p)">
                        <span class="pri-nombre">{{ p.nombreCompleto }}</span>
                        <span class="pri-cedula">{{ p.cedula }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
              @if (pacienteSeleccionado()) {
                <div class="pac-sel">
                  <i class="pi pi-user-edit"></i>
                  <span>{{ pacienteSeleccionado()!.nombreCompleto }}</span>
                  <p-button icon="pi pi-times" [rounded]="true" [text]="true"
                            severity="secondary"
                            (onClick)="limpiarPaciente()" />
                </div>
              }
            </div>

            <!-- Hora inicio -->
            <div class="pf-field">
              <label>Hora de Inicio <span class="req">*</span></label>
              <p-calendar formControlName="horaInicio"
                          [timeOnly]="true" hourFormat="24"
                          placeholder="HH:mm"
                          styleClass="w-full"
                          inputStyleClass="w-full"
                          (onSelect)="verificarSlot()" />
              @if (isInvalid('horaInicio')) {
                <small class="err">La hora es obligatoria</small>
              }
            </div>

            <!-- Duración -->
            <div class="pf-field">
              <label>Duración</label>
              <p-dropdown formControlName="duracionMinutos"
                          [options]="opDuracion"
                          optionLabel="label" optionValue="value"
                          styleClass="w-full"
                          (onChange)="verificarSlot()" />
            </div>

            <!-- Tipo de cita -->
            <div class="pf-field">
              <label>Tipo de Cita</label>
              <p-dropdown formControlName="tipoCita"
                          [options]="opTipos"
                          optionLabel="label" optionValue="value"
                          styleClass="w-full" />
            </div>

            <!-- Motivo -->
            <div class="pf-field">
              <label>Motivo</label>
              <textarea pInputTextarea formControlName="motivoCita"
                        rows="2" class="w-full"
                        placeholder="Motivo de la consulta...">
              </textarea>
            </div>

            <!-- Indicador disponibilidad -->
            @if (verificando()) {
              <div class="slot-check verificando">
                <i class="pi pi-spin pi-spinner"></i> Verificando...
              </div>
            } @else if (slotDisponible() !== null) {
              <div class="slot-check" [class.disponible]="slotDisponible()"
                   [class.ocupado]="!slotDisponible()">
                <i [class]="'pi ' + (slotDisponible() ? 'pi-check-circle' : 'pi-times-circle')"></i>
                {{ slotDisponible() ? 'Horario disponible' : mensajeSlot() }}
              </div>
            }

            <p-button
              type="submit"
              label="Agendar Cita"
              icon="pi pi-check"
              styleClass="btn-primary w-full"
              [loading]="guardando()"
              [disabled]="!puedeAgendar()"
            />

          </form>
        </div>

      </div>

      <ng-template pTemplate="footer">
        <p-button label="Cerrar" icon="pi pi-times"
                  [text]="true" severity="secondary"
                  (onClick)="cerrarDia()" />
      </ng-template>
    </p-dialog>

    <!-- ══ POPUP CANCELAR ═══════════════════════════════════════════════ -->
    <p-dialog [(visible)]="dialogCancelar"
              header="Cancelar Cita"
              [modal]="true" [style]="{width:'420px'}"
              [draggable]="false">
      <div class="campo-cancelar">
        <label>Motivo de cancelación <span class="req">*</span></label>
        <textarea pInputTextarea [(ngModel)]="motivoCancelacion"
                  rows="3" class="w-full"
                  placeholder="Indica el motivo...">
        </textarea>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="Volver" [text]="true" severity="secondary"
                  (onClick)="dialogCancelar=false" />
        <p-button label="Confirmar cancelación" icon="pi pi-ban"
                  severity="danger"
                  [loading]="procesando()"
                  [disabled]="!motivoCancelacion.trim()"
                  (onClick)="ejecutarCancelar()" />
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    /* ── HEADER ───────────────────────────────────────────────────────── */
    .cal-header {
      display: flex; align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;
    }
    .cal-header-left { display: flex; align-items: center; gap: 1rem; }
    .cal-logo {
      width: 48px; height: 48px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
    }
    .cal-logo .pi { font-size: 1.4rem; color: white; }
    .cal-header-left h2 { margin: 0 0 2px; font-size: 1.3rem; font-weight: 700; color: #0a2342; }
    .cal-header-left p  { margin: 0; color: #6366f1; font-size: .85rem; font-weight: 600; text-transform: capitalize; }

    .cal-nav-center { display: flex; align-items: center; gap: .5rem; }
    .btn-hoy {
      background: white; border: 1.5px solid #e2e8f0;
      border-radius: 8px; padding: 6px 16px;
      font-size: .83rem; font-weight: 600; color: #334155;
      cursor: pointer; transition: all .15s;
    }
    .btn-hoy:hover { border-color: #6366f1; color: #6366f1; }

    /* Leyenda */
    .leyenda { display: flex; gap: .75rem; flex-wrap: wrap; align-items: center; }
    .ley { display: flex; align-items: center; gap: 5px; font-size: .72rem; color: #64748b; white-space: nowrap; }
    .dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
    .dot-hoy      { background: #dc2626; }
    .dot-semana   { background: #f97316; }
    .dot-futuro   { background: #16a34a; }
    .dot-atendida { background: #6366f1; }
    .dot-cancelada{ background: #94a3b8; }
    .dot-noasistio{ background: #d97706; }

    /* ── DÍAS DE LA SEMANA ─────────────────────────────────────────────── */
    .cal-dias-semana {
      display: grid; grid-template-columns: repeat(7, 1fr);
      background: #0a2342; border-radius: 12px 12px 0 0;
    }
    .dia-sem {
      padding: .6rem; text-align: center;
      font-size: .75rem; font-weight: 700;
      color: rgba(255,255,255,.7); letter-spacing: .5px;
      text-transform: uppercase;
    }
    .dia-sem.finde { color: rgba(255,255,255,.4); }

    /* ── GRID CALENDARIO ──────────────────────────────────────────────── */
    .cal-loading {
      display: flex; align-items: center; justify-content: center;
      gap: 10px; padding: 4rem;
      color: #6366f1; font-size: .95rem;
      background: white; border-radius: 0 0 12px 12px;
    }

    .cal-grid {
      display: grid; grid-template-columns: repeat(7, 1fr);
      background: white;
      border-radius: 0 0 12px 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,.08);
      overflow: hidden;
    }

    .cal-celda {
      min-height: 110px;
      border: 1px solid #f1f5f9;
      padding: .4rem;
      cursor: pointer;
      transition: background .15s;
      display: flex; flex-direction: column; gap: 3px;
      position: relative;
    }
    .cal-celda:hover { background: #f8faff; }
    .cal-celda.hoy   { background: #eef2ff; }
    .cal-celda.hoy:hover { background: #e0e7ff; }
    .cal-celda.otro-mes { background: #fafafa; opacity: .55; }
    .cal-celda.finde  { background: #fcfcfe; }
    .cal-celda.tiene-citas { border-top: 3px solid #6366f1; }
    .cal-celda.hoy.tiene-citas { border-top-color: #dc2626; }

    /* Número del día */
    .num-dia-wrapper { display: flex; align-items: center; justify-content: space-between; }
    .num-dia {
      font-size: .85rem; font-weight: 700; color: #475569;
      padding: 2px 5px; border-radius: 6px;
    }
    .hoy-circle {
      background: #6366f1; color: white;
      width: 26px; height: 26px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: .8rem; padding: 0;
    }
    .citas-count {
      font-size: .68rem; font-weight: 700;
      background: #ede9fe; color: #5b21b6;
      padding: 1px 6px; border-radius: 20px;
    }

    /* Chips de citas */
    .citas-chips { display: flex; flex-direction: column; gap: 2px; }

    .cita-chip {
      display: flex; align-items: center; gap: 4px;
      padding: 2px 5px; border-radius: 5px;
      font-size: .65rem; font-weight: 600;
      cursor: pointer; overflow: hidden;
      white-space: nowrap; text-overflow: ellipsis;
      transition: opacity .15s;
    }
    .cita-chip:hover { opacity: .85; }
    .chip-hora  { flex-shrink: 0; font-weight: 800; }
    .chip-nombre { overflow: hidden; text-overflow: ellipsis; }

    /* Colores semáforo */
    .chip-hoy     { background: #fee2e2; color: #991b1b; border-left: 3px solid #dc2626; }
    .chip-semana  { background: #ffedd5; color: #9a3412; border-left: 3px solid #f97316; }
    .chip-futuro  { background: #dcfce7; color: #166534; border-left: 3px solid #16a34a; }
    .chip-atendida{ background: #e0e7ff; color: #3730a3; border-left: 3px solid #6366f1; }
    .chip-cancelada{ background: #f1f5f9; color: #64748b; border-left: 3px solid #94a3b8; text-decoration: line-through; }
    .chip-noasistio{ background: #fef3c7; color: #92400e; border-left: 3px solid #d97706; }

    .chip-mas {
      font-size: .65rem; color: #6366f1; font-weight: 700;
      padding: 1px 4px; cursor: pointer;
    }

    /* ── POPUP DÍA ─────────────────────────────────────────────────────── */
    :deep(.dialog-dia .p-dialog-header) {
      background: #0a2342; color: white;
      border-radius: 12px 12px 0 0;
    }
    :deep(.dialog-dia .p-dialog-header .p-dialog-title) { font-weight: 700; }
    :deep(.dialog-dia .p-dialog-header-icons .p-dialog-header-close) { color: white; }

    .popup-dia {
      display: flex; gap: 0;
      min-height: 420px; max-height: 70vh;
    }

    /* Panel lista */
    .popup-lista {
      flex: 1; display: flex; flex-direction: column;
      overflow: hidden;
    }
    .popup-lista-header {
      padding: .75rem 1rem;
      background: #f8fafc; border-bottom: 1px solid #e2e8f0;
    }
    .popup-lista-titulo {
      display: flex; align-items: center; gap: 6px;
      font-size: .85rem; font-weight: 700; color: #0a2342;
    }
    .popup-loading {
      display: flex; justify-content: center; padding: 2rem;
      color: #6366f1;
    }
    .popup-empty {
      display: flex; flex-direction: column;
      align-items: center; padding: 2rem;
      color: #94a3b8; text-align: center;
    }
    .popup-empty .pi { font-size: 2rem; margin-bottom: .5rem; }
    .popup-empty p   { margin: 0 0 4px; font-weight: 600; color: #64748b; }
    .popup-empty small { font-size: .78rem; }

    .popup-citas-list { overflow-y: auto; flex: 1; }

    .popup-cita-item {
      display: flex; align-items: center; gap: .75rem;
      padding: .75rem 1rem;
      border-left: 4px solid #e2e8f0;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer; transition: background .15s;
    }
    .popup-cita-item:hover { background: #f8fafc; }

    /* Bordes semáforo para items del popup */
    .borde-hoy      { border-left-color: #dc2626; }
    .borde-semana   { border-left-color: #f97316; }
    .borde-futuro   { border-left-color: #16a34a; }
    .borde-atendida { border-left-color: #6366f1; }
    .borde-cancelada{ border-left-color: #94a3b8; }
    .borde-noasistio{ border-left-color: #d97706; }

    .pci-hora { display: flex; flex-direction: column; align-items: center; min-width: 42px; flex-shrink: 0; }
    .pci-h    { font-size: .88rem; font-weight: 800; color: #0a2342; }
    .pci-hf   { font-size: .7rem; color: #94a3b8; }

    .pci-info { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; }
    .pci-pac  { font-weight: 700; color: #0a2342; font-size: .88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pci-tipo { font-size: .72rem; color: #6366f1; font-weight: 600; }
    .pci-motivo { font-size: .72rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .pci-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }

    /* Divisor vertical */
    .popup-divider { width: 1px; background: #e2e8f0; flex-shrink: 0; }

    /* Panel formulario */
    .popup-form {
      width: 280px; flex-shrink: 0;
      padding: 1rem; overflow-y: auto;
      display: flex; flex-direction: column; gap: .75rem;
    }
    .popup-form-header {
      display: flex; align-items: center; gap: 6px;
      font-size: .9rem; font-weight: 700; color: #0a2342;
      padding-bottom: .5rem;
      border-bottom: 2px solid #6366f1;
    }
    .popup-form-header .pi { color: #6366f1; }

    /* Campos del formulario */
    .pf-field { display: flex; flex-direction: column; gap: 4px; }
    .pf-field label { font-size: .78rem; font-weight: 600; color: #334155; }
    .req { color: #ef4444; }
    .err { color: #ef4444; font-size: .72rem; }

    /* Búsqueda paciente */
    .pac-search-wrapper { position: relative; }
    .pac-results {
      position: absolute; z-index: 999;
      background: white; border: 1px solid #e2e8f0;
      border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.12);
      width: 100%; max-height: 160px; overflow-y: auto; margin-top: 2px;
    }
    .pac-result-item {
      display: flex; justify-content: space-between;
      padding: 8px 12px; cursor: pointer;
      border-bottom: 1px solid #f1f5f9;
      transition: background .12s;
    }
    .pac-result-item:hover { background: #f8fafc; }
    .pri-nombre { font-weight: 600; font-size: .82rem; color: #0a2342; }
    .pri-cedula { font-size: .75rem; color: #94a3b8; font-family: monospace; }

    .pac-sel {
      display: flex; align-items: center; gap: 8px;
      background: #eff6ff; border: 1px solid #bfdbfe;
      border-radius: 8px; padding: 6px 10px; font-size: .82rem;
      font-weight: 600; color: #1e40af;
    }
    .pac-sel .pi { color: #2563eb; }

    /* Verificador slot */
    .slot-check {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 10px; border-radius: 8px;
      font-size: .78rem; font-weight: 600;
    }
    .slot-check.verificando { background: #f8fafc; color: #6366f1; }
    .slot-check.disponible  { background: #f0fdf4; color: #166534; }
    .slot-check.ocupado     { background: #fef2f2; color: #991b1b; }

    :deep(.btn-primary.w-full) { width: 100%; justify-content: center; }
    :deep(textarea.p-inputtextarea) { border-radius: 8px !important; resize: none; }

    /* Cancelar dialog */
    .campo-cancelar { display: flex; flex-direction: column; gap: 6px; }
    .campo-cancelar label { font-size: .83rem; font-weight: 600; color: #334155; }

    :deep(.tag-xs .p-tag) { font-size: .65rem !important; padding: 1px 6px !important; }
  `]
})
export class CitaCalendarioComponent implements OnInit {

  private citaSvc  = inject(CitaMedicaService);
  private pacSvc   = inject(PacienteService);
  private toast    = inject(MessageService);
  private confirm  = inject(ConfirmationService);
  private fb       = inject(FormBuilder);
  private busq$    = new Subject<string>();
  private verif$   = new Subject<void>();

  // ── Estado del calendario ─────────────────────────────────────────────────
  cargando        = signal(false);
  cargandoDia     = signal(false);
  citasMes        = signal<CitaResumen[]>([]);
  citasDia        = signal<CitaResumen[]>([]);
  diaSeleccionado = signal<DiaCalendario | null>(null);
  mesActual       = signal(new Date().getMonth());
  anioActual      = signal(new Date().getFullYear());

  // ── Diálogos ──────────────────────────────────────────────────────────────
  dialogDia      = false;
  dialogCancelar = false;
  citaACancelar  = signal<CitaResumen | null>(null);
  motivoCancelacion = '';

  // ── Formulario nueva cita ──────────────────────────────────────────────────
  pacienteSeleccionado = signal<PacienteResumen | null>(null);
  resultados           = signal<PacienteResumen[]>([]);
  busquedaPaciente     = '';
  guardando            = signal(false);
  procesando           = signal(false);
  verificando          = signal(false);
  slotDisponible       = signal<boolean | null>(null);
  mensajeSlot          = signal('');

  diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  opDuracion = [
    { label: '15 min', value: 15 }, { label: '30 min', value: 30 },
    { label: '45 min', value: 45 }, { label: '60 min', value: 60 },
    { label: '90 min', value: 90 },
  ];

  opTipos = [
    { label: 'Primera vez',  value: 'PRIMERA_VEZ' },
    { label: 'Control',      value: 'CONTROL'     },
    { label: 'Urgencia',     value: 'URGENCIA'    },
    { label: 'Prenatal',     value: 'PRENATAL'    },
    { label: 'Postparto',    value: 'POSTPARTO'   },
    { label: 'Resultado',    value: 'RESULTADO'   },
    { label: 'Otro',         value: 'OTRO'        },
  ];

  formCita: FormGroup = this.fb.group({
    horaInicio:      [null, Validators.required],
    duracionMinutos: [30],
    tipoCita:        ['CONTROL'],
    motivoCita:      [''],
  });

  // ── Computados ────────────────────────────────────────────────────────────
  nombreMes = computed(() => {
    return new Date(this.anioActual(), this.mesActual(), 1)
      .toLocaleDateString('es-EC', { month: 'long' });
  });

  tituloDia = computed(() => {
    const d = this.diaSeleccionado();
    if (!d) return '';
    return d.fecha.toLocaleDateString('es-EC', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  });

  diasCalendario = computed((): DiaCalendario[] => {
    const anio = this.anioActual();
    const mes  = this.mesActual();
    const hoy  = new Date();
    hoy.setHours(0, 0, 0, 0);

    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0);
    const dias: DiaCalendario[] = [];

    // Días del mes anterior
    for (let i = primerDia.getDay() - 1; i >= 0; i--) {
      const f = new Date(anio, mes, -i);
      dias.push(this.crearDia(f, false, hoy));
    }
    // Días del mes actual
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      dias.push(this.crearDia(new Date(anio, mes, d), true, hoy));
    }
    // Completar hasta 42 celdas
    while (dias.length < 42) {
      const f = new Date(anio, mes + 1, dias.length - ultimoDia.getDate() -
                primerDia.getDay() + 1);
      dias.push(this.crearDia(f, false, hoy));
    }
    return dias;
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // Búsqueda de paciente con debounce
    this.busq$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(t =>
      t.length >= 2 ? this.buscarPacientes(t) : this.resultados.set([])
    );

    // Verificar disponibilidad con debounce
    this.verif$.pipe(debounceTime(500)).subscribe(() => this.verificarSlot());

    this.cargarMes();
  }

  // ── Carga de datos ────────────────────────────────────────────────────────
  cargarMes(): void {
    this.cargando.set(true);
    const inicio = new Date(this.anioActual(), this.mesActual(), 1)
      .toISOString().split('T')[0];
    const fin = new Date(this.anioActual(), this.mesActual() + 1, 0)
      .toISOString().split('T')[0];

    this.citaSvc.calendario(inicio, fin).subscribe({
      next: r => { this.citasMes.set(r.data ?? []); this.cargando.set(false); },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'Error',
          detail: 'No se pudo cargar la agenda' });
        this.cargando.set(false);
      }
    });
  }

  // ── Navegación ────────────────────────────────────────────────────────────
  mesPrevio(): void {
    if (this.mesActual() === 0) {
      this.mesActual.set(11); this.anioActual.update(a => a - 1);
    } else {
      this.mesActual.update(m => m - 1);
    }
    this.cargarMes();
  }

  mesSiguiente(): void {
    if (this.mesActual() === 11) {
      this.mesActual.set(0); this.anioActual.update(a => a + 1);
    } else {
      this.mesActual.update(m => m + 1);
    }
    this.cargarMes();
  }

  irHoy(): void {
    const hoy = new Date();
    this.mesActual.set(hoy.getMonth());
    this.anioActual.set(hoy.getFullYear());
    this.cargarMes();
  }

  // ── Popup día ─────────────────────────────────────────────────────────────
  abrirDia(dia: DiaCalendario): void {
    this.diaSeleccionado.set(dia);
    this.dialogDia = true;
    this.resetFormCita();
    this.cargarCitasDia(dia.fechaStr);
  }

  cerrarDia(): void {
    this.dialogDia = false;
    this.diaSeleccionado.set(null);
    this.citasDia.set([]);
    this.resetFormCita();
  }

  cargarCitasDia(fechaStr: string): void {
    this.cargandoDia.set(true);
    this.citaSvc.porDia(fechaStr).subscribe({
      next: r => { this.citasDia.set(r.data ?? []); this.cargandoDia.set(false); },
      error: () => this.cargandoDia.set(false)
    });
  }

  // ── Formulario nueva cita ─────────────────────────────────────────────────
  onBuscaPaciente(t: string): void { this.busq$.next(t); }

  buscarPacientes(t: string): void {
    this.pacSvc.listar(t, 0, 8, true).subscribe({
      next: r => this.resultados.set(r.data?.contenido ?? [])
    });
  }

  seleccionarPaciente(p: PacienteResumen): void {
    this.pacienteSeleccionado.set(p);
    this.busquedaPaciente = '';
    this.resultados.set([]);
  }

  limpiarPaciente(): void {
    this.pacienteSeleccionado.set(null);
    this.busquedaPaciente = '';
  }

  verificarSlot(): void {
    const dia  = this.diaSeleccionado();
    const hora = this.formCita.get('horaInicio')?.value;
    const dur  = this.formCita.get('duracionMinutos')?.value ?? 30;
    if (!dia || !hora) return;

    const horaStr = hora instanceof Date ? hora.toTimeString().slice(0, 5) : hora;
    this.verificando.set(true);
    this.slotDisponible.set(null);

    this.citaSvc.verificarDisponibilidad(dia.fechaStr, horaStr, dur).subscribe({
      next: r => {
        this.slotDisponible.set(r.data?.disponible ?? true);
        this.mensajeSlot.set(r.data?.mensaje ?? '');
        this.verificando.set(false);
      },
      error: () => this.verificando.set(false)
    });
  }

  agendarCita(): void {
    if (!this.puedeAgendar()) return;
    this.guardando.set(true);

    const dia  = this.diaSeleccionado()!;
    const hora = this.formCita.get('horaInicio')?.value;
    const horaStr = hora instanceof Date ? hora.toTimeString().slice(0, 5) : hora;

    this.citaSvc.crear({
      pacienteId:      this.pacienteSeleccionado()!.id,
      fechaCita:       dia.fechaStr,
      horaInicio:      horaStr,
      duracionMinutos: this.formCita.get('duracionMinutos')?.value ?? 30,
      tipoCita:        this.formCita.get('tipoCita')?.value ?? 'CONTROL',
      motivoCita:      this.formCita.get('motivoCita')?.value ?? '',
    }).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Cita agendada',
          detail: `Cita registrada para ${this.pacienteSeleccionado()!.nombreCompleto}` });
        this.resetFormCita();
        this.cargarCitasDia(dia.fechaStr);
        this.cargarMes();
        this.guardando.set(false);
      },
      error: err => {
        this.toast.add({ severity: 'error', summary: 'Error',
          detail: err.error?.mensaje ?? 'No se pudo agendar la cita' });
        this.guardando.set(false);
      }
    });
  }

  puedeAgendar(): boolean {
    return !!(this.pacienteSeleccionado()
           && this.formCita.valid
           && !this.guardando()
           && (this.slotDisponible() === null || this.slotDisponible() === true));
  }

  resetFormCita(): void {
    this.formCita.reset({ duracionMinutos: 30, tipoCita: 'CONTROL' });
    this.limpiarPaciente();
    this.slotDisponible.set(null);
    this.mensajeSlot.set('');
  }

  // ── Acciones de cita ──────────────────────────────────────────────────────
  marcarAtendida(cita: CitaResumen): void {
    this.citaSvc.marcarAtendida(cita.id).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Actualizado',
          detail: 'Cita marcada como atendida' });
        this.cargarCitasDia(this.diaSeleccionado()!.fechaStr);
        this.cargarMes();
      }
    });
  }

  marcarNoAsistio(cita: CitaResumen): void {
    this.citaSvc.marcarNoAsistio(cita.id).subscribe({
      next: () => {
        this.toast.add({ severity: 'warn', summary: 'Actualizado',
          detail: 'Marcada como no asistió' });
        this.cargarCitasDia(this.diaSeleccionado()!.fechaStr);
        this.cargarMes();
      }
    });
  }

  confirmarCancelar(cita: CitaResumen): void {
    this.citaACancelar.set(cita);
    this.motivoCancelacion = '';
    this.dialogCancelar = true;
  }

  ejecutarCancelar(): void {
    const cita = this.citaACancelar();
    if (!cita || !this.motivoCancelacion.trim()) return;
    this.procesando.set(true);

    this.citaSvc.cancelar(cita.id,
        { motivoCancelacion: this.motivoCancelacion }).subscribe({
      next: () => {
        this.toast.add({ severity: 'warn', summary: 'Cancelada',
          detail: 'Cita cancelada' });
        this.dialogCancelar = false;
        this.cargarCitasDia(this.diaSeleccionado()!.fechaStr);
        this.cargarMes();
        this.procesando.set(false);
      },
      error: err => {
        this.toast.add({ severity: 'error', summary: 'Error',
          detail: err.error?.mensaje ?? 'No se pudo cancelar' });
        this.procesando.set(false);
      }
    });
  }

  abrirDetalleCita(cita: CitaResumen): void {
    // Navegar al detalle sin cerrar el popup —
    // En producción puedes abrir una nueva pestaña o un tercer diálogo
    window.open(`/citas/${cita.id}`, '_blank');
  }

  // ── Helpers visuales ──────────────────────────────────────────────────────

  /**
   * Determina la clave de color para una cita combinando
   * estado y proximidad de fecha (semáforo).
   */
  getColorKey(cita: CitaResumen, fecha?: Date): string {
    // Estados terminales tienen color fijo independiente de la fecha
    if (cita.estado === 'ATENDIDA')  return 'atendida';
    if (cita.estado === 'CANCELADA') return 'cancelada';
    if (cita.estado === 'NO_ASISTIO') return 'noasistio';

    // Para citas activas: semáforo por proximidad
    if (!fecha) return 'futuro';
    const hoy      = new Date(); hoy.setHours(0, 0, 0, 0);
    const fechaCita = new Date(fecha); fechaCita.setHours(0, 0, 0, 0);
    const diff = Math.floor(
      (fechaCita.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diff <= 1)  return 'hoy';      // Hoy y mañana → rojo
    if (diff <= 7)  return 'semana';   // Esta semana → naranja
    return 'futuro';                    // Más de 7 días → verde
  }

  getChipClass(cita: CitaResumen, fecha: Date): string {
    return 'cita-chip chip-' + this.getColorKey(cita, fecha);
  }

  getEstadoLabel(e: EstadoCita): string {
    const m: Record<string, string> = {
      PROGRAMADA: 'Programada', CONFIRMADA: 'Confirmada',
      ATENDIDA: 'Atendida', CANCELADA: 'Cancelada', NO_ASISTIO: 'No asistió'
    };
    return m[e] ?? e;
  }

  getEstadoSev(e: EstadoCita): 'info'|'success'|'warning'|'danger'|'secondary' {
    const m: Record<string, 'info'|'success'|'warning'|'danger'|'secondary'> = {
      PROGRAMADA: 'info', CONFIRMADA: 'info',
      ATENDIDA: 'success', CANCELADA: 'danger', NO_ASISTIO: 'warning'
    };
    return m[e] ?? 'secondary';
  }

  getTipoLabel(t: string): string {
    const m: Record<string, string> = {
      PRIMERA_VEZ: 'Primera vez', CONTROL: 'Control',
      URGENCIA: 'Urgencia', PRENATAL: 'Prenatal',
      POSTPARTO: 'Postparto', RESULTADO: 'Resultado', OTRO: 'Otro'
    };
    return m[t] ?? t;
  }

  isInvalid(f: string): boolean {
    const c = this.formCita.get(f);
    return !!(c?.invalid && c?.touched);
  }

  private crearDia(
    fecha: Date, esMesActual: boolean, hoy: Date
  ): DiaCalendario {
    const fechaStr = fecha.toISOString().split('T')[0];
    const esHoy    = fecha.toDateString() === hoy.toDateString();
    const dow      = fecha.getDay();
    const citas    = this.citasMes().filter(c => c.fechaCita === fechaStr)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    return {
      fecha, fechaStr, esHoy, esMesActual,
      esFinDeSemana: dow === 0 || dow === 6,
      citas
    };
  }
}
