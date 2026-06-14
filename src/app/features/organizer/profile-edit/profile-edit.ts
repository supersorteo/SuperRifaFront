import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrganizerService } from '../../../core/services/organizer.service';
import { OrganizerProfile } from '../../../core/models/organizer.models';

@Component({
  selector: 'app-profile-edit',
  imports: [FormsModule],
  template: `
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
      <div>
        <h2 class="fw-black mb-1">Mi perfil</h2>
        <p class="text-muted mb-0">Información pública de tu cuenta de organizador</p>
      </div>
    </div>

    @if (loading()) {
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
      </div>
    } @else if (profile()) {
      <div class="row g-4">

        <!-- Avatar -->
        <div class="col-12 col-md-4 col-lg-3">
          <div class="card border-0 shadow-sm text-center p-4">
            <div class="mb-3 d-flex justify-content-center">
              @if (profile()!.avatarUrl) {
                <img [src]="profile()!.avatarUrl" alt="Avatar"
                     class="rounded-circle object-fit-cover"
                     style="width:100px;height:100px;border:3px solid #e0e7ff">
              } @else {
                <div class="rounded-circle d-flex align-items-center justify-content-center fw-black text-white"
                     style="width:100px;height:100px;background:linear-gradient(135deg,#4f46e5,#7c3aed);font-size:2.5rem">
                  {{ (profile()!.fullName || '?').charAt(0).toUpperCase() }}
                </div>
              }
            </div>
            <div class="fw-bold mb-0">{{ profile()!.fullName }}</div>
            <div class="text-muted small mb-3">{{ profile()!.email }}</div>
            <label class="btn btn-outline-primary btn-sm rounded-3 w-100" [class.disabled]="avatarLoading()">
              @if (avatarLoading()) {
                <span class="spinner-border spinner-border-sm me-1"></span>Subiendo...
              } @else {
                <i class="bi bi-camera me-1"></i>Cambiar foto
              }
              <input type="file" accept="image/jpeg,image/png,image/webp" class="d-none"
                     (change)="onAvatarChange($event)" [disabled]="avatarLoading()">
            </label>
            <div class="text-muted mt-2" style="font-size:.7rem">JPG, PNG o WebP · máx. 2 MB</div>
          </div>
        </div>

        <!-- Form -->
        <div class="col-12 col-md-8 col-lg-9">
          <div class="card border-0 shadow-sm p-4">
            @if (saved()) {
              <div class="alert alert-success d-flex align-items-center gap-2 py-2 mb-4">
                <i class="bi bi-check-circle-fill"></i> Perfil actualizado correctamente
              </div>
            }
            @if (error()) {
              <div class="alert alert-danger d-flex align-items-center gap-2 py-2 mb-4">
                <i class="bi bi-exclamation-circle-fill"></i> {{ error() }}
              </div>
            }

            <form (ngSubmit)="save()" #form="ngForm">
              <div class="row g-3">
                <div class="col-12 col-sm-6">
                  <label class="form-label fw-semibold small">Nombre del negocio</label>
                  <input class="form-control" [(ngModel)]="fields.businessName" name="businessName"
                         maxlength="100" placeholder="Ej: Rifas Don Carlos">
                </div>
                <div class="col-12 col-sm-6">
                  <label class="form-label fw-semibold small">Teléfono de contacto</label>
                  <input class="form-control" [(ngModel)]="fields.phone" name="phone"
                         maxlength="20" placeholder="+54 11 1234-5678">
                </div>
                <div class="col-12">
                  <label class="form-label fw-semibold small">Descripción / Bio</label>
                  <textarea class="form-control" [(ngModel)]="fields.bio" name="bio"
                            rows="3" maxlength="1000"
                            placeholder="Contales a los participantes quién sos..."></textarea>
                  <div class="text-end text-muted mt-1" style="font-size:.72rem">
                    {{ (fields.bio || '').length }}/1000
                  </div>
                </div>
                <div class="col-12 col-sm-6">
                  <label class="form-label fw-semibold small">
                    <i class="bi bi-instagram me-1 text-danger"></i>Instagram
                  </label>
                  <div class="input-group">
                    <span class="input-group-text text-muted small">&#64;</span>
                    <input class="form-control" [(ngModel)]="fields.instagramHandle" name="instagram"
                           maxlength="50" placeholder="tu_usuario">
                  </div>
                </div>
                <div class="col-12 col-sm-6">
                  <label class="form-label fw-semibold small">
                    <i class="bi bi-whatsapp me-1 text-success"></i>WhatsApp
                  </label>
                  <input class="form-control" [(ngModel)]="fields.whatsappNumber" name="whatsapp"
                         maxlength="20" placeholder="+54 9 11 1234-5678">
                </div>
              </div>

              <div class="d-flex justify-content-end mt-4">
                <button type="submit" class="btn btn-gradient fw-semibold px-4 rounded-3"
                        [disabled]="saving()">
                  @if (saving()) {
                    <span class="spinner-border spinner-border-sm me-2"></span>Guardando...
                  } @else {
                    <i class="bi bi-check-lg me-1"></i>Guardar cambios
                  }
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    }
  `
})
export class ProfileEdit implements OnInit {
  private readonly orgService = inject(OrganizerService);

  protected readonly loading     = signal(true);
  protected readonly saving      = signal(false);
  protected readonly avatarLoading = signal(false);
  protected readonly saved       = signal(false);
  protected readonly error       = signal<string | null>(null);
  protected readonly profile     = signal<OrganizerProfile | null>(null);

  protected fields = {
    businessName: '',
    phone: '',
    bio: '',
    instagramHandle: '',
    whatsappNumber: '',
  };

  ngOnInit(): void {
    this.orgService.getProfile().subscribe({
      next: p => {
        this.profile.set(p);
        this.fields = {
          businessName: p.businessName ?? '',
          phone: p.phone ?? '',
          bio: p.bio ?? '',
          instagramHandle: p.instagramHandle ?? '',
          whatsappNumber: p.whatsappNumber ?? '',
        };
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected save(): void {
    this.saving.set(true);
    this.saved.set(false);
    this.error.set(null);
    this.orgService.updateProfile(this.fields).subscribe({
      next: p => {
        this.profile.set(p);
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('No se pudo guardar el perfil. Intentá nuevamente.');
      },
    });
  }

  protected onAvatarChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.avatarLoading.set(true);
    this.orgService.uploadAvatar(file).subscribe({
      next: p => { this.profile.set(p); this.avatarLoading.set(false); },
      error: () => {
        this.avatarLoading.set(false);
        this.error.set('No se pudo subir la imagen.');
      },
    });
  }
}
