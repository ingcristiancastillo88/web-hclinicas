import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule,
         AbstractControl, ValidationErrors } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule }  from 'primeng/password';
import { DropdownModule }  from 'primeng/dropdown';
import { ButtonModule }    from 'primeng/button';
import { ToastModule }     from 'primeng/toast';
import { CardModule }      from 'primeng/card';
import { DividerModule }   from 'primeng/divider';
import { FormsModule }     from '@angular/forms';
import { MessageService }  from 'primeng/api';
import { UsuarioService }  from '../../../core/services/usuario.service';

// ── Validador de cédula ecuatoriana (algoritmo módulo 10) ─────────────────
function validarCedulaEcuatoriana(control: AbstractControl): ValidationErrors | null {
  const cedula = control.value?.toString().trim() ?? '';
  if (!cedula) return null;
  if (!/^\d{10}$/.test(cedula)) return { cedulaInvalida: true };

  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return { cedulaInvalida: true };

  const digitos     = cedula.split('').map(Number);
  const verificador = digitos[9];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let val = digitos[i] * (i % 2 === 0 ? 2 : 1);
    if (val >= 10) val -= 9;
    suma += val;
  }

  const residuo  = suma % 10;
  const esperado = residuo === 0 ? 0 : 10 - residuo;
  return esperado === verificador ? null : { cedulaInvalida: true };
}

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterLink,
    InputTextModule, PasswordModule, DropdownModule,
    ButtonModule, ToastModule, CardModule, DividerModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <!-- Header -->
    <div class="page-header">
      <div class="page-title">
        <div class="page-icon">
          <i [class]="'pi ' + (esEdicion() ? 'pi-pencil' : 'pi-user-plus')"></i>
        </div>
        <div>
          <h2>{{ esEdicion() ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
          <p>{{ esEdicion()
                ? 'Actualiza los datos del usuario'
                : 'Completa el formulario para registrar un nuevo usuario' }}</p>
        </div>
      </div>
      <a routerLink="/usuarios">
        <p-button label="Volver" icon="pi pi-arrow-left"
                  [text]="true" severity="secondary" />
      </a>
    </div>

    <!-- Formulario -->
    <div class="form-card">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">

        <!-- Sección: Datos Personales -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="pi pi-user"></i> Datos Personales
          </h3>
          <div class="form-grid">

            <div class="field">
              <label>Nombres <span class="required">*</span></label>
              <input pInputText formControlName="nombres"
                     placeholder="Ingresa los nombres" class="w-full" />
              @if (isInvalid('nombres')) {
                <small class="error-msg">
                  <i class="pi pi-exclamation-circle"></i> {{ getError('nombres') }}
                </small>
              }
            </div>

            <div class="field">
              <label>Apellidos <span class="required">*</span></label>
              <input pInputText formControlName="apellidos"
                     placeholder="Ingresa los apellidos" class="w-full" />
              @if (isInvalid('apellidos')) {
                <small class="error-msg">
                  <i class="pi pi-exclamation-circle"></i> {{ getError('apellidos') }}
                </small>
              }
            </div>

            <!-- ── TIPO DE DOCUMENTO ── -->
            <div class="field">
              <label>Tipo de Documento</label>
              <p-dropdown
                formControlName="tipoDocumento"
                [options]="opTipoDocumento"
                optionLabel="label"
                optionValue="value"
                placeholder="Selecciona el tipo"
                styleClass="w-full"
                (onChange)="onTipoDocumentoCambio()"
                [disabled]="esEdicion()"
              />
            </div>

            <!-- ── NÚMERO DE DOCUMENTO ── -->
            <div class="field">
              <label>{{ labelDocumento() }}</label>
              <div class="doc-input-wrapper">
                <span class="doc-badge" [class]="'badge-' + tipoDocumentoActual()">
                  <i [class]="'pi ' + iconoDocumento()"></i>
                </span>
                <input pInputText
                       formControlName="cedula"
                       [placeholder]="placeholderDocumento()"
                       [maxlength]="tipoDocumentoActual() === 'CEDULA' ? 10 : 20"
                       class="w-full doc-input"
                       [readonly]="esEdicion()" />
              </div>
              @if (isInvalid('cedula')) {
                <small class="error-msg">
                  <i class="pi pi-exclamation-circle"></i> {{ getError('cedula') }}
                </small>
              }
              @if (esEdicion()) {
                <small class="hint-msg">
                  <i class="pi pi-lock"></i> El documento no puede modificarse
                </small>
              }
            </div>

            <div class="field">
              <label>Teléfono</label>
              <input pInputText formControlName="telefono"
                     placeholder="0991234567" class="w-full" />
            </div>

          </div>
        </div>

        <p-divider />

        <!-- Sección: Acceso al Sistema -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="pi pi-lock"></i> Acceso al Sistema
          </h3>
          <div class="form-grid">

            <div class="field">
              <label>Correo Electrónico <span class="required">*</span></label>
              <span class="p-input-icon-left w-full">
                <i class="pi pi-envelope"></i>
                <input pInputText type="email" formControlName="correo"
                       placeholder="usuario@clinica.com" class="w-full" />
              </span>
              @if (isInvalid('correo')) {
                <small class="error-msg">
                  <i class="pi pi-exclamation-circle"></i> {{ getError('correo') }}
                </small>
              }
            </div>

            <div class="field">
              <label>
                Contraseña
                @if (!esEdicion()) { <span class="required">*</span> }
                @if (esEdicion()) {
                  <small class="hint">(dejar en blanco para no cambiar)</small>
                }
              </label>
              <p-password
                formControlName="contrasena"
                [feedback]="true"
                [toggleMask]="true"
                styleClass="w-full"
                inputStyleClass="w-full"
                placeholder="Mínimo 8 caracteres"
              />
              @if (isInvalid('contrasena')) {
                <small class="error-msg">
                  <i class="pi pi-exclamation-circle"></i> {{ getError('contrasena') }}
                </small>
              }
            </div>

            <div class="field">
              <label>Rol <span class="required">*</span></label>
              <p-dropdown
                formControlName="rolId"
                [options]="roles()"
                optionLabel="label"
                optionValue="value"
                placeholder="Selecciona un rol"
                styleClass="w-full"
                [loading]="cargandoRoles()"
              />
              @if (isInvalid('rolId')) {
                <small class="error-msg">
                  <i class="pi pi-exclamation-circle"></i> El rol es obligatorio
                </small>
              }
            </div>

          </div>
        </div>

        <!-- Botones -->
        <div class="form-actions">
          <a routerLink="/usuarios">
            <p-button label="Cancelar" icon="pi pi-times"
                      severity="secondary" [outlined]="true" />
          </a>
          <p-button
            type="submit"
            [label]="esEdicion() ? 'Guardar Cambios' : 'Crear Usuario'"
            [icon]="esEdicion() ? 'pi pi-save' : 'pi pi-check'"
            [loading]="guardando()"
            [disabled]="form.invalid || guardando()"
            styleClass="btn-primary"
          />
        </div>

      </form>
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
      background: linear-gradient(135deg, #e91e8c, #c2185b);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
    }
    .page-icon .pi { font-size: 1.4rem; color: white; }
    .page-title h2 { margin: 0 0 2px; font-size: 1.4rem; font-weight: 700; color: #0a2342; }
    .page-title p  { margin: 0; color: #64748b; font-size: 0.85rem; }

    .form-card {
      background: white; border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.07);
    }

    .form-section { margin-bottom: 1.5rem; }

    .section-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 1rem; font-weight: 700; color: #0a2342;
      margin: 0 0 1.2rem;
    }
    .section-title .pi { color: #e91e8c; }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.2rem;
    }

    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 0.85rem; font-weight: 600; color: #0a2342; }

    .required { color: #e91e8c; }

    .hint {
      font-weight: 400; color: #94a3b8; font-size: 0.78rem;
    }
    .hint-msg {
      display: flex; align-items: center; gap: 4px;
      color: #94a3b8; font-size: 0.78rem;
    }

    .error-msg {
      display: flex; align-items: center; gap: 4px;
      color: #ef4444; font-size: 0.8rem;
    }

    /* Tipo de documento — input con badge */
    .doc-input-wrapper {
      display: flex; align-items: center;
      border: 1px solid #d1d5db; border-radius: 8px;
      overflow: hidden; transition: border-color .2s;
    }
    .doc-input-wrapper:focus-within {
      border-color: #e91e8c;
      box-shadow: 0 0 0 2px rgba(233,30,140,.12);
    }

    .doc-badge {
      display: flex; align-items: center; justify-content: center;
      width: 42px; height: 42px; flex-shrink: 0; font-size: .9rem;
    }
    .badge-CEDULA        { background: #fce4ec; color: #c2185b; }
    .badge-PASAPORTE     { background: #e3f2fd; color: #1565c0; }
    .badge-ID_EXTRANJERO { background: #e8f5e9; color: #2e7d32; }

    .doc-input {
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      flex: 1;
    }
    :deep(.doc-input.p-inputtext:enabled:focus) {
      box-shadow: none !important;
      border-color: transparent !important;
    }

    /* Botón primario rosado */
    :deep(.btn-primary) {
      background: linear-gradient(135deg, #e91e8c, #c2185b) !important;
      border-color: #c2185b !important;
    }
    :deep(.btn-primary:hover) {
      background: linear-gradient(135deg, #c2185b, #ad1457) !important;
    }

    .form-actions {
      display: flex; justify-content: flex-end; gap: 1rem;
      padding-top: 1.5rem; flex-wrap: wrap;
    }
  `]
})
export class UsuarioFormComponent implements OnInit {

  private fb             = inject(FormBuilder);
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private usuarioService = inject(UsuarioService);
  private toast          = inject(MessageService);

  esEdicion     = signal(false);
  guardando     = signal(false);
  cargandoRoles = signal(false);
  roles         = signal<{ label: string; value: number }[]>([]);
  usuarioId     = signal<number | null>(null);

  // ── Tipo documento actual ─────────────────────────────────────────────────
  tipoDocumentoActual = signal<string>('CEDULA');

  opTipoDocumento = [
    { label: 'Cédula de Ciudadanía',          value: 'CEDULA'        },
    { label: 'Pasaporte',                      value: 'PASAPORTE'     },
    { label: 'Identificación del Extranjero',  value: 'ID_EXTRANJERO' },
  ];

  // ── Formulario ────────────────────────────────────────────────────────────
  form: FormGroup = this.fb.group({
    nombres:        ['', [Validators.required, Validators.maxLength(100)]],
    apellidos:      ['', [Validators.required, Validators.maxLength(100)]],
    tipoDocumento:  ['CEDULA'],
    cedula:         ['', [validarCedulaEcuatoriana]],   // Inicia con validación cédula
    correo:         ['', [Validators.required, Validators.email]],
    contrasena:     ['', [Validators.minLength(8)]],
    telefono:       [''],
    rolId:          [null, Validators.required]
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.cargarRoles();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion.set(true);
      this.usuarioId.set(Number(id));
      this.form.get('cedula')?.disable();
      this.form.get('tipoDocumento')?.disable();
      this.cargarUsuario(Number(id));
    } else {
      this.form.get('contrasena')?.setValidators([
        Validators.required, Validators.minLength(8)
      ]);
      this.form.get('contrasena')?.updateValueAndValidity();
    }
  }

  // ── Cambio de tipo de documento ───────────────────────────────────────────
  onTipoDocumentoCambio(): void {
    const tipo = this.form.get('tipoDocumento')?.value ?? 'CEDULA';
    this.tipoDocumentoActual.set(tipo);

    const cedulaCtrl = this.form.get('cedula')!;
    cedulaCtrl.setValue('');

    if (tipo === 'CEDULA') {
      cedulaCtrl.setValidators([validarCedulaEcuatoriana]);
    } else {
      // Pasaporte e ID extranjero: sin validación especial
      cedulaCtrl.clearValidators();
    }
    cedulaCtrl.updateValueAndValidity();
  }

  // ── Helpers visuales ──────────────────────────────────────────────────────
  labelDocumento(): string {
    const m: Record<string, string> = {
      CEDULA:        'Cédula de Ciudadanía',
      PASAPORTE:     'Número de Pasaporte',
      ID_EXTRANJERO: 'Número de Identificación'
    };
    return m[this.tipoDocumentoActual()] ?? 'Número de Documento';
  }

  placeholderDocumento(): string {
    const m: Record<string, string> = {
      CEDULA:        '10 dígitos numéricos',
      PASAPORTE:     'Ej: A1234567',
      ID_EXTRANJERO: 'Número de identificación'
    };
    return m[this.tipoDocumentoActual()] ?? 'Ingresa el número';
  }

  iconoDocumento(): string {
    const m: Record<string, string> = {
      CEDULA:        'pi-id-card',
      PASAPORTE:     'pi-book',
      ID_EXTRANJERO: 'pi-globe'
    };
    return m[this.tipoDocumentoActual()] ?? 'pi-id-card';
  }

  // ── Carga de datos ────────────────────────────────────────────────────────
  cargarRoles(): void {
    this.cargandoRoles.set(true);
    this.usuarioService.getRoles().subscribe({
      next: res => {
        this.roles.set((res.data ?? []).map(r => ({
          label: this.getRolLabel(r.nombre),
          value: r.id
        })));
        this.cargandoRoles.set(false);
      },
      error: () => this.cargandoRoles.set(false)
    });
  }

  cargarUsuario(id: number): void {
    this.usuarioService.obtener(id).subscribe({
      next: res => {
        if (!res.data) return;
        const u = res.data;
        const tipo = u.tipoDocumento ?? 'CEDULA';
        this.tipoDocumentoActual.set(tipo);
        this.form.patchValue({
          nombres:       u.nombres,
          apellidos:     u.apellidos,
          tipoDocumento: tipo,
          cedula:        u.cedula,
          correo:        u.correo,
          telefono:      u.telefono,
        });
        this.usuarioService.getRoles().subscribe(rolesRes => {
          const rol = rolesRes.data?.find(r => r.nombre === u.rol);
          if (rol) this.form.patchValue({ rolId: rol.id });
        });
      },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'Error',
          detail: 'No se pudo cargar el usuario' });
        this.router.navigate(['/usuarios']);
      }
    });
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const value = this.form.getRawValue();

    if (this.esEdicion()) {
      const req: any = { ...value };
      if (!req.contrasena) delete req.contrasena;
      delete req.cedula;
      delete req.tipoDocumento;

      this.usuarioService.actualizar(this.usuarioId()!, req).subscribe({
        next: () => {
          this.toast.add({ severity: 'success', summary: 'Actualizado',
            detail: 'Usuario actualizado exitosamente' });
          setTimeout(() => this.router.navigate(['/usuarios']), 1000);
          this.guardando.set(false);
        },
        error: err => {
          this.toast.add({ severity: 'error', summary: 'Error',
            detail: err.error?.mensaje ?? 'No se pudo actualizar' });
          this.guardando.set(false);
        }
      });
    } else {
      this.usuarioService.crear(value).subscribe({
        next: () => {
          this.toast.add({ severity: 'success', summary: 'Creado',
            detail: 'Usuario creado exitosamente' });
          setTimeout(() => this.router.navigate(['/usuarios']), 1000);
          this.guardando.set(false);
        },
        error: err => {
          this.toast.add({ severity: 'error', summary: 'Error',
            detail: err.error?.mensaje ?? 'No se pudo crear el usuario' });
          this.guardando.set(false);
        }
      });
    }
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  getError(field: string): string {
    const ctrl = this.form.get(field);
    if (ctrl?.hasError('required'))      return 'Este campo es obligatorio';
    if (ctrl?.hasError('email'))         return 'Ingresa un correo válido';
    if (ctrl?.hasError('minlength'))
      return `Mínimo ${ctrl.errors?.['minlength']?.requiredLength} caracteres`;
    if (ctrl?.hasError('maxlength'))     return 'Superaste el límite de caracteres';
    if (ctrl?.hasError('cedulaInvalida'))
      return 'La cédula ecuatoriana ingresada no es válida';
    return '';
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
}