import { Component, inject, signal } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { Router }          from '@angular/router';
import { FormsModule }     from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule }    from 'primeng/button';
import { TableModule }     from 'primeng/table';
import { TagModule }       from 'primeng/tag';
import { ToastModule }     from 'primeng/toast';
import { AvatarModule }    from 'primeng/avatar';
import { TooltipModule }   from 'primeng/tooltip';
import { MessageService }  from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PacienteService } from '../../../core/services/paciente.service';
import { PacienteResumen } from '../../../core/models';

@Component({
  selector: 'app-historia-inicio',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    InputTextModule, ButtonModule, TableModule,
    TagModule, ToastModule, AvatarModule, TooltipModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <div class="page-header">
      <div class="page-title">
        <div class="page-icon"><i class="pi pi-file-edit"></i></div>
        <div>
          <h2>Historias Clínicas</h2>
          <p>Busca una paciente para acceder a su historia clínica</p>
        </div>
      </div>
    </div>

    <div class="search-card">
      <div class="search-inner">
        <i class="pi pi-search search-icon"></i>
        <input pInputText type="text"
               placeholder="Buscar por nombre, cédula o número de historia..."
               [(ngModel)]="busqueda" (ngModelChange)="onCambio($event)"
               class="search-input" autofocus />
        @if (busqueda) {
          <button class="clear-btn" (click)="limpiar()">
            <i class="pi pi-times"></i>
          </button>
        }
      </div>
      <p class="search-hint">
        <i class="pi pi-info-circle"></i>
        Ingresa al menos 2 caracteres — selecciona una paciente para ver su historia
      </p>
    </div>

    @if (busqueda.length >= 2) {
      <div class="table-container">
        <p-table [value]="pacientes()" [loading]="cargando()"
                 styleClass="p-datatable-gridlines"
                 [tableStyle]="{'min-width': '48rem'}" [rowHover]="true">

          <ng-template pTemplate="header">
            <tr>
              <th style="width:52px"></th>
              <th>Paciente</th>
              <th>Cédula</th>
              <th>N° Historia</th>
              <th>Edad</th>
              <th>Estado</th>
              <th style="width:140px;text-align:center">Acción</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-pac>
            <tr class="fila-pac" (click)="ir(pac)">
              <td>
                <p-avatar [label]="iniciales(pac)" shape="circle"
                  [style]="{ background:'#dbeafe', color:'#1e40af', fontWeight:'700' }" />
              </td>
              <td>
                <div class="pac-cell">
                  <span class="pac-nombre">{{ pac.nombreCompleto }}</span>
                  <span class="pac-sub">{{ pac.correo ?? '' }}</span>
                </div>
              </td>
              <td><code class="chip">{{ pac.cedula }}</code></td>
              <td>
                @if (pac.historiaNumero) {
                  <code class="chip historia">{{ pac.historiaNumero }}</code>
                } @else {
                  <span class="nd">Sin asignar</span>
                }
              </td>
              <td>
                @if (pac.edad != null) {
                  <span class="edad">{{ pac.edad }} años</span>
                } @else { — }
              </td>
              <td>
                <span class="estado" [class]="'est-'+pac.estado.toLowerCase()">
                  <i [class]="'pi '+(pac.estado==='ACTIVO'?'pi-check-circle':'pi-times-circle')"></i>
                  {{ pac.estado }}
                </span>
              </td>
              <td class="tc">
                <p-button icon="pi pi-file-edit" label="Ver Historia"
                          [text]="true" severity="info"
                          (onClick)="ir(pac); $event.stopPropagation()" />
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr><td colspan="7">
              <div class="empty">
                <i class="pi pi-search"></i>
                <p>Sin resultados para "<strong>{{ busqueda }}</strong>"</p>
                <small>Prueba con nombre completo, cédula o número de historia</small>
              </div>
            </td></tr>
          </ng-template>
        </p-table>
      </div>
    } @else {
      <div class="welcome">
        <div class="welcome-icon"><i class="pi pi-file-edit"></i></div>
        <h3>Busca una paciente para comenzar</h3>
        <p>Ingresa al menos 2 caracteres para ver los resultados disponibles.</p>
        <div class="tips">
          <div class="tip"><i class="pi pi-user"></i><span>Por nombre o apellido</span></div>
          <div class="tip"><i class="pi pi-id-card"></i><span>Por número de cédula</span></div>
          <div class="tip"><i class="pi pi-file"></i><span>Por número de historia</span></div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display:flex; align-items:center; margin-bottom:1.5rem; }
    .page-title  { display:flex; align-items:center; gap:1rem; }
    .page-icon   { width:52px; height:52px; background:linear-gradient(135deg,#0fb8ad,#2d7dd2); border-radius:14px; display:flex; align-items:center; justify-content:center; }
    .page-icon .pi { font-size:1.4rem; color:white; }
    .page-title h2 { margin:0 0 2px; font-size:1.4rem; font-weight:700; color:#0a2342; }
    .page-title p  { margin:0; color:#64748b; font-size:.85rem; }

    .search-card { background:white; border-radius:16px; padding:1.5rem 2rem; margin-bottom:1.2rem; box-shadow:0 2px 12px rgba(0,0,0,.07); }
    .search-inner { position:relative; display:flex; align-items:center; }
    .search-icon  { position:absolute; left:1rem; font-size:1.1rem; color:#94a3b8; z-index:1; }
    .search-input { width:100%; padding:.9rem 3rem !important; font-size:1rem !important; border-radius:12px !important; border:2px solid #e2e8f0 !important; transition:border-color .2s,box-shadow .2s !important; }
    .search-input:focus { border-color:#0fb8ad !important; box-shadow:0 0 0 3px rgba(15,184,173,.15) !important; }
    .clear-btn { position:absolute; right:1rem; background:none; border:none; cursor:pointer; color:#94a3b8; padding:4px; border-radius:6px; display:flex; align-items:center; }
    .clear-btn:hover { color:#ef4444; background:#fee2e2; }
    .search-hint { margin:.8rem 0 0; font-size:.8rem; color:#94a3b8; display:flex; align-items:center; gap:5px; }

    .table-container { background:white; border-radius:16px; box-shadow:0 2px 12px rgba(0,0,0,.06); overflow:hidden; }
    .fila-pac { cursor:pointer; }
    .pac-cell { display:flex; flex-direction:column; }
    .pac-nombre { font-weight:600; color:#0a2342; font-size:.9rem; }
    .pac-sub    { font-size:.75rem; color:#94a3b8; }
    .chip { background:#f1f5f9; padding:2px 8px; border-radius:6px; font-size:.8rem; font-family:monospace; color:#0a2342; }
    .chip.historia { background:#ede9fe; color:#5b21b6; }
    .nd   { font-size:.8rem; color:#cbd5e1; }
    .edad { background:#f0fdf4; color:#166534; padding:3px 10px; border-radius:20px; font-size:.78rem; font-weight:600; }
    .estado { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:20px; font-size:.78rem; font-weight:600; }
    .est-activo   { background:#dcfce7; color:#166534; }
    .est-inactivo { background:#fef3c7; color:#92400e; }
    .tc { text-align:center; }
    .empty { display:flex; flex-direction:column; align-items:center; padding:2.5rem; color:#94a3b8; }
    .empty .pi { font-size:2.5rem; margin-bottom:1rem; }
    .empty p { margin:0 0 4px; font-weight:600; color:#64748b; }
    .empty small { font-size:.83rem; }

    .welcome { background:white; border-radius:16px; padding:3.5rem 2rem; text-align:center; box-shadow:0 2px 12px rgba(0,0,0,.06); }
    .welcome-icon { width:80px; height:80px; border-radius:50%; background:linear-gradient(135deg,#e0f7f6,#dbeafe); display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem; }
    .welcome-icon .pi { font-size:2rem; color:#0fb8ad; }
    .welcome h3 { margin:0 0 .75rem; font-size:1.2rem; font-weight:700; color:#0a2342; }
    .welcome p  { margin:0 0 2rem; color:#64748b; font-size:.9rem; max-width:400px; margin-inline:auto; line-height:1.7; }
    .tips { display:flex; justify-content:center; gap:1rem; flex-wrap:wrap; }
    .tip  { display:flex; align-items:center; gap:8px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 16px; font-size:.83rem; color:#475569; font-weight:500; }
    .tip .pi { color:#0fb8ad; }
  `]
})
export class HistoriaInicioComponent {

  private pacienteService = inject(PacienteService);
  private router          = inject(Router);
  private toast           = inject(MessageService);
  private busqueda$       = new Subject<string>();

  pacientes = signal<PacienteResumen[]>([]);
  cargando  = signal(false);
  busqueda  = '';

  constructor() {
    this.busqueda$.pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(t => t.length >= 2 ? this.buscar(t) : this.pacientes.set([]));
  }

  onCambio(t: string): void { this.busqueda$.next(t); }

  buscar(termino: string): void {
    this.cargando.set(true);
    this.pacienteService.listar(termino, 0, 20, false).subscribe({
      next: r => { this.pacientes.set(r.data?.contenido ?? []); this.cargando.set(false); },
      error: () => {
        this.toast.add({ severity:'error', summary:'Error', detail:'No se pudo buscar' });
        this.cargando.set(false);
      }
    });
  }

  ir(pac: PacienteResumen): void { this.router.navigate(['/historias/paciente', pac.id]); }

  limpiar(): void { this.busqueda = ''; this.pacientes.set([]); }

  iniciales(pac: PacienteResumen): string {
    return pac.nombreCompleto.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
  }
}