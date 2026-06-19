import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule }     from '@angular/forms';
import { ButtonModule }    from 'primeng/button';
import { TagModule }       from 'primeng/tag';
import { ToastModule }     from 'primeng/toast';
import { SkeletonModule }  from 'primeng/skeleton';
import { TooltipModule }   from 'primeng/tooltip';
import { DialogModule }    from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { forkJoin }               from 'rxjs';
import { AuthService }            from '../../core/services/auth.service';
import { CitaMedicaService }      from '../../core/services/cita-medica.service';
import { HistoriaClinicaService } from '../../core/services/historia-clinica.service';
import { DashboardService, StatsAdmin, StatsMedico } from '../../core/services/dashboard.service';
import { CitaResumen, EstadoCita } from '../../core/models/cita.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    ButtonModule, TagModule, ToastModule, SkeletonModule,
    TooltipModule, DialogModule, TextareaModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <!-- ══ BIENVENIDA ═════════════════════════════════════════════════════ -->
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

    <!-- ══ SUPERADMIN / ADMIN ═════════════════════════════════════════════ -->
    @if (esAdmin()) {

      <div class="cards-grid">
        <div class="stat-card azul" routerLink="/pacientes">
          <div class="stat-icon"><i class="pi pi-users"></i></div>
          <div class="stat-info">
            @if (cargandoStats()) { <p-skeleton width="4rem" height="2rem" />
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
            @if (cargandoStats()) { <p-skeleton width="4rem" height="2rem" />
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
            @if (cargandoStats()) { <p-skeleton width="4rem" height="2rem" />
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
            @if (cargandoStats()) { <p-skeleton width="4rem" height="2rem" />
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
            @if (cargandoStats()) { <p-skeleton width="4rem" height="2rem" />
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
            @if (cargandoStats()) { <p-skeleton width="4rem" height="2rem" />
            } @else {
              <span class="stat-valor">{{ statsAdmin()?.citasCanceladas ?? 0 }}</span>
              <span class="stat-label">Citas Canceladas</span>
              <span class="stat-sub">Total historico</span>
            }
          </div>
        </div>
      </div>

      <!-- Accesos rapidos -->
      <div class="section-header">
        <h3><i class="pi pi-bolt"></i> Accesos Rapidos</h3>
      </div>
      <div class="accesos-grid">
        <a routerLink="/pacientes/nuevo" class="acceso-card">
          <i class="pi pi-user-plus"></i><span>Nuevo Paciente</span>
        </a>
        <a routerLink="/citas" class="acceso-card">
          <i class="pi pi-calendar-plus"></i><span>Ver Agenda</span>
        </a>
        <a routerLink="/historias" class="acceso-card">
          <i class="pi pi-file-edit"></i><span>Historias Clinicas</span>
        </a>
        <a routerLink="/auditoria" class="acceso-card">
          <i class="pi pi-history"></i><span>Auditoria</span>
        </a>
        <a routerLink="/usuarios" class="acceso-card">
          <i class="pi pi-users"></i><span>Usuarios</span>
        </a>
        <a routerLink="/roles" class="acceso-card">
          <i class="pi pi-shield"></i><span>Roles</span>
        </a>
      </div>

      <!-- Agenda de hoy admin -->
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

      @if (cargandoCitas()) {
        <ng-container *ngTemplateOutlet="skeletonList" />
      } @else if (citasDeHoy().length === 0) {
        <div class="agenda-vacia">
          <div class="agenda-vacia-icon"><i class="pi pi-calendar-plus"></i></div>
          <h4>Sin citas para hoy</h4>
          <p>No hay citas programadas para el dia de hoy.</p>
        </div>
      } @else {
        <div class="agenda-list">
          @for (cita of citasDeHoy(); track cita.id) {
            <div class="agenda-card" [class]="'borde-' + getColorKey(cita)">
              <div class="agenda-hora">
                <span class="ah-ini">{{ fh(cita.horaInicio) }}</span>
                <span class="ah-fin">{{ fh(cita.horaFin) }}</span>
              </div>
              <div class="agenda-linea" [class]="'linea-' + getColorKey(cita)"></div>
              <div class="agenda-info">
                <span class="ai-nombre">{{ cita.pacienteNombreCompleto }}</span>
                <div class="ai-meta">
                  <span class="ai-tipo">
                    <i [class]="'pi ' + getTipoIcon(cita.tipoCita)"></i>
                    {{ getTipoLabel(cita.tipoCita) }}
                  </span>
                  @if (cita.motivoCita) {
                    <span class="ai-motivo">· {{ cita.motivoCita | slice:0:40 }}</span>
                  }
                </div>
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

    <!-- ══ MÉDICO ESPECIALISTA ════════════════════════════════════════════ -->
    @if (esMedico()) {

      <div class="cards-grid">
        <div class="stat-card azul" routerLink="/pacientes">
          <div class="stat-icon"><i class="pi pi-users"></i></div>
          <div class="stat-info">
            @if (cargandoStats()) { <p-skeleton width="4rem" height="2rem" />
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
            @if (cargandoStats()) { <p-skeleton width="4rem" height="2rem" />
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
            @if (cargandoStats()) { <p-skeleton width="4rem" height="2rem" />
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
            @if (cargandoStats()) { <p-skeleton width="4rem" height="2rem" />
            } @else {
              <span class="stat-valor">{{ statsMedico()?.consultasMes ?? 0 }}</span>
              <span class="stat-label">Consultas del Mes</span>
              <span class="stat-sub">Historias clinicas</span>
            }
          </div>
          <i class="pi pi-chevron-right stat-arrow"></i>
        </div>
      </div>

      <!-- Proximas citas 7 días -->
      <div class="section-header">
        <h3>
          <i class="pi pi-calendar-clock"></i> Proximas Citas — 7 dias
          @if (!cargandoCitas() && citasProximas().length > 0) {
            <span class="section-count">{{ citasProximas().length }} cita(s)</span>
          }
        </h3>
        <a routerLink="/citas">
          <p-button label="Ver Calendario" icon="pi pi-calendar-times"
                    [text]="true" severity="secondary" />
        </a>
      </div>

      @if (cargandoCitas()) {
        <ng-container *ngTemplateOutlet="skeletonMedico" />
      } @else if (citasProximas().length === 0) {
        <div class="agenda-vacia">
          <div class="agenda-vacia-icon"><i class="pi pi-calendar-plus"></i></div>
          <h4>Sin citas en los proximos 7 dias</h4>
          <p>No hay citas programadas para esta semana.</p>
          <a routerLink="/citas">
            <p-button label="Ir al Calendario" icon="pi pi-calendar"
                      styleClass="btn-pink" />
          </a>
        </div>
      } @else {
        <!-- Separador HOY -->
        @if (citasHoyMedico().length > 0) {
          <div class="grupo-titulo grupo-hoy">
            <i class="pi pi-circle-fill"></i>
            HOY — {{ citasHoyMedico().length }} cita(s) pendiente(s)
          </div>
        }

        <div class="agenda-list">
          @for (cita of citasProximas(); track cita.id) {

            @if (esPrimeraDespuesDeHoy(cita)) {
              <div class="grupo-titulo grupo-proximas">
                <i class="pi pi-circle-fill"></i> PROXIMOS DIAS
              </div>
            }

            <div class="agenda-card-medico" [class]="'borde-' + getColorKey(cita)">

              <!-- Semáforo -->
              <div class="semaforo" [class]="'sem-' + getColorKey(cita)">
                <i [class]="'pi ' + getSemaforoIcon(cita)"></i>
              </div>

              <!-- Fecha -->
              <div class="agenda-fecha">
                <span class="af-dia">{{ cita.fechaCita.split('-')[2] }}</span>
                <span class="af-mes">
                  {{ getMes(cita.fechaCita) }}
                </span>
                <span class="af-hora">{{ fh(cita.horaInicio) }}</span>
              </div>

              <div class="agenda-sep"></div>

              <!-- Info -->
              <div class="agenda-info">
                <span class="ai-nombre">{{ cita.pacienteNombreCompleto }}</span>
                <div class="ai-meta">
                  <span class="ai-tipo">
                    <i [class]="'pi ' + getTipoIcon(cita.tipoCita)"></i>
                    {{ getTipoLabel(cita.tipoCita) }}
                    · {{ cita.duracionMinutos }} min
                  </span>
                </div>
                @if (cita.motivoCita) {
                  <span class="ai-motivo">{{ cita.motivoCita | slice:0:55 }}</span>
                }
              </div>

              <!-- Acciones -->
              <div class="agenda-acciones-medico">
                <p-tag [value]="getEstadoLabel(cita.estado)"
                       [severity]="getEstadoSev(cita.estado)"
                       styleClass="tag-sm" />

                @if (esCitaDeHoy(cita) &&
                     (cita.estado==='PROGRAMADA' || cita.estado==='CONFIRMADA')) {
                  <p-button
                    label="Iniciar Consulta"
                    icon="pi pi-play"
                    styleClass="btn-iniciar"
                    [loading]="iniciandoId() === cita.id"
                    pTooltip="Iniciar consulta para este paciente"
                    tooltipPosition="top"
                    (onClick)="iniciarConsulta(cita)"
                  />
                } @else if (cita.estado==='PROGRAMADA' || cita.estado==='CONFIRMADA') {
                  <p-button icon="pi pi-eye" [rounded]="true" [text]="true"
                            severity="secondary"
                            pTooltip="Ver detalle" tooltipPosition="top"
                            (onClick)="verCita(cita)" />
                }
              </div>

            </div>
          }
        </div>
      }
    }

    <!-- ══ PACIENTE ═══════════════════════════════════════════════════════ -->
    @if (esPaciente()) {

      <div class="cards-grid">
        <div class="stat-card verde">
          <div class="stat-icon"><i class="pi pi-calendar-check"></i></div>
          <div class="stat-info">
            @if (cargandoCitas()) { <p-skeleton width="3rem" height="2rem" />
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
            @if (cargandoCitas()) { <p-skeleton width="3rem" height="2rem" />
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
            @if (cargandoCitas()) { <p-skeleton width="3rem" height="2rem" />
            } @else {
              <span class="stat-valor">{{ citasDeHoy().length }}</span>
              <span class="stat-label">Total Citas</span>
              <span class="stat-sub">Todas registradas</span>
            }
          </div>
        </div>
      </div>

      <div class="section-header">
        <h3><i class="pi pi-calendar"></i> Mis Citas Medicas</h3>
      </div>

      @if (cargandoCitas()) {
        <ng-container *ngTemplateOutlet="skeletonList" />
      } @else if (citasDeHoy().length === 0) {
        <div class="agenda-vacia">
          <div class="agenda-vacia-icon"><i class="pi pi-calendar"></i></div>
          <h4>No tienes citas registradas</h4>
          <p>Contacta al consultorio para agendar una cita.</p>
        </div>
      } @else {
        @if (citasPendientesFiltradas().length > 0) {
          <div class="grupo-titulo grupo-hoy">
            <i class="pi pi-clock"></i> PENDIENTES
          </div>
          <div class="agenda-list" style="margin-bottom:1rem">
            @for (cita of citasPendientesFiltradas(); track cita.id) {
              <div class="agenda-card-paciente borde-futuro">
                <div class="ap-fecha">
                  <span class="ap-dia">{{ cita.fechaCita.split('-')[2] }}</span>
                  <span class="ap-mes">
                    {{ getMes(cita.fechaCita) }}
                  </span>
                </div>
                <div class="ap-sep"></div>
                <div class="ap-info">
                  <span class="ap-tipo">{{ getTipoLabel(cita.tipoCita) }}</span>
                  <span class="ap-hora">
                    <i class="pi pi-clock"></i> {{ fh(cita.horaInicio) }}
                  </span>
                  @if (cita.motivoCita) {
                    <span class="ap-motivo">{{ cita.motivoCita | slice:0:50 }}</span>
                  }
                </div>
                <p-tag value="Pendiente" severity="info" />
              </div>
            }
          </div>
        }

        @if (citasAtendidasFiltradas().length > 0) {
          <div class="grupo-titulo grupo-proximas">
            <i class="pi pi-check-circle"></i> ATENDIDAS
          </div>
          <div class="agenda-list">
            @for (cita of citasAtendidasFiltradas(); track cita.id) {
              <div class="agenda-card-paciente borde-atendida">
                <div class="ap-fecha">
                  <span class="ap-dia">{{ cita.fechaCita.split('-')[2] }}</span>
                  <span class="ap-mes">
                    {{ getMes(cita.fechaCita) }}
                  </span>
                </div>
                <div class="ap-sep"></div>
                <div class="ap-info">
                  <span class="ap-tipo">{{ getTipoLabel(cita.tipoCita) }}</span>
                  <span class="ap-hora">
                    <i class="pi pi-clock"></i> {{ fh(cita.horaInicio) }}
                  </span>
                  @if (cita.motivoCita) {
                    <span class="ap-motivo">{{ cita.motivoCita | slice:0:50 }}</span>
                  }
                </div>
                <p-tag value="Atendida" severity="success" />
              </div>
            }
          </div>
        }
      }
    }

    <!-- ══ TEMPLATES SKELETON ════════════════════════════════════════════ -->
    <ng-template #skeletonList>
      <div class="agenda-skeleton">
        @for (i of [1,2,3]; track i) {
          <div class="agenda-sk-card">
            <p-skeleton width="50px" height="50px" borderRadius="10px" />
            <div style="flex:1; display:flex; flex-direction:column; gap:6px">
              <p-skeleton height="1rem" />
              <p-skeleton width="60%" height=".8rem" />
            </div>
          </div>
        }
      </div>
    </ng-template>

    <ng-template #skeletonMedico>
      <div class="agenda-skeleton">
        @for (i of [1,2,3]; track i) {
          <div class="agenda-sk-card">
            <p-skeleton width="36px" height="36px" borderRadius="50%" />
            <p-skeleton width="50px" height="50px" borderRadius="10px" />
            <div style="flex:1; display:flex; flex-direction:column; gap:6px">
              <p-skeleton height="1rem" />
              <p-skeleton width="50%" height=".8rem" />
            </div>
            <p-skeleton width="130px" height="2.2rem" borderRadius="8px" />
          </div>
        }
      </div>
    </ng-template>

    <!-- ══ DIÁLOGO CANCELAR ══════════════════════════════════════════════ -->
    <p-dialog [(visible)]="dialogCancelar" header="Cancelar Cita"
              [modal]="true" [style]="{width:'420px'}" [draggable]="false">
      <div class="campo-cancelar">
        <label>Motivo de cancelacion <span class="req">*</span></label>
        <textarea pInputTextarea [(ngModel)]="motivoCancelacion"
                  rows="3" class="w-full" placeholder="Indica el motivo...">
        </textarea>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="Volver" [text]="true" severity="secondary"
                  (onClick)="dialogCancelar=false" />
        <p-button label="Confirmar" icon="pi pi-ban" severity="danger"
                  [loading]="procesando()"
                  [disabled]="!motivoCancelacion.trim()"
                  (onClick)="ejecutarCancelar()" />
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    /* ── Bienvenida ──────────────────────────────────────────────────── */
    .bienvenida {
      display:flex; align-items:center; justify-content:space-between;
      background:linear-gradient(135deg,#0a2342 0%,#1a4a7a 100%);
      border-radius:18px; padding:1.5rem 2rem;
      margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;
    }
    .bienvenida-texto h2 { margin:0 0 4px; font-size:1.4rem; font-weight:700; color:white; }
    .nombre { color:#e91e8c; }
    .bienvenida-texto p  { margin:0; font-size:.85rem; color:rgba(255,255,255,.6); text-transform:capitalize; }
    .fecha-box {
      display:flex; flex-direction:column; align-items:center;
      background:rgba(255,255,255,.1); border-radius:12px;
      padding:.75rem 1.25rem; min-width:70px;
    }
    .fecha-dia { font-size:2rem; font-weight:800; color:white; line-height:1; }
    .fecha-mes { font-size:.75rem; font-weight:700; color:#e91e8c;
                 text-transform:uppercase; letter-spacing:1px; }

    /* ── Cards ───────────────────────────────────────────────────────── */
    .cards-grid {
      display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
      gap:1rem; margin-bottom:1.5rem;
    }
    .stat-card {
      display:flex; align-items:center; gap:1.2rem;
      background:white; border-radius:16px; padding:1.25rem 1.5rem;
      box-shadow:0 2px 12px rgba(0,0,0,.07); cursor:pointer;
      transition:transform .18s,box-shadow .18s; text-decoration:none;
      position:relative; overflow:hidden;
    }
    .stat-card::before { content:''; position:absolute; top:0; left:0; width:4px; height:100%; }
    .stat-card:hover   { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,.12); }
    .stat-card.azul::before    { background:#2563eb; }
    .stat-card.verde::before   { background:#16a34a; }
    .stat-card.naranja::before { background:#f97316; }
    .stat-card.morado::before  { background:#7c3aed; }
    .stat-card.teal::before    { background:#0fb8ad; }
    .stat-card.rojo::before    { background:#dc2626; }
    .stat-icon { width:52px; height:52px; border-radius:14px;
                 display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .stat-icon .pi { font-size:1.4rem; }
    .stat-card.azul    .stat-icon { background:#eff6ff; } .stat-card.azul    .stat-icon .pi { color:#2563eb; }
    .stat-card.verde   .stat-icon { background:#f0fdf4; } .stat-card.verde   .stat-icon .pi { color:#16a34a; }
    .stat-card.naranja .stat-icon { background:#fff7ed; } .stat-card.naranja .stat-icon .pi { color:#f97316; }
    .stat-card.morado  .stat-icon { background:#f5f3ff; } .stat-card.morado  .stat-icon .pi { color:#7c3aed; }
    .stat-card.teal    .stat-icon { background:#e0f7f6; } .stat-card.teal    .stat-icon .pi { color:#0fb8ad; }
    .stat-card.rojo    .stat-icon { background:#fef2f2; } .stat-card.rojo    .stat-icon .pi { color:#dc2626; }
    .stat-info { display:flex; flex-direction:column; flex:1; }
    .stat-valor { font-size:1.8rem; font-weight:800; color:#0a2342; line-height:1.1; }
    .stat-label { font-size:.85rem; font-weight:600; color:#334155; margin-top:2px; }
    .stat-sub   { font-size:.75rem; color:#94a3b8; }
    .stat-arrow { color:#cbd5e1; font-size:.9rem; }

    /* ── Sección headers ─────────────────────────────────────────────── */
    .section-header {
      display:flex; align-items:center; justify-content:space-between;
      margin-bottom:1rem; flex-wrap:wrap; gap:.5rem;
    }
    .section-header h3 {
      margin:0; font-size:1rem; font-weight:700; color:#0a2342;
      display:flex; align-items:center; gap:8px;
    }
    .section-header h3 .pi { color:#e91e8c; }
    .section-count {
      background:#fce4ec; color:#c2185b; font-size:.75rem; font-weight:700;
      padding:2px 10px; border-radius:20px; margin-left:8px;
    }

    /* ── Accesos rápidos ─────────────────────────────────────────────── */
    .accesos-grid {
      display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr));
      gap:.75rem; margin-bottom:1.5rem;
    }
    .acceso-card {
      display:flex; flex-direction:column; align-items:center; gap:.6rem;
      padding:1.2rem 1rem; background:white; border-radius:14px;
      border:1.5px solid #e2e8f0; text-decoration:none; color:#334155;
      font-size:.83rem; font-weight:600; transition:all .15s;
    }
    .acceso-card:hover {
      border-color:#e91e8c; color:#c2185b; background:#fce4ec;
      transform:translateY(-2px); box-shadow:0 4px 12px rgba(233,30,140,.15);
    }
    .acceso-card .pi { font-size:1.4rem; color:#e91e8c; }

    /* ── Skeleton ────────────────────────────────────────────────────── */
    .agenda-skeleton { display:flex; flex-direction:column; gap:.75rem; margin-bottom:1rem; }
    .agenda-sk-card {
      display:flex; align-items:center; gap:1rem;
      background:white; border-radius:14px; padding:1rem 1.25rem;
      box-shadow:0 2px 8px rgba(0,0,0,.06);
    }

    /* ── Vacío ───────────────────────────────────────────────────────── */
    .agenda-vacia {
      background:white; border-radius:16px; padding:3rem 2rem;
      text-align:center; box-shadow:0 2px 12px rgba(0,0,0,.06); margin-bottom:1rem;
    }
    .agenda-vacia-icon {
      width:70px; height:70px; border-radius:50%; background:#f1f5f9;
      display:flex; align-items:center; justify-content:center; margin:0 auto 1rem;
    }
    .agenda-vacia-icon .pi { font-size:1.8rem; color:#94a3b8; }
    .agenda-vacia h4 { margin:0 0 .5rem; color:#334155; }
    .agenda-vacia p  { margin:0 0 1.5rem; color:#94a3b8; font-size:.9rem; }

    /* ── Grupos ──────────────────────────────────────────────────────── */
    .grupo-titulo {
      display:flex; align-items:center; gap:8px;
      font-size:.75rem; font-weight:800; letter-spacing:1px;
      padding:.4rem 0; margin-bottom:.5rem;
    }
    .grupo-titulo .pi { font-size:.5rem; }
    .grupo-hoy     { color:#dc2626; }
    .grupo-proximas{ color:#64748b; }

    /* ── Lista agenda (admin) ────────────────────────────────────────── */
    .agenda-list { display:flex; flex-direction:column; gap:.75rem; margin-bottom:1.5rem; }
    .agenda-card {
      display:flex; align-items:center; gap:1rem;
      background:white; border-radius:14px; padding:1rem 1.25rem;
      box-shadow:0 2px 10px rgba(0,0,0,.06);
      border-left:5px solid #e2e8f0; transition:transform .15s;
    }
    .agenda-card:hover { transform:translateX(3px); }

    .borde-hoy      { border-left-color:#dc2626; }
    .borde-semana   { border-left-color:#f97316; }
    .borde-futuro   { border-left-color:#16a34a; }
    .borde-atendida { border-left-color:#6366f1; }
    .borde-cancelada{ border-left-color:#94a3b8; }
    .borde-noasistio{ border-left-color:#d97706; }

    .agenda-hora { display:flex; flex-direction:column; align-items:center; min-width:52px; flex-shrink:0; }
    .ah-ini { font-size:.95rem; font-weight:800; color:#0a2342; }
    .ah-fin { font-size:.72rem; color:#94a3b8; }

    .agenda-linea { width:3px; height:44px; border-radius:3px; flex-shrink:0; }
    .linea-hoy      { background:linear-gradient(180deg,#dc2626,#fca5a5); }
    .linea-semana   { background:linear-gradient(180deg,#f97316,#fed7aa); }
    .linea-futuro   { background:linear-gradient(180deg,#16a34a,#86efac); }
    .linea-atendida { background:linear-gradient(180deg,#6366f1,#a5b4fc); }
    .linea-cancelada{ background:#e2e8f0; }
    .linea-noasistio{ background:linear-gradient(180deg,#d97706,#fde68a); }

    .agenda-info { display:flex; flex-direction:column; gap:3px; flex:1; min-width:0; }
    .ai-nombre { font-size:.95rem; font-weight:700; color:#0a2342;
                 white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ai-meta   { display:flex; align-items:center; gap:6px; font-size:.78rem; color:#64748b; flex-wrap:wrap; }
    .ai-tipo   { display:flex; align-items:center; gap:4px; }
    .ai-tipo .pi { font-size:.7rem; color:#e91e8c; }
    .ai-motivo { color:#94a3b8; }
    .agenda-acciones { display:flex; align-items:center; gap:6px; flex-shrink:0; }

    /* ── Cards médico ────────────────────────────────────────────────── */
    .agenda-card-medico {
      display:flex; align-items:center; gap:1rem;
      background:white; border-radius:14px; padding:.9rem 1.25rem;
      box-shadow:0 2px 10px rgba(0,0,0,.06);
      border-left:5px solid #e2e8f0; transition:transform .15s, box-shadow .15s;
    }
    .agenda-card-medico:hover { transform:translateX(3px); box-shadow:0 6px 20px rgba(0,0,0,.1); }

    .semaforo {
      width:36px; height:36px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      flex-shrink:0; font-size:.9rem;
    }
    .sem-hoy      { background:#fee2e2; color:#dc2626; }
    .sem-semana   { background:#ffedd5; color:#f97316; }
    .sem-futuro   { background:#dcfce7; color:#16a34a; }
    .sem-atendida { background:#e0e7ff; color:#6366f1; }
    .sem-cancelada{ background:#f1f5f9; color:#94a3b8; }
    .sem-noasistio{ background:#fef3c7; color:#d97706; }

    .agenda-fecha {
      display:flex; flex-direction:column; align-items:center;
      min-width:48px; flex-shrink:0;
    }
    .af-dia  { font-size:1.4rem; font-weight:800; color:#0a2342; line-height:1; }
    .af-mes  { font-size:.65rem; font-weight:700; color:#94a3b8; text-transform:uppercase; }
    .af-hora { font-size:.78rem; font-weight:700; color:#e91e8c; margin-top:2px; }

    .agenda-sep { width:1px; height:44px; background:#f1f5f9; flex-shrink:0; }

    .agenda-acciones-medico {
      display:flex; flex-direction:column; align-items:flex-end;
      gap:6px; flex-shrink:0; min-width:140px;
    }

    :deep(.btn-iniciar) {
      background:linear-gradient(135deg,#e91e8c,#c2185b) !important;
      border-color:#c2185b !important; color:white !important;
      font-size:.8rem !important; padding:.45rem 1rem !important;
      border-radius:8px !important;
    }
    :deep(.btn-iniciar:hover) {
      background:linear-gradient(135deg,#c2185b,#ad1457) !important;
    }
    :deep(.btn-pink) {
      background:linear-gradient(135deg,#e91e8c,#c2185b) !important;
      border-color:#c2185b !important; color:white !important;
    }

    /* ── Cards paciente ──────────────────────────────────────────────── */
    .agenda-card-paciente {
      display:flex; align-items:center; gap:1rem;
      background:white; border-radius:12px; padding:.85rem 1.25rem;
      box-shadow:0 2px 8px rgba(0,0,0,.06); border-left:4px solid #e2e8f0;
    }
    .ap-fecha { display:flex; flex-direction:column; align-items:center; min-width:40px; flex-shrink:0; }
    .ap-dia   { font-size:1.2rem; font-weight:800; color:#0a2342; line-height:1; }
    .ap-mes   { font-size:.65rem; font-weight:700; color:#94a3b8; text-transform:uppercase; }
    .ap-sep   { width:1px; height:36px; background:#f1f5f9; flex-shrink:0; }
    .ap-info  { display:flex; flex-direction:column; gap:2px; flex:1; min-width:0; }
    .ap-tipo  { font-size:.88rem; font-weight:700; color:#0a2342; }
    .ap-hora  { font-size:.75rem; color:#e91e8c; display:flex; align-items:center; gap:4px; }
    .ap-hora .pi { font-size:.68rem; }
    .ap-motivo{ font-size:.75rem; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

    :deep(.tag-sm .p-tag) { font-size:.68rem !important; padding:2px 7px !important; }

    .campo-cancelar { display:flex; flex-direction:column; gap:6px; }
    .campo-cancelar label { font-size:.83rem; font-weight:600; color:#334155; }
    .req { color:#e91e8c; }
    :deep(textarea.p-inputtextarea) { border-radius:10px !important; resize:none; }
  `]
})
export class DashboardComponent implements OnInit {

  private router   = inject(Router);
  private auth     = inject(AuthService);
  private citaSvc  = inject(CitaMedicaService);
  private hSvc     = inject(HistoriaClinicaService);
  private dashSvc  = inject(DashboardService);
  private toast    = inject(MessageService);

  // ── Estado ────────────────────────────────────────────────────────────────
  cargandoStats = signal(false);
  cargandoCitas = signal(false);
  procesando    = signal(false);
  iniciandoId   = signal<number | null>(null);   // id de la cita que está cargando

  statsAdmin    = signal<StatsAdmin | null>(null);
  statsMedico   = signal<StatsMedico | null>(null);
  citasDeHoy    = signal<CitaResumen[]>([]);
  citasProximas = signal<CitaResumen[]>([]);

  dialogCancelar    = false;
  citaACancelar     = signal<CitaResumen | null>(null);
  motivoCancelacion = '';

  // ── Roles ─────────────────────────────────────────────────────────────────
  rolActual  = computed(() => this.auth.rolActual() ?? '');
  esAdmin    = computed(() =>
    this.rolActual().includes('SUPERADMINISTRADOR') ||
    this.rolActual().includes('ADMINISTRADOR')
  );
  esMedico   = computed(() => this.rolActual().includes('MEDICO_ESPECIALISTA'));
  esPaciente = computed(() => this.rolActual().includes('PACIENTE'));

  nombreUsuario = computed(() =>
    this.auth.nombreUsuario().split(' ')[0] ?? 'Usuario'
  );

  descripcionRol = computed(() => {
    const r = this.rolActual();
    if (r.includes('SUPERADMINISTRADOR')) return 'Super Administrador del Sistema';
    if (r.includes('ADMINISTRADOR'))      return 'Administrador del Consultorio';
    if (r.includes('MEDICO_ESPECIALISTA'))return 'Medico Especialista en Ginecologia y Obstetricia';
    if (r.includes('PACIENTE'))           return 'Paciente del Consultorio';
    return r;
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
    if (n <= 3)  return 'naranja';
    return 'rojo';
  });

  citasPendientesPaciente  = computed(() =>
    this.citasDeHoy().filter(c =>
      c.estado === 'PROGRAMADA' || c.estado === 'CONFIRMADA').length
  );
  citasAtendidasPaciente   = computed(() =>
    this.citasDeHoy().filter(c => c.estado === 'ATENDIDA').length
  );
  citasPendientesFiltradas = computed(() =>
    this.citasDeHoy().filter(c =>
      c.estado === 'PROGRAMADA' || c.estado === 'CONFIRMADA')
  );
  citasAtendidasFiltradas  = computed(() =>
    this.citasDeHoy().filter(c => c.estado === 'ATENDIDA')
  );
  citasHoyMedico = computed(() =>
    this.citasProximas().filter(c => this.esCitaDeHoy(c))
  );

  fechaHoy = computed(() => new Date().toLocaleDateString('es-EC', {
    weekday:'long', day:'numeric', month:'long', year:'numeric'
  }));
  diaHoy = computed(() => new Date().getDate().toString().padStart(2, '0'));
  mesHoy = computed(() =>
    new Date().toLocaleDateString('es-EC', { month:'short' }).toUpperCase()
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const rol = this.rolActual();
    if (rol.includes('SUPERADMINISTRADOR') || rol.includes('ADMINISTRADOR')) {
      this.cargarStatsAdmin();
      this.cargarCitasHoy();
    } else if (rol.includes('MEDICO_ESPECIALISTA')) {
      this.cargarStatsMedico();
      this.cargarCitasProximas7Dias();
    } else if (rol.includes('PACIENTE')) {
      this.cargarCitasHoy();
    }
  }

  // ── Carga de datos ────────────────────────────────────────────────────────
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
    this.dashSvc.citasHoy(50).subscribe({
      next: r => { this.citasDeHoy.set(r.data ?? []); this.cargandoCitas.set(false); },
      error: () => this.cargandoCitas.set(false)
    });
  }

  cargarCitasProximas7Dias(): void {
    this.cargandoCitas.set(true);

    // Fecha local sin conversión UTC (evita desfase Ecuador UTC-5)
    const fechaLocal = (offset: number): string => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      return `${d.getFullYear()}-`
        + `${String(d.getMonth() + 1).padStart(2, '0')}-`
        + `${String(d.getDate()).padStart(2, '0')}`;
    };

    // 7 observables en paralelo — forkJoin espera que TODOS completen
    const peticiones = Array.from({ length: 7 }, (_, i) =>
      this.citaSvc.porDia(fechaLocal(i))
    );

    forkJoin(peticiones).subscribe({
      next: resultados => {
        // Aplana y filtra solo activas
        const activas = resultados.flatMap(r =>
          (r.data ?? []).filter(
            (c: any) => c.estado === 'PROGRAMADA' || c.estado === 'CONFIRMADA'
          )
        );

        // Elimina duplicados por id
        const unicas = activas.filter(
          (c, i, arr) => arr.findIndex(x => x.id === c.id) === i
        );

        // Ordena por fecha + hora normalizada
        const ordenadas = unicas.sort((a, b) => {
          const fa = a.fechaCita + 'T' + this.fh(a.horaInicio);
          const fb = b.fechaCita + 'T' + this.fh(b.horaInicio);
          return fa.localeCompare(fb);
        });

        // UNA SOLA actualización del signal con todos los datos listos
        console.log('Primera cita completa:', JSON.stringify(ordenadas[0], null, 2));

        this.citasProximas.set(ordenadas);
        this.cargandoCitas.set(false);
      },
      error: () => this.cargandoCitas.set(false)
    });
  }

  // ── Iniciar consulta — navega directo al formulario ───────────────────────
  iniciarConsulta(cita: CitaResumen): void {
    this.iniciandoId.set(cita.id);

    this.hSvc.obtenerPorPaciente(cita.pacienteId).subscribe({
      next: r => {
        this.iniciandoId.set(null);
        const historiaId = r.data?.id;
        if (historiaId) {
          // Tiene historia → formulario de nueva consulta directamente
          this.router.navigate(['/historias/consultas/nueva'], {
            queryParams: { historiaId }
          });
        } else {
          // Sin historia → crear antecedentes primero
          this.router.navigate(['/historias/antecedentes'], {
            queryParams: { pacienteId: cita.pacienteId }
          });
        }
      },
      error: () => {
        this.iniciandoId.set(null);
        // Si 404 → el paciente no tiene historia aún
        this.router.navigate(['/historias/antecedentes'], {
          queryParams: { pacienteId: cita.pacienteId }
        });
      }
    });
  }

  verCita(cita: CitaResumen): void {
    this.router.navigate(['/citas', cita.id]);
  }

  ejecutarCancelar(): void {
    const cita = this.citaACancelar();
    if (!cita || !this.motivoCancelacion.trim()) return;
    this.procesando.set(true);
    this.citaSvc.cancelar(cita.id, { motivoCancelacion: this.motivoCancelacion })
      .subscribe({
        next: () => {
          this.toast.add({ severity:'warn', summary:'Cancelada',
            detail:'Cita cancelada' });
          this.dialogCancelar = false;
          this.cargarCitasProximas7Dias();
          this.cargarStatsMedico();
          this.procesando.set(false);
        },
        error: err => {
          this.toast.add({ severity:'error', summary:'Error',
            detail: err.error?.mensaje ?? 'No se pudo cancelar' });
          this.procesando.set(false);
        }
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Formatea horaInicio/horaFin que puede llegar como:
   * - string "HH:mm" o "HH:mm:ss"
   * - objeto LocalTime {hour, minute, second, nano}
   */
  fh(hora: any): string {
    if (!hora) return '--:--';
    if (typeof hora === 'string') return hora.substring(0, 5);
    if (typeof hora === 'object') {
      const h = hora.hour  ?? hora.hours  ?? 0;
      const m = hora.minute ?? hora.minutes ?? 0;
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    }
    return '--:--';
  }

  esCitaDeHoy(cita: CitaResumen): boolean {
    const d = new Date();
    const hoy = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return cita.fechaCita === hoy;
  }

  esPrimeraDespuesDeHoy(cita: CitaResumen): boolean {
    const d = new Date();
    const hoy = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (cita.fechaCita === hoy) return false;
    const idx = this.citasProximas().indexOf(cita);
    if (idx === 0) return true;
    return this.citasProximas()[idx - 1].fechaCita === hoy;
  }

  getColorKey(cita: CitaResumen): string {
    if (cita.estado === 'ATENDIDA')   return 'atendida';
    if (cita.estado === 'CANCELADA')  return 'cancelada';
    if (cita.estado === 'NO_ASISTIO') return 'noasistio';

    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const fc  = new Date(cita.fechaCita + 'T00:00:00'); fc.setHours(0,0,0,0);
    const diff = Math.floor((fc.getTime() - hoy.getTime()) / 86400000);
    if (diff <= 1) return 'hoy';
    if (diff <= 7) return 'semana';
    return 'futuro';
  }

  getSemaforoIcon(cita: CitaResumen): string {
    const m: Record<string,string> = {
      hoy:'pi-exclamation-circle', semana:'pi-clock',
      futuro:'pi-check-circle', atendida:'pi-check',
      cancelada:'pi-times', noasistio:'pi-user-minus'
    };
    return m[this.getColorKey(cita)] ?? 'pi-circle';
  }

  getEstadoLabel(e: EstadoCita): string {
    const m: Record<string,string> = {
      PROGRAMADA:'Programada', CONFIRMADA:'Confirmada',
      ATENDIDA:'Atendida', CANCELADA:'Cancelada', NO_ASISTIO:'No asistio'
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

  getTipoIcon(t: string): string {
    const m: Record<string,string> = {
      PRIMERA_VEZ:'pi-star', CONTROL:'pi-refresh',
      URGENCIA:'pi-exclamation-triangle', PRENATAL:'pi-heart-fill',
      POSTPARTO:'pi-heart', RESULTADO:'pi-file', OTRO:'pi-calendar'
    };
    return m[t] ?? 'pi-calendar';
  }

  getMes(fecha: string): string {
    if (!fecha) return '';
    const meses = ['ENE','FEB','MAR','ABR','MAY','JUN',
      'JUL','AGO','SEP','OCT','NOV','DIC'];
    const mes = parseInt(fecha.split('-')[1], 10) - 1;
    return meses[mes] ?? '';
  }
}
