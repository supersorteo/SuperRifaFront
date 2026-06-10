import { Component, inject, input, OnDestroy, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RaffleService } from '../../../core/services/raffle.service';

interface ImgPreview { file: File; url: string; }

@Component({
  selector: 'app-raffle-form-modal',
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    @if (open()) {
      <!-- Backdrop -->
      <div class="modal-backdrop fade show" (click)="onClose()" style="z-index:1050"></div>

      <!-- Modal dialog -->
      <div class="modal d-block"
           style="z-index:1055;overflow-x:hidden;overflow-y:auto"
           role="dialog" aria-modal="true" aria-labelledby="rfm-title">
        <div class="w-100 mx-auto px-2 px-md-3 animate-fade-up"
             style="max-width:980px;padding-top:1.5rem;padding-bottom:1.5rem">
          <div class="modal-content border-0 shadow rounded-4 overflow-hidden">

            <!-- ── Header gradient ── -->
            <div class="hero-gradient text-white px-4 py-4">
              <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-3">
                  <div class="rounded-3 d-flex align-items-center justify-content-center"
                       style="width:42px;height:42px;background:rgba(255,255,255,.15)">
                    <i class="bi bi-ticket-perforated-fill text-warning fs-5"></i>
                  </div>
                  <div>
                    <h4 class="fw-black mb-0" id="rfm-title">Nueva Rifa</h4>
                    <p class="mb-0 opacity-75 small">Completá los datos y publicá tu rifa</p>
                  </div>
                </div>
                <button class="btn btn-link text-white opacity-75 p-2"
                        (click)="onClose()" aria-label="Cerrar">
                  <i class="bi bi-x-lg fs-5"></i>
                </button>
              </div>
            </div>

            <!-- ── Error banner ── -->
            @if (error()) {
              <div class="alert alert-danger rounded-0 border-0 border-start border-danger border-4 mb-0 py-2 px-4 small d-flex align-items-center gap-2">
                <i class="bi bi-exclamation-triangle-fill flex-shrink-0"></i>{{ error() }}
              </div>
            }

            <!-- ── Body ── -->
            <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <div class="row g-0">

                <!-- ═══ Columna izquierda ═══ -->
                <div class="col-lg-7 p-4">

                  <!-- Información básica -->
                  <div class="d-flex align-items-center gap-2 mb-3">
                    <div class="rounded-2 d-flex align-items-center justify-content-center"
                         style="width:28px;height:28px;background:#ede9fe">
                      <i class="bi bi-info-circle-fill text-primary" style="font-size:.75rem"></i>
                    </div>
                    <span class="fw-bold small text-uppercase" style="letter-spacing:.07em;color:#64748b">Información básica</span>
                  </div>

                  <div class="form-floating mb-3">
                    <input id="rfm-title-field" type="text" class="form-control rounded-3"
                           formControlName="title" placeholder=" "
                           [class.is-invalid]="t('title') && form.get('title')?.invalid">
                    <label for="rfm-title-field">Título de la rifa *</label>
                    <div class="invalid-feedback">El título es requerido</div>
                  </div>

                  <div class="form-floating mb-4">
                    <textarea id="rfm-desc" class="form-control rounded-3"
                              formControlName="description"
                              placeholder=" " style="height:80px"></textarea>
                    <label for="rfm-desc">Descripción (opcional)</label>
                  </div>

                  <!-- Premio -->
                  <div class="d-flex align-items-center gap-2 mb-3">
                    <div class="rounded-2 d-flex align-items-center justify-content-center"
                         style="width:28px;height:28px;background:#fef9c3">
                      <i class="bi bi-trophy-fill" style="font-size:.75rem;color:#d97706"></i>
                    </div>
                    <span class="fw-bold small text-uppercase" style="letter-spacing:.07em;color:#64748b">Premio</span>
                  </div>

                  <div class="form-floating mb-3">
                    <input id="rfm-prize" type="text" class="form-control rounded-3"
                           formControlName="prizeName" placeholder=" "
                           [class.is-invalid]="t('prizeName') && form.get('prizeName')?.invalid">
                    <label for="rfm-prize">Nombre del premio *</label>
                    <div class="invalid-feedback">Requerido</div>
                  </div>

                  <div class="row g-3 mb-4">
                    <div class="col-sm-6">
                      <div class="form-floating">
                        <input id="rfm-prize-val" type="number" class="form-control rounded-3"
                               formControlName="prizeEstimatedValue" placeholder=" " min="0">
                        <label for="rfm-prize-val">Valor estimado (ARS)</label>
                      </div>
                    </div>
                    <div class="col-sm-6">
                      <div class="form-floating">
                        <input id="rfm-prize-short" type="text" class="form-control rounded-3"
                               formControlName="prizeDescription" placeholder=" ">
                        <label for="rfm-prize-short">Descripción breve</label>
                      </div>
                    </div>
                  </div>

                  <!-- Imágenes -->
                  <div class="d-flex align-items-center justify-content-between mb-3">
                    <div class="d-flex align-items-center gap-2">
                      <div class="rounded-2 d-flex align-items-center justify-content-center"
                           style="width:28px;height:28px;background:#ecfeff">
                        <i class="bi bi-images" style="font-size:.75rem;color:#0891b2"></i>
                      </div>
                      <span class="fw-bold small text-uppercase" style="letter-spacing:.07em;color:#64748b">Imágenes del premio</span>
                    </div>
                    <span class="badge rounded-pill"
                          [style.background]="previews().length >= 5 ? '#fef2f2' : '#ede9fe'"
                          [style.color]="previews().length >= 5 ? '#dc2626' : '#4f46e5'"
                          style="font-size:.7rem;font-weight:600">
                      {{ previews().length }}/5
                    </span>
                  </div>

                  <!-- Input file siempre presente en DOM (oculto) -->
                  <input #fileInput type="file" accept="image/*" multiple class="d-none"
                         (change)="onFilesSelected($event)">

                  <!-- Upload zone (visible solo cuando quedan slots) -->
                  @if (previews().length < 5) {
                    <div class="rounded-3 p-4 text-center mb-3 cursor-pointer"
                         style="border:2px dashed #c7d2fe;background:linear-gradient(135deg,#f5f3ff,#fdf4ff);transition:border-color .2s"
                         (click)="fileInput.click()"
                         (dragover)="$event.preventDefault()"
                         (drop)="onDrop($event)">
                      <div class="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3"
                           style="width:52px;height:52px;background:linear-gradient(135deg,#ede9fe,#fce7f3)">
                        <i class="bi bi-cloud-arrow-up fs-4 text-primary"></i>
                      </div>
                      <p class="fw-semibold mb-1 text-primary">Hacé clic o arrastrá imágenes aquí</p>
                      <p class="text-muted small mb-0">JPG, PNG, WebP · Máx 2 MB · Hasta 5 imágenes</p>
                    </div>
                  }

                  <!-- Image carousel + thumbnails -->
                  @if (previews().length > 0) {
                    <!-- Main preview -->
                    <div class="rounded-3 overflow-hidden position-relative mb-2"
                         style="height:200px;background:#0f172a">
                      <img [src]="previews()[activeImg()].url"
                           class="w-100 h-100" style="object-fit:contain"
                           [alt]="'Imagen ' + (activeImg() + 1)">

                      @if (previews().length > 1) {
                        <button type="button"
                                class="btn btn-sm position-absolute d-flex align-items-center justify-content-center rounded-circle"
                                style="top:50%;left:10px;transform:translateY(-50%);width:34px;height:34px;background:rgba(0,0,0,.6);color:#fff;border:none"
                                (click)="activeImg.update(i => i - 1)"
                                [disabled]="activeImg() === 0"
                                aria-label="Imagen anterior">
                          <i class="bi bi-chevron-left"></i>
                        </button>
                        <button type="button"
                                class="btn btn-sm position-absolute d-flex align-items-center justify-content-center rounded-circle"
                                style="top:50%;right:10px;transform:translateY(-50%);width:34px;height:34px;background:rgba(0,0,0,.6);color:#fff;border:none"
                                (click)="activeImg.update(i => i + 1)"
                                [disabled]="activeImg() === previews().length - 1"
                                aria-label="Imagen siguiente">
                          <i class="bi bi-chevron-right"></i>
                        </button>
                      }

                      <span class="badge position-absolute"
                            style="bottom:10px;right:10px;background:rgba(0,0,0,.7);font-size:.7rem">
                        {{ activeImg() + 1 }} / {{ previews().length }}
                      </span>
                    </div>

                    <!-- Thumbnails row -->
                    <div class="d-flex gap-2 flex-wrap mb-1">
                      @for (p of previews(); track $index) {
                        <div class="position-relative cursor-pointer"
                             style="width:56px;height:56px"
                             (click)="activeImg.set($index)">
                          <img [src]="p.url" class="w-100 h-100 rounded-2"
                               style="object-fit:cover;transition:outline .1s"
                               [style.outline]="activeImg() === $index ? '3px solid #4f46e5' : '2px solid #e2e8f0'"
                               [alt]="'Miniatura ' + ($index + 1)">
                          <button type="button"
                                  class="position-absolute d-flex align-items-center justify-content-center rounded-circle border-0"
                                  style="top:-7px;right:-7px;width:20px;height:20px;background:#ef4444;color:#fff;font-size:.6rem;cursor:pointer;padding:0"
                                  (click)="removeImage($index, $event)"
                                  [attr.aria-label]="'Eliminar imagen ' + ($index + 1)">
                            <i class="bi bi-x fw-bold"></i>
                          </button>
                        </div>
                      }
                      @if (previews().length < 5) {
                        <div class="d-flex align-items-center justify-content-center rounded-2 cursor-pointer"
                             style="width:56px;height:56px;border:2px dashed #c7d2fe;color:#a5b4fc"
                             (click)="fileInput.click()"
                             role="button" aria-label="Agregar imagen">
                          <i class="bi bi-plus fs-4"></i>
                        </div>
                      }
                    </div>
                  }

                </div><!-- /col-left -->

                <!-- ═══ Columna derecha ═══ -->
                <div class="col-lg-5 p-4" style="background:#f8fafc;border-left:1px solid #e2e8f0">

                  <div class="d-flex align-items-center gap-2 mb-3">
                    <div class="rounded-2 d-flex align-items-center justify-content-center"
                         style="width:28px;height:28px;background:#e0f2fe">
                      <i class="bi bi-sliders" style="font-size:.75rem;color:#0284c7"></i>
                    </div>
                    <span class="fw-bold small text-uppercase" style="letter-spacing:.07em;color:#64748b">Configuración</span>
                  </div>

                  <div class="row g-3 mb-3">
                    <div class="col-6">
                      <div class="form-floating">
                        <input id="rfm-nums" type="number" class="form-control rounded-3"
                               formControlName="totalNumbers" placeholder=" " min="2"
                               [class.is-invalid]="t('totalNumbers') && form.get('totalNumbers')?.invalid">
                        <label for="rfm-nums">Cantidad *</label>
                        <div class="invalid-feedback">Mín 2</div>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="form-floating">
                        <input id="rfm-price" type="number" class="form-control rounded-3"
                               formControlName="pricePerNumber" placeholder=" " min="1"
                               [class.is-invalid]="t('pricePerNumber') && form.get('pricePerNumber')?.invalid">
                        <label for="rfm-price">Precio $ *</label>
                        <div class="invalid-feedback">Mín $1</div>
                      </div>
                    </div>
                  </div>

                  <div class="form-floating mb-3">
                    <input id="rfm-date" type="datetime-local" class="form-control rounded-3"
                           formControlName="drawDateTime" placeholder=" ">
                    <label for="rfm-date">Fecha del sorteo</label>
                  </div>

                  <!-- Método: card radio buttons -->
                  <div class="mb-3">
                    <label class="form-label fw-medium small" style="color:#475569">Método de sorteo</label>
                    <div class="d-flex gap-2">
                      @for (opt of drawMethods; track opt.value) {
                        <label class="flex-fill cursor-pointer">
                          <input type="radio" class="d-none" formControlName="drawMethod" [value]="opt.value">
                          <div class="rounded-3 p-3 text-center border-2 border fw-semibold small"
                               style="transition:all .15s;cursor:pointer"
                               [style.background]="isDrawMethod(opt.value) ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : '#fff'"
                               [style.color]="isDrawMethod(opt.value) ? '#fff' : '#475569'"
                               [style.borderColor]="isDrawMethod(opt.value) ? '#4f46e5' : '#e2e8f0'">
                            <i [class]="'bi ' + opt.icon + ' d-block mb-1 fs-5'"></i>
                            <span>{{ opt.label }}</span>
                          </div>
                        </label>
                      }
                    </div>
                  </div>

                  <!-- Política: card radio buttons -->
                  <div class="mb-4">
                    <label class="form-label fw-medium small" style="color:#475569">¿Quiénes participan?</label>
                    <div class="d-flex flex-column gap-2">
                      @for (pol of drawPolicies; track pol.value) {
                        <label class="cursor-pointer">
                          <input type="radio" class="d-none" formControlName="drawPolicy" [value]="pol.value">
                          <div class="d-flex align-items-center gap-3 rounded-3 p-3 border-2 border"
                               style="transition:all .15s;cursor:pointer"
                               [style.background]="isDrawPolicy(pol.value) ? '#ede9fe' : '#fff'"
                               [style.borderColor]="isDrawPolicy(pol.value) ? '#4f46e5' : '#e2e8f0'">
                            <i [class]="'bi ' + pol.icon + ' fs-5'"
                               [style.color]="isDrawPolicy(pol.value) ? '#4f46e5' : '#94a3b8'"></i>
                            <div>
                              <div class="fw-semibold small" [style.color]="isDrawPolicy(pol.value) ? '#3730a3' : '#475569'">{{ pol.label }}</div>
                              <div class="small" style="color:#94a3b8;font-size:.72rem">{{ pol.hint }}</div>
                            </div>
                          </div>
                        </label>
                      }
                    </div>
                  </div>

                  <!-- Revenue summary -->
                  <div class="rounded-3 p-4" style="background:linear-gradient(135deg,#ede9fe,#fce7f3)">
                    <div class="d-flex align-items-center gap-2 mb-3">
                      <i class="bi bi-graph-up-arrow text-primary"></i>
                      <span class="fw-bold small">Resumen</span>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                      <span class="small text-muted">Números</span>
                      <span class="fw-semibold small">{{ form.get('totalNumbers')?.value ?? 0 }}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                      <span class="small text-muted">Precio</span>
                      <span class="fw-semibold small">$ {{ form.get('pricePerNumber')?.value ?? 0 | number }}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                      <span class="small text-muted">Imágenes</span>
                      <span class="fw-semibold small">{{ previews().length }} / 5</span>
                    </div>
                    <div class="border-top pt-3" style="border-color:rgba(79,70,229,.2)!important">
                      <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-semibold small">Recaudación potencial</span>
                        <span class="fw-black text-gradient" style="font-size:1.2rem">
                          $ {{ potentialRevenue() | number }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div><!-- /col-right -->

              </div><!-- /row -->
            </form>

            <!-- ── Footer ── -->
            <div class="d-flex justify-content-end align-items-center gap-3 px-4 py-3"
                 style="background:#f8fafc;border-top:1px solid #e2e8f0">
              <button type="button" class="btn btn-outline-secondary px-4 rounded-3"
                      (click)="onClose()">
                Cancelar
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

          </div><!-- /modal-content -->
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

  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly previews = signal<ImgPreview[]>([]);
  protected readonly activeImg = signal(0);

  protected readonly drawMethods = [
    { value: 'MANUAL',    icon: 'bi-hand-index',  label: 'Manual' },
    { value: 'AUTOMATIC', icon: 'bi-robot',        label: 'Auto' },
  ];
  protected readonly drawPolicies = [
    { value: 'PAID_ONLY',    icon: 'bi-cash-coin',    label: 'Solo pagados', hint: 'Solo números con pago confirmado' },
    { value: 'ALL_NUMBERS',  icon: 'bi-people-fill',   label: 'Todos',        hint: 'Pagados + reservados entran al sorteo' },
  ];

  protected readonly form = this.fb.group({
    title:               ['', Validators.required],
    description:         [''],
    totalNumbers:        [100, [Validators.required, Validators.min(2)]],
    pricePerNumber:      [1000, [Validators.required, Validators.min(1)]],
    drawDateTime:        [''],
    drawMethod:          ['MANUAL'],
    drawPolicy:          ['PAID_ONLY'],
    prizeName:           ['', Validators.required],
    prizeDescription:    [''],
    prizeEstimatedValue: [null as number | null],
  });

  protected t(field: string): boolean { return !!this.form.get(field)?.touched; }
  protected isDrawMethod(v: string): boolean { return this.form.get('drawMethod')?.value === v; }
  protected isDrawPolicy(v: string): boolean { return this.form.get('drawPolicy')?.value === v; }

  protected potentialRevenue(): number {
    return ((this.form.get('totalNumbers')?.value ?? 0) as number) *
           ((this.form.get('pricePerNumber')?.value ?? 0) as number);
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

  private addFiles(fileList: FileList): void {
    const remaining = 5 - this.previews().length;
    const toAdd = Array.from(fileList).slice(0, remaining).filter(f => {
      if (f.size > 2 * 1024 * 1024) { this.error.set(`"${f.name}" supera el límite de 2 MB`); return false; }
      if (!f.type.startsWith('image/')) return false;
      return true;
    });
    if (toAdd.length > 0) {
      this.previews.update(prev => [...prev, ...toAdd.map(file => ({ file, url: URL.createObjectURL(file) }))]);
      this.error.set('');
    }
  }

  protected removeImage(index: number, event: MouseEvent): void {
    event.stopPropagation();
    URL.revokeObjectURL(this.previews()[index].url);
    this.previews.update(list => list.filter((_, i) => i !== index));
    this.activeImg.update(i => Math.min(i, Math.max(0, this.previews().length - 1)));
  }

  protected onClose(): void {
    this.form.reset({ totalNumbers: 100, pricePerNumber: 1000, drawMethod: 'MANUAL', drawPolicy: 'PAID_ONLY' });
    this.revokeAll();
    this.error.set('');
    this.closed.emit();
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const raw = this.form.getRawValue();

    this.raffleService.create({
      title:               raw.title!,
      description:         raw.description || undefined,
      totalNumbers:        raw.totalNumbers!,
      pricePerNumber:      raw.pricePerNumber!,
      drawDateTime:        raw.drawDateTime || undefined,
      drawMethod:          raw.drawMethod as 'MANUAL' | 'AUTOMATIC',
      drawPolicy:          raw.drawPolicy as 'PAID_ONLY' | 'ALL_NUMBERS',
      prizeName:           raw.prizeName || undefined,
      prizeDescription:    raw.prizeDescription || undefined,
      prizeEstimatedValue: raw.prizeEstimatedValue ?? undefined,
    }).subscribe({
      next: raffle => {
        const files = this.previews().map(p => p.file);
        if (files.length > 0) {
          this.raffleService.uploadImages(raffle.id, files).subscribe({
            complete: () => { this.loading.set(false); this.onClose(); this.created.emit(); },
            error: () => { this.loading.set(false); this.onClose(); this.created.emit(); },
          });
        } else {
          this.loading.set(false);
          this.onClose();
          this.created.emit();
        }
      },
      error: (e: { message?: string }) => {
        this.error.set(e.message ?? 'Error al crear la rifa');
        this.loading.set(false);
      },
    });
  }

  private revokeAll(): void {
    this.previews().forEach(p => URL.revokeObjectURL(p.url));
    this.previews.set([]);
    this.activeImg.set(0);
  }

  ngOnDestroy(): void { this.revokeAll(); }
}
