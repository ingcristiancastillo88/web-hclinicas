import { Component, inject, signal } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { Router }          from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient }      from '@angular/common/http';
import { MessageService }  from 'primeng/api';
import { ButtonModule }    from 'primeng/button';
import { PasswordModule }  from 'primeng/password';
import { ToastModule }     from 'primeng/toast';
import { DividerModule }   from 'primeng/divider';
import {environment} from '../../../../environments/environment';

/**
 * Pantalla de cambio de contraseña temporal.
 * Se muestra en el PRIMER LOGIN cuando el servidor indica passwordTemporal=true.
 * Tras el cambio exitoso redirige al login para que el usuario ingrese con la nueva.
 */
@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    ButtonModule, PasswordModule, ToastModule, DividerModule
  ],
  providers: [MessageService],
  template: `
    <p-toast position="top-right" />

    <div class="cp-wrapper">
      <div class="cp-card">

        <!-- Ícono y título -->
        <div class="cp-header">
          <div class="cp-icon">
            <i class="pi pi-lock"></i>
          </div>
          <h2>Cambiar contraseña</h2>
          <p>
            Tu cuenta tiene una <strong>contraseña temporal</strong>.
            Por seguridad debes establecer una contraseña personal
            antes de continuar.
          </p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">

          <!-- Contraseña actual (temporal) -->
          <div class="field">
            <label>Contraseña temporal (recibida por correo)</label>
            <p-password
              formControlName="passwordActual"
              placeholder="Ingresa tu contraseña temporal"
              [feedback]="false"
              [toggleMask]="true"
              styleClass="w-full"
              inputStyleClass="w-full"
            />
            @if (isInvalid('passwordActual')) {
              <small class="err">
                <i class="pi pi-exclamation-circle"></i> Obligatorio
              </small>
            }
          </div>

          <p-divider />

          <!-- Nueva contraseña -->
          <div class="field">
            <label>Nueva contraseña</label>
            <p-password
              formControlName="passwordNueva"
              placeholder="Mínimo 8 caracteres"
              [toggleMask]="true"
              styleClass="w-full"
              inputStyleClass="w-full"
              promptLabel="Ingresa tu nueva contraseña"
              weakLabel="Débil"
              mediumLabel="Regular"
              strongLabel="Segura"
            />
            @if (isInvalid('passwordNueva')) {
              <small class="err">
                <i class="pi pi-exclamation-circle"></i>
                {{ getError('passwordNueva') }}
              </small>
            }
          </div>

          <!-- Confirmar contraseña -->
          <div class="field">
            <label>Confirmar nueva contraseña</label>
            <p-password
              formControlName="confirmarPassword"
              placeholder="Repite tu nueva contraseña"
              [feedback]="false"
              [toggleMask]="true"
              styleClass="w-full"
              inputStyleClass="w-full"
            />
            @if (isInvalid('confirmarPassword')) {
              <small class="err">
                <i class="pi pi-exclamation-circle"></i>
                {{ getError('confirmarPassword') }}
              </small>
            }
            @if (form.hasError('noCoinciden') && form.get('confirmarPassword')?.touched) {
              <small class="err">
                <i class="pi pi-exclamation-circle"></i>
                Las contraseñas no coinciden
              </small>
            }
          </div>

          <!-- Requisitos -->
          <div class="requisitos">
            <div class="req-item" [class.ok]="form.get('passwordNueva')?.value?.length >= 8">
              <i class="pi" [class.pi-check-circle]="form.get('passwordNueva')?.value?.length >= 8"
                            [class.pi-circle]="!form.get('passwordNueva')?.value?.length || form.get('passwordNueva')?.value?.length < 8"></i>
              Mínimo 8 caracteres
            </div>
            <div class="req-item" [class.ok]="tieneNumero()">
              <i class="pi" [class.pi-check-circle]="tieneNumero()"
                            [class.pi-circle]="!tieneNumero()"></i>
              Al menos un número
            </div>
            <div class="req-item" [class.ok]="tieneMayuscula()">
              <i class="pi" [class.pi-check-circle]="tieneMayuscula()"
                            [class.pi-circle]="!tieneMayuscula()"></i>
              Al menos una mayúscula
            </div>
          </div>

          <!-- Botón -->
          <p-button
            type="submit"
            label="Establecer nueva contraseña"
            icon="pi pi-check"
            styleClass="w-full btn-primary"
            [loading]="guardando()"
            [disabled]="form.invalid || guardando()"
          />

        </form>

      </div>
    </div>
  `,
  styles: [`
    .cp-wrapper {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 2rem;
    }

    .cp-card {
      background: white; border-radius: 20px;
      padding: 2.5rem; max-width: 460px; width: 100%;
      box-shadow: 0 8px 32px rgba(0,0,0,.12);
      animation: slideUp .3s ease-out;
    }

    @keyframes slideUp {
      from { opacity:0; transform:translateY(16px); }
      to   { opacity:1; transform:translateY(0); }
    }

    .cp-header { text-align: center; margin-bottom: 2rem; }

    .cp-icon {
      width: 72px; height: 72px; border-radius: 20px; margin: 0 auto 1.2rem;
      background: linear-gradient(135deg, #e91e8c, #c2185b);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 20px rgba(233,30,140,.3);
    }

    .cp-icon .pi { font-size: 1.8rem; color: white; }

    .cp-header h2 { margin: 0 0 .75rem; font-size: 1.5rem; font-weight: 700; color: #0a2342; }
    .cp-header p  { margin: 0; color: #64748b; font-size: .9rem; line-height: 1.6; }
    .cp-header strong { color: #c2185b; }

    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 1.25rem; }
    .field label { font-size: .83rem; font-weight: 600; color: #334155; }
    :deep(.p-password) { width: 100%; }
    :deep(.p-password-input) { width: 100%; border-radius: 10px !important; }

    .err { display: flex; align-items: center; gap: 4px; color: #ef4444; font-size: .78rem; }

    /* Requisitos visuales */
    .requisitos {
      background: #f8fafc; border-radius: 12px;
      padding: .75rem 1rem; margin-bottom: 1.5rem;
      display: flex; flex-direction: column; gap: 6px;
    }

    .req-item {
      display: flex; align-items: center; gap: 8px;
      font-size: .8rem; color: #94a3b8;
      transition: color .2s;
    }

    .req-item.ok { color: #16a34a; }
    .req-item .pi { font-size: .9rem; }
    .req-item.ok .pi { color: #16a34a; }

    :deep(.btn-primary) {
      background: linear-gradient(135deg, #e91e8c, #c2185b) !important;
      border-color: #c2185b !important; color: white !important;
      border-radius: 10px !important; font-size: .95rem !important;
      font-weight: 600 !important; padding: .8rem !important;
    }
  `]
})
export class CambiarPasswordComponent {

