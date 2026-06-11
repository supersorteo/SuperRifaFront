import { Component, inject, input, OnDestroy, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RaffleService } from '../../../core/services/raffle.service';

interface ImgPreview { file: File; url: string; }
type RaffleModalStep = 'details' | 'prize';

@Component({
  selector: 'app-raffle-form-modal',
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    @if (open()) {
      <div class="modal-backdrop fade show" (click)="closeCurrentStep()" style="z-index:1050"></div>

      <div class="modal d-block"
           style="z-index:1055;overflow-x:hidden;overflow-y:auto"
           role="dialog" aria-modal="true" [attr.aria-labelledby]="step() === 'details' ? 'rfm-details-title' : 'rfm-prize-title'">
        <div class="w-100 mx-auto px-2 px-md-3 animate-fade-up"
             [style.maxWidth]="step() === 'details' ? '860px' : '980px'"
             style="padding-top:1.5rem;padding-bottom:1.5rem">

          @if (step() === 'details') {
            <div class="modal-content border-0 shadow rounded-4 overflow-hidden">
              <div class="hero-gradient text-white px-4 py-4">
                <div class="d-flex justify-content-between align-items-center gap-3">
                  <div class="d-flex align-items-center gap-3">
                    <div class="rounded-3 d-flex align-items-center justify-content-center"
                         style="width:44px;height:44px;background:rgba(255,255,255,.14)">
                      <i class="bi bi-ticket-perforated-fill text-warning fs-5"></i>
                    </div>
                    <div>
                      <div class="small text-uppercase opacity-75 fw-semibold" style="letter-spacing:.1em">Paso 1 de 2</div>
                      <h4 class="fw-black mb-0" id="rfm-details-title">Datos de la rifa</h4>
                      <p class="mb-0 opacity-75 small">Definí la información principal antes de cargar el premio.</p>
                    </div>
                  </div>
                  <button class="btn btn-link text-white opacity-75 p-2" (click)="resetAndClose()" aria-label="Cerrar">
                    <i class="bi bi-x-lg fs-5"></i>
                  </button>
                </div>
              </div>

              @if (error()) {
                <div class="alert alert-danger rounded-0 border-0 border-start border-danger border-4 mb-0 py-2 px-4 small d-flex align-items-center gap-2">
                  <i class="bi bi-exclamation-triangle-fill flex-shrink-0"></i>{{ error() }}
                </div>
              }

              <form [formGroup]="detailsForm" novalidate>
                <div class="p-4 p-lg-5">
                  <div class="row g-4">
                    <div class="col-lg-7">
                      <div class="form-floating mb-3">
                        <input id="rfm-title" type="text" class="form-control rounded-3"
                               formControlName="title" placeholder=" "
                               [class.is-invalid]="showInvalid(detailsForm, 'title')">
                        <label for="rfm-title">Nombre de la rifa *</label>
                        <div class="invalid-feedback">Este campo es obligatorio.</div>
                      </div>

                      <div class="form-floating mb-3">
                        <textarea id="rfm-description" class="form-control rounded-3"
                                  formControlName="description"
                                  placeholder=" " style="height:120px"></textarea>
                        <label for="rfm-description">Descripción</label>
                      </div>

                      <div class="rounded-4 p-4" style="background:linear-gradient(135deg,#fff7ed,#fffbeb);border:1px solid #fed7aa">
                        <div class="d-flex align-items-center gap-2 mb-2">
                          <i class="bi bi-info-circle-fill" style="color:#ea580c"></i>
                          <span class="fw-semibold" style="color:#9a3412">Sobre el sorteo</span>
                        </div>
                        <p class="small mb-0" style="color:#7c2d12">
                          La rifa se crea en modo manual y con participación de números pagados. La forma de ejecución se define al momento de lanzar el sorteo desde las acciones.
                        </p>
                      </div>
                    </div>

                    <div class="col-lg-5">
                      <div class="rounded-4 p-4 h-100" style="background:#f8fafc;border:1px solid #e2e8f0">
                        <div class="d-flex align-items-center gap-2 mb-3">
                          <div class="rounded-3 d-flex align-items-center justify-content-center"
                               style="width:34px;height:34px;background:#e0e7ff;color:#4338ca">
                            <i class="bi bi-sliders"></i>
                          </div>
                          <span class="fw-bold">Configuración</span>
                        </div>

                        <div class="form-floating mb-3">
                          <input id="rfm-totalNumbers" type="number" class="form-control rounded-3"
                                 formControlName="totalNumbers" placeholder=" " min="2"
                                 [class.is-invalid]="showInvalid(detailsForm, 'totalNumbers')">
                          <label for="rfm-totalNumbers">Cantidad de números / participantes *</label>
                          <div class="invalid-feedback">Debe ser al menos 2.</div>
                        </div>

                        <div class="form-floating mb-3">
                          <input id="rfm-price" type="number" class="form-control rounded-3"
                                 formControlName="pricePerNumber" placeholder=" " min="1"
                                 [class.is-invalid]="showInvalid(detailsForm, 'pricePerNumber')">
                          <label for="rfm-price">Precio por número *</label>
                          <div class="invalid-feedback">Debe ser mayor que 0.</div>
                        </div>

                        <div class="form-floating mb-4">
                          <input id="rfm-drawDateTime" type="datetime-local" class="form-control rounded-3"
                                 formControlName="drawDateTime" placeholder=" "
                                 [class.is-invalid]="showInvalid(detailsForm, 'drawDateTime')">
                          <label for="rfm-drawDateTime">Fecha de ejecución *</label>
                          <div class="invalid-feedback">Este campo es obligatorio.</div>
                        </div>

                        <div class="rounded-4 p-3" style="background:linear-gradient(135deg,#ede9fe,#fce7f3)">
                          <div class="small text-uppercase fw-semibold mb-2" style="letter-spacing:.08em;color:#6d28d9">Resumen</div>
                          <div class="d-flex justify-content-between small mb-1">
                            <span class="text-muted">Cantidad</span>
                            <span class="fw-semibold">{{ detailsForm.get('totalNumbers')?.value ?? 0 }}</span>
                          </div>
                          <div class="d-flex justify-content-between small mb-1">
                            <span class="text-muted">Precio</span>
                            <span class="fw-semibold">$ {{ detailsForm.get('pricePerNumber')?.value ?? 0 | number }}</span>
                          </div>
                          <div class="border-top pt-2 mt-2 d-flex justify-content-between align-items-center">
                            <span class="small fw-semibold">Recaudación potencial</span>
                            <span class="fw-black text-gradient">$ {{ potentialRevenue() | number }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>

              <div class="d-flex justify-content-between align-items-center gap-3 px-4 py-3"
                   style="background:#f8fafc;border-top:1px solid #e2e8f0">
                <button type="button" class="btn btn-outline-secondary px-4 rounded-3" (click)="resetAndClose()">
                  Cancelar
                </button>
                <button type="button" class="btn btn-gradient px-5 rounded-3 fw-semibold"
                        (click)="goToPrizeStep()">
                  Continuar al premio <i class="bi bi-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          }

          @if (step() === 'prize') {
            <div class="modal-content border-0 shadow rounded-4 overflow-hidden">
              <div class="hero-gradient text-white px-4 py-4">
                <div class="d-flex justify-content-between align-items-center gap-3">
                  <div class="d-flex align-items-center gap-3">
                    <div class="rounded-3 d-flex align-items-center justify-content-center"
                         style="width:44px;height:44px;background:rgba(255,255,255,.14)">
                      <i class="bi bi-trophy-fill text-warning fs-5"></i>
                    </div>
                    <div>
                      <div class="small text-uppercase opacity-75 fw-semibold" style="letter-spacing:.1em">Paso 2 de 2</div>
                      <h4 class="fw-black mb-0" id="rfm-prize-title">Premio e imágenes</h4>
                      <p class="mb-0 opacity-75 small">Completá el premio antes de crear la rifa.</p>
                    </div>
                  </div>
                  <button class="btn btn-link text-white opacity-75 p-2" (click)="backToDetails()" aria-label="Volver">
                    <i class="bi bi-arrow-left fs-5"></i>
                  </button>
                </div>
              </div>

              @if (error()) {
                <div class="alert alert-danger rounded-0 border-0 border-start border-danger border-4 mb-0 py-2 px-4 small d-flex align-items-center gap-2">
                  <i class="bi bi-exclamation-triangle-fill flex-shrink-0"></i>{{ error() }}
                </div>
              }

              <form [formGroup]="prizeForm" novalidate>
                <div class="row g-0">
                  <div class="col-lg-6 p-4 p-lg-5">
                    <div class="form-floating mb-3">
                      <input id="rfm-prizeName" type="text" class="form-control rounded-3"
                             formControlName="prizeName" placeholder=" "
                             [class.is-invalid]="showInvalid(prizeForm, 'prizeName')">
                      <label for="rfm-prizeName">Nombre del premio *</label>
                      <div class="invalid-feedback">Este campo es obligatorio.</div>
                    </div>

                    <div class="form-floating mb-3">
                      <textarea id="rfm-prizeDescription" class="form-control rounded-3"
                                formControlName="prizeDescription"
                                placeholder=" " style="height:110px"></textarea>
                      <label for="rfm-prizeDescription">Descripción del premio</label>
                    </div>

                    <div class="form-floating">
                      <input id="rfm-prizeValue" type="number" class="form-control rounded-3"
                             formControlName="prizeEstimatedValue" placeholder=" " min="0">
                      <label for="rfm-prizeValue">Valor estimado (opcional)</label>
                    </div>

                    <div class="rounded-4 p-4 mt-4" style="background:#f8fafc;border:1px solid #e2e8f0">
                      <div class="d-flex align-items-center gap-2 mb-2">
                        <i class="bi bi-lightbulb-fill text-warning"></i>
                        <span class="fw-semibold">Sobre el valor estimado</span>
                      </div>
                      <p class="small text-muted mb-0">
                        No afecta el sorteo ni el cobro. Solo sirve como dato comercial para mostrar cuánto vale el premio.
                      </p>
                    </div>
                  </div>

                  <div class="col-lg-6 p-4 p-lg-5" style="background:#f8fafc;border-left:1px solid #e2e8f0">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                      <div>
                        <div class="fw-bold">Imágenes del premio *</div>
                        <div class="small text-muted">Subí al menos una imagen para completar la publicación.</div>
                      </div>
                      <span class="badge rounded-pill"
                            [style.background]="previews().length === 0 ? '#fef2f2' : '#ede9fe'"
                            [style.color]="previews().length === 0 ? '#dc2626' : '#4f46e5'"
                            style="font-size:.72rem;font-weight:700">
                        {{ previews().length }}/5
                      </span>
                    </div>

                    <input #fileInput type="file" accept="image/*" multiple class="d-none"
                           (change)="onFilesSelected($event)">

                    @if (previews().length < 5) {
                      <div class="rounded-4 p-4 text-center mb-3 cursor-pointer"
                           style="border:2px dashed #c7d2fe;background:linear-gradient(135deg,#eff6ff,#fdf2f8)"
                           (click)="fileInput.click()"
                           (dragover)="$event.preventDefault()"
                           (drop)="onDrop($event)">
                        <div class="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3"
                             style="width:56px;height:56px;background:linear-gradient(135deg,#dbeafe,#fce7f3)">
                          <i class="bi bi-cloud-arrow-up fs-4 text-primary"></i>
                        </div>
                        <p class="fw-semibold mb-1 text-primary">Hacé click o arrastrá imágenes aquí</p>
                        <p class="text-muted small mb-0">JPG, PNG, WebP · Máx 2 MB · Hasta 5 imágenes</p>
                      </div>
                    }

                    @if (previews().length > 0) {
                      <div class="rounded-4 overflow-hidden position-relative mb-3"
                           style="height:260px;background:#0f172a">
                        <img [src]="previews()[activeImg()].url"
                             class="w-100 h-100" style="object-fit:contain"
                             [alt]="'Imagen ' + (activeImg() + 1)">

                        @if (previews().length > 1) {
                          <button type="button"
                                  class="btn btn-sm position-absolute d-flex align-items-center justify-content-center rounded-circle"
                                  style="top:50%;left:12px;transform:translateY(-50%);width:36px;height:36px;background:rgba(0,0,0,.55);color:#fff;border:none"
                                  (click)="prevPreview()"
                                  [disabled]="activeImg() === 0"
                                  aria-label="Imagen anterior">
                            <i class="bi bi-chevron-left"></i>
                          </button>
                          <button type="button"
                                  class="btn btn-sm position-absolute d-flex align-items-center justify-content-center rounded-circle"
                                  style="top:50%;right:12px;transform:translateY(-50%);width:36px;height:36px;background:rgba(0,0,0,.55);color:#fff;border:none"
                                  (click)="nextPreview()"
                                  [disabled]="activeImg() === previews().length - 1"
                                  aria-label="Imagen siguiente">
                            <i class="bi bi-chevron-right"></i>
                          </button>
                        }

                        <span class="badge position-absolute"
                              style="bottom:12px;right:12px;background:rgba(0,0,0,.7);font-size:.72rem">
                          {{ activeImg() + 1 }} / {{ previews().length }}
                        </span>
                      </div>

                      <div class="d-flex gap-2 flex-wrap">
                        @for (p of previews(); track $index) {
                          <div class="position-relative cursor-pointer" style="width:62px;height:62px"
                               (click)="activeImg.set($index)">
                            <img [src]="p.url" class="w-100 h-100 rounded-3"
                                 style="object-fit:cover"
                                 [style.outline]="activeImg() === $index ? '3px solid #4f46e5' : '2px solid #e2e8f0'"
                                 [alt]="'Miniatura ' + ($index + 1)">
                            <button type="button"
                                    class="position-absolute d-flex align-items-center justify-content-center rounded-circle border-0"
                                    style="top:-6px;right:-6px;width:22px;height:22px;background:#ef4444;color:#fff;font-size:.66rem;padding:0"
                                    (click)="removeImage($index, $event)"
                                    [attr.aria-label]="'Eliminar imagen ' + ($index + 1)">
                              <i class="bi bi-x fw-bold"></i>
                            </button>
                          </div>
                        }
                        @if (previews().length < 5) {
                          <div class="d-flex align-items-center justify-content-center rounded-3 cursor-pointer"
                               style="width:62px;height:62px;border:2px dashed #c7d2fe;color:#a5b4fc"
                               (click)="fileInput.click()"
                               role="button" aria-label="Agregar imagen">
                            <i class="bi bi-plus fs-4"></i>
                          </div>
                        }
                      </div>
                    }

                    @if (showImageError()) {
                      <div class="small text-danger mt-3">
                        <i class="bi bi-exclamation-circle-fill me-1"></i>Debés subir al menos una imagen.
                      </div>
                    }
                  </div>
                </div>
              </form>

              <div class="d-flex justify-content-between align-items-center gap-3 px-4 py-3"
                   style="background:#f8fafc;border-top:1px solid #e2e8f0">
                <button type="button" class="btn btn-outline-secondary px-4 rounded-3" (click)="backToDetails()">
                  <i class="bi bi-arrow-left me-2"></i>Volver
                </button>
                <button type="button" class="btn btn-gradient px-5 rounded-3 fw-semibold"
                        (click)="submit()" [disabled]="loading()">
                  @if (loading()) {
                    <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                    Creando...
                  } @else {
                    <i class="bi bi-check-circle-fill me-2"></i>Crear Rifa
                  }
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `
})
export class RaffleFormModal implements OnDestroy {
  readonly open = input.required<boolean>();
  readonly closed = output<void>();
  readonly created = output<void>();

  private readonly raffleService = inject(RaffleService);
  private readonly fb = inject(FormBuilder);

  protected readonly step = signal<RaffleModalStep>('details');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly previews = signal<ImgPreview[]>([]);
  protected readonly activeImg = signal(0);
  protected readonly imageTouched = signal(false);

  protected readonly detailsForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    totalNumbers: [100, [Validators.required, Validators.min(2)]],
    pricePerNumber: [1000, [Validators.required, Validators.min(1)]],
    drawDateTime: ['', Validators.required],
  });

  protected readonly prizeForm = this.fb.group({
    prizeName: ['', Validators.required],
    prizeDescription: [''],
    prizeEstimatedValue: [null as number | null],
  });

  protected showInvalid(form: ReturnType<FormBuilder['group']>, field: string): boolean {
    return !!form.get(field)?.touched && !!form.get(field)?.invalid;
  }

  protected potentialRevenue(): number {
    return ((this.detailsForm.get('totalNumbers')?.value ?? 0) as number) *
           ((this.detailsForm.get('pricePerNumber')?.value ?? 0) as number);
  }

  protected goToPrizeStep(): void {
    this.detailsForm.markAllAsTouched();
    if (this.detailsForm.invalid) return;
    this.error.set('');
    this.step.set('prize');
  }

  protected backToDetails(): void {
    this.error.set('');
    this.step.set('details');
  }

  protected closeCurrentStep(): void {
    if (this.step() === 'prize') {
      this.backToDetails();
      return;
    }
    this.resetAndClose();
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.addFiles(input.files);
    input.value = '';
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) this.addFiles(event.dataTransfer.files);
  }

  protected removeImage(index: number, event: MouseEvent): void {
    event.stopPropagation();
    URL.revokeObjectURL(this.previews()[index].url);
    this.previews.update(list => list.filter((_, i) => i !== index));
    const nextLength = this.previews().length;
    this.activeImg.update(i => Math.min(i, Math.max(0, nextLength - 1)));
  }

  protected prevPreview(): void {
    this.activeImg.update(i => Math.max(0, i - 1));
  }

  protected nextPreview(): void {
    this.activeImg.update(i => Math.min(this.previews().length - 1, i + 1));
  }

  protected showImageError(): boolean {
    return this.imageTouched() && this.previews().length === 0;
  }

  protected resetAndClose(): void {
    this.detailsForm.reset({
      title: '',
      description: '',
      totalNumbers: 100,
      pricePerNumber: 1000,
      drawDateTime: '',
    });
    this.prizeForm.reset({
      prizeName: '',
      prizeDescription: '',
      prizeEstimatedValue: null,
    });
    this.revokeAll();
    this.error.set('');
    this.step.set('details');
    this.imageTouched.set(false);
    this.closed.emit();
  }

  protected submit(): void {
    this.prizeForm.markAllAsTouched();
    this.imageTouched.set(true);

    if (this.detailsForm.invalid) {
      this.step.set('details');
      this.detailsForm.markAllAsTouched();
      return;
    }

    if (this.prizeForm.invalid || this.previews().length === 0) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const details = this.detailsForm.getRawValue();
    const prize = this.prizeForm.getRawValue();

    this.raffleService.create({
      title: details.title!,
      description: details.description || undefined,
      totalNumbers: details.totalNumbers!,
      pricePerNumber: details.pricePerNumber!,
      drawDateTime: details.drawDateTime || undefined,
      drawMethod: 'MANUAL',
      drawPolicy: 'PAID_ONLY',
      prizeName: prize.prizeName || undefined,
      prizeDescription: prize.prizeDescription || undefined,
      prizeEstimatedValue: prize.prizeEstimatedValue ?? undefined,
    }).subscribe({
      next: raffle => {
        const files = this.previews().map(p => p.file);
        this.raffleService.uploadImages(raffle.id, files).subscribe({
          complete: () => {
            this.loading.set(false);
            this.resetAndClose();
            this.created.emit();
          },
          error: () => {
            this.loading.set(false);
            this.resetAndClose();
            this.created.emit();
          },
        });
      },
      error: (e: { message?: string }) => {
        this.error.set(e.message ?? 'Error al crear la rifa');
        this.loading.set(false);
      },
    });
  }

  private addFiles(fileList: FileList): void {
    const remaining = 5 - this.previews().length;
    const toAdd = Array.from(fileList).slice(0, remaining).filter(file => {
      if (file.size > 2 * 1024 * 1024) {
        this.error.set(`"${file.name}" supera el límite de 2 MB`);
        return false;
      }
      if (!file.type.startsWith('image/')) return false;
      return true;
    });

    if (toAdd.length > 0) {
      this.previews.update(prev => [
        ...prev,
        ...toAdd.map(file => ({ file, url: URL.createObjectURL(file) }))
      ]);
      this.error.set('');
    }
  }

  private revokeAll(): void {
    this.previews().forEach(p => URL.revokeObjectURL(p.url));
    this.previews.set([]);
    this.activeImg.set(0);
  }

  ngOnDestroy(): void {
    this.revokeAll();
  }
}
