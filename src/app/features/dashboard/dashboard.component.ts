import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { CitaMedicaService } from '../../core/services/cita-medica.service';
import { DashboardService, StatsAdmin, StatsMedico } from '../../core/services/dashboard.service';
import { CitaResumen, EstadoCita } from '../../core/models/cita.models';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    ButtonModule, TagModule, ToastModule,
    SkeletonModule, TooltipModule, DialogModule,
    InputTextareaModule, ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <!-- ══ BIENVENIDA ══════════════════════════════════════════════════ -->
    <div class="bienvenida">
      <div class="bienvenida-texto">
        <h2>{{ saludo() }}, <span class="nombre">{{ nombreUsuario() }}</span> 👋</h2>
        <p>{{ fechaHoy() }} · {{ descripcionRol() }}</p>
      </div>
      <div class="fecha-box">
        <span class="fecha-dia">{{ diaHoy() }}</span>
        <span class="fecha-mes">{{ mesHoy() }}</span>
      </div>
    </div>

    <!-- ══ SUPERADMIN / ADMIN ══════════════════════════════════════════ -->
    @if (esAdmin()) {

      <div class="cards-grid">

        <div class="stat-card azul" routerLink="/pacientes">
          <div class="stat-icon"><i class="pi pi-users"></i></div>
          <div class="stat-info">
            @if (cargandoStats()) {
              <p-skeleton width="4rem" height="2rem" />
              <p-skeleton width="6rem" height="1rem" styleClass="mt-1" />
            } @else {
              <span class="stat-valor">{{ statsAdmin()?.totalPacientes ?? 0 }}</span>
              <span class="stat-label">Total Pacientes</span>
              <span class="stat-sub">{{ statsAdmin()?.pacientesActivos ?? 0 }} activos</span>
            }
          </div>
          <i class="pi pi-chevron-right stat-arrow"></i>
        </div>

        <div class="stat-card verde" routerLink="/citas">
          <div class="stat-icon"><i class="pi pi-calendar-times"></i></div>
          <div class="stat-info">
            @if (cargandoStats()) {
              <p-skeleton width="4rem" height="2rem" />
              <p-skeleton width="6rem" height="1rem" styleClass="mt-1" />
            } @else {
              <span class="stat-valor">{{ statsAdmin()?.citasHoy ?? 0 }}</span>
              <span class="stat-label">Citas Hoy</span>
              <span class="stat-sub">{{ statsAdmin()?.citasPendientes ?? 0 }} pendientes</span>
            }
          </div>
          <i class="pi pi-chevron-right stat-arrow"></i>
        </div>

        <div class="stat-card naranja" routerLink="/citas">
          <div class="stat-icon"><i class="pi pi-chart-bar"></i></div>
          <div class="stat-info">
            @if (cargandoStats()) {
              <p-skeleton width="4rem" height="2rem" />
              <p-skeleton width="6rem" height="1rem" styleClass="mt-1" />
            } @else {
              <span class="stat-valor">{{ statsAdmin()?.citasMes ?? 0 }}</span>
              <span class="stat-label">Citas este Mes</span>
              <span class="stat-sub">{{ statsAdmin()?.citasAtendidas ?? 0 }} atendidas</span>
            }
          </div>
          <i class="pi pi-chevron-right stat-arrow"></i>
        </div>

        <div class="stat-card teal" routerLink="/historias">
          <div class="stat-icon"><i class="pi pi-file-edit"></i></div>
          <div class="stat-info">
            @if (cargandoStats()) {
              <p-skeleton width="4rem" height="2rem" />
              <p-skeleton width="6rem" height="1rem" styleClass="mt-1" />
            } @else {
              <span class="stat-valor">{{ statsAdmin()?.consultasMes ?? 0 }}</span>
              <span class="stat-label">Consultas del Mes</span>
              <span class="stat-sub">Historias clinicas</span>
            }
          </div>
          <i class="pi pi-chevron-right stat-arrow"></i>
        </div>

        <div class="stat-card morado" routerLink="/usuarios">
          <div class="stat-icon"><i class="pi pi-shield"></i></div>
          <div class="stat-info">
            @if (cargandoStats()) {
              <p-skeleton width="4rem" height="2rem" />
              <p-skeleton width="6rem" height="1rem" styleClass="mt-1" />
            } @else {
              <span class="stat-valor">{{ statsAdmin()?.totalUsuarios ?? 0 }}</span>
              <span class="stat-label">Usuarios</span>
              <span class="stat-sub">Registrados en el sistema</span>
            }
          </div>
          <i class="pi pi-chevron-right stat-arrow"></i>
        </div>

        <div class="stat-card rojo">
          <div class="stat-icon"><i class="pi pi-times-circle"></i></div>
          <div class="stat-info">
            @if (cargandoStats()) {
              <p-skeleton width="4rem" height="2rem" />
              <p-skeleton width="6rem" height="1rem" styleClass="mt-1" />
            } @else {
              <span class="stat-valor">{{ statsAdmin()?.citasCanceladas ?? 0 }}</span>
              <span class="stat-label">Citas Canceladas</span>
              <span class="stat-sub">Total historico</span>
            }
          </div>
        </div>

      </div>

      <!-- Accesos rapidos admin -->
      <div class="section-header">
        <h3><i class="pi pi-bolt"></i> Accesos Rapidos</h3>
      </div>
      <div class="accesos-grid">
        <a routerLink="/pacientes/nuevo" class="acceso-card">
          <i class="pi pi-user-plus"></i>
          <span>Nuevo Paciente</span>
        </a>
        <a routerLink="/citas" class="acceso-card">
          <i class="pi pi-calendar-plus"></i>
          <span>Ver Agenda</span>
        </a>
        <a routerLink="/historias" class="acceso-card">
          <i class="pi pi-file-edit"></i>
          <span>Historias Clinicas</span>
        </a>
        <a routerLink="/auditoria" class="acceso-card">
          <i class="pi pi-history"></i>
          <span>Auditoria</span>
        </a>
        <a routerLink="/usuarios" class="acceso-card">
          <i class="pi pi-users"></i>
          <span>Usuarios</span>
        </a>
        <a routerLink="/roles" class="acceso-card">
          <i class="pi pi-shield"></i>
          <span>Roles</span>
        </a>
      </div>

      <!-- Citas de hoy para admin -->
      <div class="section-header">
        <h3>
          <i class="pi pi-calendar"></i> Agenda de Hoy
          @if (!cargandoCitas() && citasDeHoy().length > 0) {
            <span class="section-count">{{ citasDeHoy().length }} cita(s)</span>
          }
        </h3>
        <a routerLink="/citas">
          <p-button label="Ver Calendario" icon="pi pi-calendar-times"
                    [text]="true" severity="secondary" />
        </a>
      </div>

      <ng-container *ngTemplateOutlet="agendaHoy" />
    }

    <!-- ══ MÉDICO ESPECIALISTA ══════════════════════════════════════════ -->
    @if (esMedico()) {

      <div class="cards-grid">

        <div class="stat-card azul" routerLink="/pacientes">
          <div class="stat-icon"><i class="pi pi-users"></i></div>
          <div class="stat-info">
            @if (cargandoStats()) {
              <p-skeleton width="4rem" height="2rem" />
              <p-skeleton width="6rem" height="1rem" styleClass="mt-1" />
            } @else {
              <span class="stat-valor">{{ statsMedico()?.totalPacientes ?? 0 }}</span>
              <span class="stat-label">Pacientes</span>
              <span class="stat-sub">Total registrados</span>
            }
          </div>
          <i class="pi pi-chevron-right stat-arrow"></i>
        </div>

        <div class="stat-card" [class]="citasHoyCard()" routerLink="/citas">
          <div class="stat-icon"><i class="pi pi-calendar"></i></div>
          <div class="stat-info">
            @if (cargandoStats()) {
              <p-skeleton width="4rem" height="2rem" />
              <p-skeleton width="6rem" height="1rem" styleClass="mt-1" />
            } @else {
              <span class="stat-valor">{{ statsMedico()?.citasPendientesHoy ?? 0 }}</span>
              <span class="stat-label">Pendientes Hoy</span>
              <span class="stat-sub">{{ statsMedico()?.citasAtendidasHoy ?? 0 }} atendidas</span>
            }
          </div>
          <i class="pi pi-chevron-right stat-arrow"></i>
        </div>

        <div class="stat-card naranja" routerLink="/citas">
          <div class="stat-icon"><i class="pi pi-calendar-times"></i></div>
          <div class="stat-info">
            @if (cargandoStats()) {
              <p-skeleton width="4rem" height="2rem" />
              <p-skeleton width="6rem" height="1rem" styleClass="mt-1" />
            } @else {
              <span class="stat-valor">{{ statsMedico()?.citasPendientesSemana ?? 0 }}</span>
              <span class="stat-label">Esta Semana</span>
              <span class="stat-sub">Citas pendientes</span>
            }
          </div>
          <i class="pi pi-chevron-right stat-arrow"></i>
        </div>

        <div class="stat-card teal" routerLink="/historias">
          <div class="stat-icon"><i class="pi pi-file-edit"></i></div>
          <div class="stat-info">
            @if (cargandoStats()) {
              <p-skeleton width="4rem" height="2rem" />
              <p-skeleton width="6rem" height="1rem" styleClass="mt-1" />
            } @else {
              <span class="stat-valor">{{ statsMedico()?.consultasMes ?? 0 }}</span>
              <span class="stat-label">Consultas del Mes</span>
              <span class="stat-sub">Historias clinicas</span>
            }
          </div>
          <i class="pi pi-chevron-right stat-arrow"></i>
        </div>

      </div>

      <div class="section-header">
        <h3>
          <i class="pi pi-calendar"></i> Agenda de Hoy
          @if (!cargandoCitas() && citasDeHoy().length > 0) {
            <span class="section-count">{{ citasDeHoy().length }} cita(s)</span>
          }
        </h3>
        <a routerLink="/citas">
          <p-button label="Ver Calendario" icon="pi pi-calendar-times"
                    [text]="true" severity="secondary" />
        </a>
      </div>

      <ng-container *ngTemplateOutlet="agendaHoy" />
    }

    <!-- ══ PACIENTE ══════════════════════════════════════════════════════ -->
    @if (esPaciente()) {

      <div class="cards-grid">

        <div class="stat-card verde">
          <div class="stat-icon"><i class="pi pi-calendar-check"></i></div>
          <div class="stat-info">
            @if (cargandoCitas()) {
              <p-skeleton width="3rem" height="2rem" />
            } @else {
              <span class="stat-valor">{{ citasPendientesPaciente() }}</span>
              <span class="stat-label">Citas Pendientes</span>
              <span class="stat-sub">Por atenderse</span>
            }
          </div>
        </div>

        <div class="stat-card azul">
          <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
          <div class="stat-info">
            @if (cargandoCitas()) {
              <p-skeleton width="3rem" height="2rem" />
            } @else {
              <span class="stat-valor">{{ citasAtendidasPaciente() }}</span>
              <span class="stat-label">Citas Atendidas</span>
              <span class="stat-sub">Historial de consultas</span>
            }
          </div>
        </div>

        <div class="stat-card naranja">
          <div class="stat-icon"><i class="pi pi-list"></i></div>
          <div class="stat-info">
            @if (cargandoCitas()) {
              <p-skeleton width="3rem" height="2rem" />
            } @else {
              <span class="stat-valor">{{ citasDeHoy().length }}</span>
              <span class="stat-label">Total Citas</span>
              <span class="stat-sub">Todas registradas</span>
            }
          </div>
        </div>

      </div>

      <div class="section-header">
        <h3><i class="pi pi-calendar"></i> Mis Proximas Citas</h3>
      </div>

      @if (cargandoCitas()) {
        <div class="agenda-skeleton">
          @for (i of [1,2]; track i) {
            <div class="agenda-sk-card">
              <p-skeleton width="50px" height="50px" borderRadius="12px" />
              <div style="flex:1">
                <p-skeleton height="1rem" styleClass="mb-2" />
                <p-skeleton width="60%" height=".8rem" />
              </div>
            </div>
          }
        </div>
      } @else if (citasPendientesFiltradas().length === 0) {
        <div class="agenda-vacia">
          <div class="agenda-vacia-icon"><i class="pi pi-calendar"></i></div>
          <h4>No tienes citas pendientes</h4>
          <p>Contacta al consultorio para agendar una cita.</p>
        </div>
      } @else {
        <div class="agenda-list">
          @for (cita of citasPendientesFiltradas(); track cita.id) {
            <div class="agenda-card borde-futuro">
              <div class="agenda-hora">
                <span class="ah-ini">{{ cita.horaInicio }}</span>
                <span class="ah-fin">{{ cita.fechaCita | date:'dd/MM' }}</span>
              </div>
              <div class="agenda-linea linea-futuro"></div>
              <div class="agenda-info">
                <span class="ai-nombre">{{ getTipoLabel(cita.tipoCita) }}</span>
                @if (cita.motivoCita) {
                  <div class="ai-meta">
                    <span class="ai-motivo">{{ cita.motivoCita }}</span>
                  </div>
                }
              </div>
              <div class="agenda-acciones">
                <p-tag [value]="getEstadoLabel(cita.estado)"
                       [severity]="getEstadoSev(cita.estado)" />
              </div>
            </div>
          }
        </div>
      }
    }

    <!-- ══ TEMPLATE REUTILIZABLE: AGENDA HOY ══════════════════════════ -->
    <ng-template #agendaHoy>
      @if (cargandoCitas()) {
        <div class="agenda-skeleton">
          @for (i of [1,2,3]; track i) {
            <div class="agenda-sk-card">
              <p-skeleton width="50px" height="50px" borderRadius="12px" />
              <div style="flex:1">
                <p-skeleton height="1rem" styleClass="mb-2" />
                <p-skeleton width="60%" height=".8rem" />
              </div>
            </div>
          }
        </div>
      } @else if (citasDeHoy().length === 0) {
        <div class="agenda-vacia">
          <div class="agenda-vacia-icon"><i class="pi pi-calendar-plus"></i></div>
          <h4>Sin citas para hoy</h4>
          <p>No hay citas programadas para el dia de hoy.</p>
          <a routerLink="/citas">
            <p-button label="Ir al Calendario" icon="pi pi-calendar"
                      styleClass="btn-primary" />
          </a>
        </div>
      } @else {
        <div class="agenda-list">
          @for (cita of citasDeHoy(); track cita.id) {
            <div class="agenda-card" [class]="'borde-' + getColorKey(cita)">

              <div class="agenda-hora">
                <span class="ah-ini">{{ cita.horaInicio }}</span>
                <span class="ah-fin">{{ cita.horaFin }}</span>
              </div>

              <div class="agenda-linea"
                   [class]="'linea-' + getColorKey(cita)"></div>

              <div class="agenda-info">
                <span class="ai-nombre">{{ cita.pacienteNombreCompleto }}</span>
                <div class="ai-meta">
                  <span class="ai-tipo">
                    <i [class]="'pi ' + getTipoIcon(cita.tipoCita)"></i>
                    {{ getTipoLabel(cita.tipoCita) }}
                  </span>
                  @if (cita.motivoCita) {
                    <span class="ai-motivo">
                      · {{ cita.motivoCita | slice:0:40 }}
                    </span>
                  }
                </div>
                @if (cita.pacienteCelular) {
                  <span class="ai-tel">
                    <i class="pi pi-phone"></i> {{ cita.pacienteCelular }}
                  </span>
                }
              </div>

              <div class="agenda-acciones">
                <p-tag [value]="getEstadoLabel(cita.estado)"
                       [severity]="getEstadoSev(cita.estado)"
                       styleClass="tag-agenda" />

                @if (cita.estado === 'PROGRAMADA' || cita.estado === 'CONFIRMADA') {
                  <div class="agenda-btns">
                    <p-button icon="pi pi-check" [rounded]="true" [text]="true"
                              severity="success"
                              pTooltip="Marcar atendida" tooltipPosition="top"
                              (onClick)="marcarAtendida(cita)" />
                    <p-button icon="pi pi-times" [rounded]="true" [text]="true"
                              severity="warning"
                              pTooltip="No asistio" tooltipPosition="top"
                              (onClick)="marcarNoAsistio(cita)" />
                    <p-button icon="pi pi-ban" [rounded]="true" [text]="true"
                              severity="danger"
                              pTooltip="Cancelar" tooltipPosition="top"
                              (onClick)="abrirCancelar(cita)" />
                  </div>
                } @else {
                  <div class="agenda-btns">
                    <p-button icon="pi pi-eye" [rounded]="true" [text]="true"
                              severity="secondary"
                              pTooltip="Ver detalle" tooltipPosition="top"
                              (onClick)="verCita(cita)" />
                  </div>
                }
              </div>

            </div>
          }
        </div>
      }
    </ng-template>

    <!-- ══ DIALOGO CANCELAR ═════════════════════════════════════════════ -->
    <p-dialog [(visible)]="dialogCancelar"
              header="Cancelar Cita"
              [modal]="true"
              [style]="{width:'420px'}"
              [draggable]="false">
      <div class="campo-cancelar">
        <label>Motivo de cancelacion <span class="req">*</span></label>
        <textarea pInputTextarea [(ngModel)]="motivoCancelacion"
                  rows="3" class="w-full"
                  placeholder="Indica el motivo...">
        </textarea>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="Volver" [text]="true" severity="secondary"
                  (onClick)="dialogCancelar = false" />
        <p-button label="Confirmar cancelacion" icon="pi pi-ban"
                  severity="danger"
                  [loading]="procesando()"
                  [disabled]="!motivoCancelacion.trim()"
                  (onClick)="ejecutarCancelar()" />
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    /* ── Bienvenida ──────────────────────────────────────────────────── */
    .bienvenida {
      display: flex; align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, #0a2342 0%, #1a4a7a 100%);
      border-radius: 18px; padding: 1.5rem 2rem;
      margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
    }
    .bienvenida-texto h2 {
      margin: 0 0 4px; font-size: 1.4rem;
      font-weight: 700; color: white;
    }
    .nombre { color: #0fb8ad; }
    .bienvenida-texto p {
      margin: 0; font-size: .85rem;
      color: rgba(255,255,255,.6);
      text-transform: capitalize;
    }
    .fecha-box {
      display: flex; flex-direction: column;
      align-items: center;
      background: rgba(255,255,255,.1);
      border-radius: 12px; padding: .75rem 1.25rem;
      min-width: 70px;
    }
    .fecha-dia {
      font-size: 2rem; font-weight: 800;
      color: white; line-height: 1;
    }
    .fecha-mes {
      font-size: .75rem; font-weight: 700;
      color: #0fb8ad;
      text-transform: uppercase; letter-spacing: 1px;
    }

    /* ── Cards estadísticas ──────────────────────────────────────────── */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem; margin-bottom: 1.5rem;
    }

    .stat-card {
      display: flex; align-items: center; gap: 1.2rem;
      background: white; border-radius: 16px;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 2px 12px rgba(0,0,0,.07);
      cursor: pointer;
      transition: transform .18s, box-shadow .18s;
      text-decoration: none;
      position: relative; overflow: hidden;
    }
    .stat-card::before {
      content: ''; position: absolute;
      top: 0; left: 0; width: 4px; height: 100%;
    }
    .stat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0,0,0,.12);
    }

    .stat-card.azul::before    { background: #2563eb; }
    .stat-card.verde::before   { background: #16a34a; }
    .stat-card.naranja::before { background: #f97316; }
    .stat-card.morado::before  { background: #7c3aed; }
    .stat-card.teal::before    { background: #0fb8ad; }
    .stat-card.rojo::before    { background: #dc2626; }

    .stat-icon {
      width: 52px; height: 52px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon .pi { font-size: 1.4rem; }

    .stat-card.azul    .stat-icon { background:#eff6ff; }
    .stat-card.azul    .stat-icon .pi { color:#2563eb; }
    .stat-card.verde   .stat-icon { background:#f0fdf4; }
    .stat-card.verde   .stat-icon .pi { color:#16a34a; }
    .stat-card.naranja .stat-icon { background:#fff7ed; }
    .stat-card.naranja .stat-icon .pi { color:#f97316; }
    .stat-card.morado  .stat-icon { background:#f5f3ff; }
    .stat-card.morado  .stat-icon .pi { color:#7c3aed; }
    .stat-card.teal    .stat-icon { background:#e0f7f6; }
    .stat-card.teal    .stat-icon .pi { color:#0fb8ad; }
    .stat-card.rojo    .stat-icon { background:#fef2f2; }
    .stat-card.rojo    .stat-icon .pi { color:#dc2626; }

    .stat-info { display:flex; flex-direction:column; flex:1; }
    .stat-valor { font-size:1.8rem; font-weight:800; color:#0a2342; line-height:1.1; }
    .stat-label { font-size:.85rem; font-weight:600; color:#334155; margin-top:2px; }
    .stat-sub   { font-size:.75rem; color:#94a3b8; margin-top:1px; }
    .stat-arrow { color:#cbd5e1; font-size:.9rem; }

    /* ── Accesos rápidos ─────────────────────────────────────────────── */
    .section-header {
      display:flex; align-items:center;
      justify-content:space-between;
      margin-bottom:1rem; flex-wrap:wrap; gap:.5rem;
    }
    .section-header h3 {
      margin:0; font-size:1rem; font-weight:700;
      color:#0a2342; display:flex; align-items:center; gap:8px;
    }
    .section-header h3 .pi { color:#6366f1; }
    .section-count {
      background:#ede9fe; color:#5b21b6;
      font-size:.75rem; font-weight:700;
      padding:2px 10px; border-radius:20px; margin-left:8px;
    }

    .accesos-grid {
      display:grid;
      grid-template-columns:repeat(auto-fit, minmax(130px,1fr));
      gap:.75rem; margin-bottom:1.5rem;
    }
    .acceso-card {
      display:flex; flex-direction:column;
      align-items:center; gap:.6rem;
      padding:1.2rem 1rem;
      background:white; border-radius:14px;
      border:1.5px solid #e2e8f0;
      text-decoration:none; color:#334155;
      font-size:.83rem; font-weight:600;
      transition:all .15s; cursor:pointer;
    }
    .acceso-card:hover {
      border-color:#6366f1; color:#6366f1;
      background:#f5f3ff; transform:translateY(-2px);
      box-shadow:0 4px 12px rgba(99,102,241,.15);
    }
    .acceso-card .pi { font-size:1.4rem; color:#6366f1; }

    /* ── Agenda ──────────────────────────────────────────────────────── */
    .agenda-skeleton {
      display:flex; flex-direction:column;
      gap:.75rem; margin-bottom:1rem;
    }
    .agenda-sk-card {
      display:flex; align-items:center; gap:1rem;
      background:white; border-radius:14px;
      padding:1rem 1.25rem;
      box-shadow:0 2px 8px rgba(0,0,0,.06);
    }

    .agenda-vacia {
      background:white; border-radius:16px;
      padding:3rem 2rem; text-align:center;
      box-shadow:0 2px 12px rgba(0,0,0,.06);
      margin-bottom:1rem;
    }
    .agenda-vacia-icon {
      width:70px; height:70px; border-radius:50%;
      background:#f1f5f9;
      display:flex; align-items:center; justify-content:center;
      margin:0 auto 1rem;
    }
    .agenda-vacia-icon .pi { font-size:1.8rem; color:#94a3b8; }
    .agenda-vacia h4 { margin:0 0 .5rem; color:#334155; }
    .agenda-vacia p  { margin:0 0 1.5rem; color:#94a3b8; font-size:.9rem; }

    .agenda-list { display:flex; flex-direction:column; gap:.75rem; }

    .agenda-card {
      display:flex; align-items:center; gap:1rem;
      background:white; border-radius:14px;
      padding:1rem 1.25rem;
      box-shadow:0 2px 10px rgba(0,0,0,.06);
      border-left:5px solid #e2e8f0;
      transition:transform .15s, box-shadow .15s;
    }
    .agenda-card:hover {
      transform:translateX(3px);
      box-shadow:0 6px 20px rgba(0,0,0,.1);
    }

    /* Semáforo */
    .borde-hoy      { border-left-color:#dc2626; }
    .borde-semana   { border-left-color:#f97316; }
    .borde-futuro   { border-left-color:#16a34a; }
    .borde-atendida { border-left-color:#6366f1; }
    .borde-cancelada{ border-left-color:#94a3b8; }
    .borde-noasistio{ border-left-color:#d97706; }

    .agenda-hora {
      display:flex; flex-direction:column;
      align-items:center; min-width:52px; flex-shrink:0;
    }
    .ah-ini { font-size:.95rem; font-weight:800; color:#0a2342; }
    .ah-fin { font-size:.72rem; color:#94a3b8; }

    .agenda-linea {
      width:3px; height:44px;
      border-radius:3px; flex-shrink:0;
    }
    .linea-hoy      { background:linear-gradient(180deg,#dc2626,#fca5a5); }
    .linea-semana   { background:linear-gradient(180deg,#f97316,#fed7aa); }
    .linea-futuro   { background:linear-gradient(180deg,#16a34a,#86efac); }
    .linea-atendida { background:linear-gradient(180deg,#6366f1,#a5b4fc); }
    .linea-cancelada{ background:#e2e8f0; }
    .linea-noasistio{ background:linear-gradient(180deg,#d97706,#fde68a); }

    .agenda-info {
      display:flex; flex-direction:column;
      gap:3px; flex:1; min-width:0;
    }
    .ai-nombre {
      font-size:.95rem; font-weight:700; color:#0a2342;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }
    .ai-meta {
      display:flex; align-items:center; gap:6px;
      font-size:.78rem; color:#64748b; flex-wrap:wrap;
    }
    .ai-tipo { display:flex; align-items:center; gap:4px; }
    .ai-tipo .pi { font-size:.7rem; color:#6366f1; }
    .ai-motivo { color:#94a3b8; }
    .ai-tel {
      font-size:.75rem; color:#64748b;
      display:flex; align-items:center; gap:4px;
    }
    .ai-tel .pi { font-size:.68rem; color:#94a3b8; }

    .agenda-acciones {
      display:flex; flex-direction:column;
      align-items:flex-end; gap:6px; flex-shrink:0;
    }
    .agenda-btns { display:flex; gap:2px; }
    :deep(.tag-agenda .p-tag) { font-size:.72rem !important; }

    /* ── Cancelar ────────────────────────────────────────────────────── */
    .campo-cancelar { display:flex; flex-direction:column; gap:6px; }
    .campo-cancelar label { font-size:.83rem; font-weight:600; color:#334155; }
    .req { color:#ef4444; }
    :deep(textarea.p-inputtextarea) { border-radius:10px !important; resize:none; }
  `]
})
export class DashboardComponent implements OnInit {

  private router = inject(Router);
  private authService = inject(AuthService);
  private citaSvc = inject(CitaMedicaService);
  private dashSvc = inject(DashboardService);
  private toast = inject(MessageService);

  // ── Estado ────────────────────────────────────────────────────────────
  cargandoStats = signal(false);
  cargandoCitas = signal(false);
  procesando = signal(false);
  statsAdmin = signal<StatsAdmin | null>(null);
  statsMedico = signal<StatsMedico | null>(null);
  citasDeHoy = signal<CitaResumen[]>([]);

  dialogCancelar = false;
  citaACancelar = signal<CitaResumen | null>(null);
  motivoCancelacion = '';

  // ── Roles ─────────────────────────────────────────────────────────────
  // Usa directamente los computados y signal del AuthService
  rolActual = computed(() => this.authService.rolActual() ?? '');

  esAdmin = computed(() =>
    this.rolActual() === 'SUPERADMINISTRADOR' ||
    this.rolActual() === 'ADMINISTRADOR'
  );
  esMedico = computed(() => this.rolActual() === 'MEDICO_ESPECIALISTA');
  esPaciente = computed(() => this.rolActual() === 'PACIENTE');

  nombreUsuario = computed(() =>
    this.authService.nombreUsuario().split(' ')[0] ?? 'Usuario'
  );

  descripcionRol = computed(() => {
    const m: Record<string, string> = {
      SUPERADMINISTRADOR: 'Super Administrador del Sistema',
      ADMINISTRADOR: 'Administrador del Consultorio',
      MEDICO_ESPECIALISTA: 'Medico Especialista en Ginecologia y Obstetricia',
      PACIENTE: 'Paciente del Consultorio'
    };
    return m[this.rolActual()] ?? this.rolActual();
  });

  saludo = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos dias';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  });

  citasHoyCard = computed(() => {
    const n = this.statsMedico()?.citasPendientesHoy ?? 0;
    if (n === 0) return 'verde';
    if (n <= 3) return 'naranja';
    return 'rojo';
  });

  citasPendientesPaciente = computed(() =>
    this.citasDeHoy().filter(c =>
      c.estado === 'PROGRAMADA' || c.estado === 'CONFIRMADA'
    ).length
  );

  citasAtendidasPaciente = computed(() =>
    this.citasDeHoy().filter(c => c.estado === 'ATENDIDA').length
  );

  citasPendientesFiltradas = computed(() =>
    this.citasDeHoy().filter(c =>
      c.estado === 'PROGRAMADA' || c.estado === 'CONFIRMADA'
    )
  );

  // ── Fecha ─────────────────────────────────────────────────────────────
  fechaHoy = computed(() =>
    new Date().toLocaleDateString('es-EC', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  );
  diaHoy = computed(() =>
    new Date().getDate().toString().padStart(2, '0')
  );
  mesHoy = computed(() =>
    new Date().toLocaleDateString('es-EC', { month: 'short' }).toUpperCase()
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    const rol = this.rolActual();

    if (rol === 'SUPERADMINISTRADOR' || rol === 'ADMINISTRADOR') {
      this.cargarStatsAdmin();
      this.cargarCitasHoy();
    } else if (rol === 'MEDICO_ESPECIALISTA') {
      this.cargarStatsMedico();
      this.cargarCitasHoy();
    } else if (rol === 'PACIENTE') {
      this.cargarCitasPaciente();
    }
  }

  // ── Carga de datos ────────────────────────────────────────────────────
  cargarStatsAdmin(): void {
    this.cargandoStats.set(true);
    this.dashSvc.statsAdmin().subscribe({
      next: r => { this.statsAdmin.set(r.data); this.cargandoStats.set(false); },
      error: () => this.cargandoStats.set(false)
    });
  }

  cargarStatsMedico(): void {
    this.cargandoStats.set(true);
    this.dashSvc.statsMedico().subscribe({
      next: r => { this.statsMedico.set(r.data); this.cargandoStats.set(false); },
      error: () => this.cargandoStats.set(false)
    });
  }

  cargarCitasHoy(): void {
    this.cargandoCitas.set(true);
    this.dashSvc.citasHoy(20).subscribe({
      next: r => { this.citasDeHoy.set(r.data ?? []); this.cargandoCitas.set(false); },
      error: () => this.cargandoCitas.set(false)
    });
  }

  cargarCitasPaciente(): void {
    // El paciente ve sus propias citas — por ahora usa citasHoy
    // En el futuro se puede agregar un endpoint /dashboard/mis-citas
    this.cargandoCitas.set(true);
    this.dashSvc.citasHoy(50).subscribe({
      next: r => { this.citasDeHoy.set(r.data ?? []); this.cargandoCitas.set(false); },
      error: () => this.cargandoCitas.set(false)
    });
  }

  // ── Acciones sobre citas ──────────────────────────────────────────────
  marcarAtendida(cita: CitaResumen): void {
    this.citaSvc.marcarAtendida(cita.id).subscribe({
      next: () => {
        this.toast.add({
          severity: 'success', summary: 'Atendida',
          detail: `${cita.pacienteNombreCompleto} marcada como atendida`
        });
        this.recargarDatos();
      },
      error: err => this.toast.add({
        severity: 'error', summary: 'Error',
        detail: err.error?.mensaje ?? 'No se pudo actualizar'
      })
    });
  }

  marcarNoAsistio(cita: CitaResumen): void {
    this.citaSvc.marcarNoAsistio(cita.id).subscribe({
      next: () => {
        this.toast.add({
          severity: 'warn', summary: 'No asistio',
          detail: `${cita.pacienteNombreCompleto} marcada como no asistio`
        });
        this.recargarDatos();
      },
      error: err => this.toast.add({
        severity: 'error', summary: 'Error',
        detail: err.error?.mensaje ?? 'No se pudo actualizar'
      })
    });
  }

  abrirCancelar(cita: CitaResumen): void {
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
          this.toast.add({
            severity: 'warn', summary: 'Cancelada',
            detail: 'Cita cancelada exitosamente'
          });
          this.dialogCancelar = false;
          this.recargarDatos();
          this.procesando.set(false);
        },
        error: err => {
          this.toast.add({
            severity: 'error', summary: 'Error',
            detail: err.error?.mensaje ?? 'No se pudo cancelar'
          });
          this.procesando.set(false);
        }
      });
  }

  verCita(cita: CitaResumen): void {
    this.router.navigate(['/citas', cita.id]);
  }

  private recargarDatos(): void {
    this.cargarCitasHoy();
    if (this.esMedico()) this.cargarStatsMedico();
    if (this.esAdmin()) this.cargarStatsAdmin();
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  getColorKey(cita: CitaResumen): string {
    if (cita.estado === 'ATENDIDA') return 'atendida';
    if (cita.estado === 'CANCELADA') return 'cancelada';
    if (cita.estado === 'NO_ASISTIO') return 'noasistio';

    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const fc = new Date(cita.fechaCita + 'T00:00:00');
    fc.setHours(0, 0, 0, 0);
    const diff = Math.floor((fc.getTime() - hoy.getTime()) / 86400000);

    if (diff <= 1) return 'hoy';
    if (diff <= 7) return 'semana';
    return 'futuro';
  }

  getEstadoLabel(e: EstadoCita): string {
    const m: Record<string, string> = {
      PROGRAMADA: 'Programada', CONFIRMADA: 'Confirmada',
      ATENDIDA: 'Atendida', CANCELADA: 'Cancelada', NO_ASISTIO: 'No asistio'
    };
    return m[e] ?? e;
  }

  getEstadoSev(e: EstadoCita): 'info' | 'success' | 'warning' | 'danger' | 'secondary' {
    const m: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'secondary'> = {
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

  getTipoIcon(t: string): string {
    const m: Record<string, string> = {
      PRIMERA_VEZ: 'pi-star', CONTROL: 'pi-refresh',
      URGENCIA: 'pi-exclamation-triangle', PRENATAL: 'pi-heart-fill',
      POSTPARTO: 'pi-heart', RESULTADO: 'pi-file', OTRO: 'pi-calendar'
    };
    return m[t] ?? 'pi-calendar';
  }
}