  private fb     = inject(FormBuilder);
  private http   = inject(HttpClient);
  private router = inject(Router);
  private toast  = inject(MessageService);

  guardando = signal(false);

  form: FormGroup = this.fb.group({
    passwordActual:    ['', Validators.required],
    passwordNueva:     ['', [Validators.required, Validators.minLength(8)]],
    confirmarPassword: ['', Validators.required]
  }, { validators: this.passwordsCoinciden });

  private passwordsCoinciden(group: AbstractControl): ValidationErrors | null {
    const nueva     = group.get('passwordNueva')?.value;
    const confirmar = group.get('confirmarPassword')?.value;
    return nueva && confirmar && nueva !== confirmar
      ? { noCoinciden: true }
      : null;
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);

    const payload = {
      passwordActual:    this.form.value.passwordActual,
      passwordNueva:     this.form.value.passwordNueva,
      confirmarPassword: this.form.value.confirmarPassword
    };

    this.http.post(`${environment.apiUrl}/auth/cambiar-password`, payload)
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.toast.add({
            severity: 'success',
            summary: '¡Contraseña actualizada!',
            detail: 'Ahora puedes ingresar con tu nueva contraseña',
            life: 3500
          });
          // Limpiar token y redirigir al login
          localStorage.removeItem('token');
          sessionStorage.clear();
          setTimeout(() => this.router.navigate(['/auth/login']), 1500);
        },
        error: (err) => {
          this.guardando.set(false);
          this.toast.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.mensaje ?? 'No se pudo actualizar la contraseña',
            life: 4000
          });
        }
      });
  }

  // Requisitos visuales
  tieneNumero():    boolean { return /\d/.test(this.form.get('passwordNueva')?.value ?? ''); }
  tieneMayuscula(): boolean { return /[A-Z]/.test(this.form.get('passwordNueva')?.value ?? ''); }

  isInvalid(f: string): boolean {
    const c = this.form.get(f);
    return !!(c?.invalid && c?.touched);
  }

  getError(f: string): string {
    const c = this.form.get(f);
    if (c?.hasError('required'))  return 'Obligatorio';
    if (c?.hasError('minlength')) return 'Mínimo 8 caracteres';
    return '';
  }
}
