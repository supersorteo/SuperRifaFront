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
      <!-- Backdrop -->
      <div class="rfm-backdrop" (click)="closeCurrentStep()"></div>

      <!-- Modal shell -->
      <div class="rfm-shell" role="dialog" aria-modal="true"
           [attr.aria-labelledby]="step() === 'details' ? 'rfm-title-1' : 'rfm-title-2'">
        <div class="rfm-dialog"
             [style.maxWidth]="step() === 'prize' ? '920px' : '820px'">

          <!-- ── Step progress header ────────────────────── -->
          <div class="rfm-header">
            <div class="rfm-header__brand">
              <div class="rfm-header__icon">
                <i [class]="step() === 'details' ? 'bi bi-ticket-perforated-fill' : 'bi bi-trophy-fill'"></i>
              </div>
              <div>
                <div class="rfm-header__step">
                  Paso {{ step() === 'details' ? '1' : '2' }} de 2
                </div>
                <h4 class="rfm-header__title"
                    [id]="step() === 'details' ? 'rfm-title-1' : 'rfm-title-2'">
                  {{ step() === 'details' ? 'Datos de la rifa' : 'Premio e imágenes' }}
                </h4>
              </div>
            </div>

            <!-- Step pills -->
            <div class="rfm-steps">
              <div class="rfm-step" [class.rfm-step--done]="step() === 'prize'" [class.rfm-step--active]="step() === 'details'">
                <div class="rfm-step__circle">
                  @if (step() === 'prize') { <i class="bi bi-check2"></i> } @else { 1 }
                </div>
                <span>Datos</span>
              </div>
              <div class="rfm-steps__line" [class.rfm-steps__line--done]="step() === 'prize'"></div>
              <div class="rfm-step" [class.rfm-step--active]="step() === 'prize'">
                <div class="rfm-step__circle">2</div>
                <span>Premio</span>
              </div>
            </div>

            <button class="rfm-header__close"
                    (click)="step() === 'prize' ? backToDetails() : resetAndClose()"
                    [attr.aria-label]="step() === 'prize' ? 'Volver' : 'Cerrar'">
              <i [class]="step() === 'prize' ? 'bi bi-arrow-left' : 'bi bi-x-lg'"></i>
            </button>
          </div>

          <!-- ── Error banner ────────────────────────────── -->
          @if (error()) {
            <div class="rfm-error">
              <i class="bi bi-exclamation-triangle-fill"></i>
              {{ error() }}
            </div>
          }

          <!-- ══════ STEP 1: Details ═══════════════════════ -->
          @if (step() === 'details') {
            <form [formGroup]="detailsForm" novalidate>
              <div class="rfm-body">
                <div class="row g-4">

                  <!-- Left: title + description + info -->
                  <div class="col-lg-7">
                    <div class="rfm-section">
                      <label class="rfm-label" for="rfm-title">
                        <i class="bi bi-cursor-text"></i>Nombre de la rifa
                      </label>
                      <input id="rfm-title" type="text" class="rfm-input"
                             formControlName="title" placeholder="Ej: Rifa del auto 0km"
                             [class.rfm-input--error]="showInvalid(detailsForm, 'title')">
                      @if (showInvalid(detailsForm, 'title')) {
                        <div class="rfm-field-error">Este campo es obligatorio.</div>
                      }
                    </div>

                    <div class="rfm-section">
                      <label class="rfm-label" for="rfm-description">
                        <i class="bi bi-text-paragraph"></i>Descripción
                        <span class="rfm-label__opt">opcional</span>
                      </label>
                      <textarea id="rfm-description" class="rfm-input rfm-textarea"
                                formControlName="description"
                                placeholder="Describí los detalles de la rifa..."></textarea>
                    </div>

                    <div class="rfm-info-box">
                      <div class="rfm-info-box__icon">
                        <i class="bi bi-info-circle-fill"></i>
                      </div>
                      <p class="rfm-info-box__text">
                        La rifa se crea en modo borrador. Podés publicarla cuando quieras desde las acciones del listado.
                      </p>
                    </div>
                  </div>

                  <!-- Right: config + summary -->
                  <div class="col-lg-5">
                    <div class="rfm-config-card">
                      <div class="rfm-config-card__header">
                        <i class="bi bi-sliders"></i>
                        <span>Configuración</span>
                      </div>

                      <div class="rfm-section">
                        <label class="rfm-label" for="rfm-totalNumbers">
                          <i class="bi bi-grid-3x3-gap-fill"></i>Cantidad de números
                        </label>
                        <input id="rfm-totalNumbers" type="number" class="rfm-input"
                               formControlName="totalNumbers" placeholder="100" min="2"
                               [class.rfm-input--error]="showInvalid(detailsForm, 'totalNumbers')">
                        @if (showInvalid(detailsForm, 'totalNumbers')) {
                          <div class="rfm-field-error">Debe ser al menos 2.</div>
                        }
                      </div>

                      <div class="rfm-section">
                        <label class="rfm-label" for="rfm-price">
                          <i class="bi bi-currency-dollar"></i>Precio por número
                        </label>
                        <input id="rfm-price" type="number" class="rfm-input"
                               formControlName="pricePerNumber" placeholder="1000" min="1"
                               [class.rfm-input--error]="showInvalid(detailsForm, 'pricePerNumber')">
                        @if (showInvalid(detailsForm, 'pricePerNumber')) {
                          <div class="rfm-field-error">Debe ser mayor que 0.</div>
                        }
                      </div>

                      <div class="rfm-section">
                        <label class="rfm-label" for="rfm-drawDateTime">
                          <i class="bi bi-calendar-event"></i>Fecha de sorteo
                        </label>
                        <input id="rfm-drawDateTime" type="datetime-local" class="rfm-input"
                               formControlName="drawDateTime" placeholder=" "
                               [class.rfm-input--error]="showInvalid(detailsForm, 'drawDateTime')">
                        @if (showInvalid(detailsForm, 'drawDateTime')) {
                          <div class="rfm-field-error">Este campo es obligatorio.</div>
                        }
                      </div>

                      <!-- Live summary -->
                      <div class="rfm-summary">
                        <div class="rfm-summary__row">
                          <span>Números</span>
                          <strong>{{ detailsForm.get('totalNumbers')?.value ?? 0 }}</strong>
                        </div>
                        <div class="rfm-summary__row">
                          <span>Precio c/u</span>
                          <strong>$ {{ detailsForm.get('pricePerNumber')?.value ?? 0 | number }}</strong>
                        </div>
                        <div class="rfm-summary__total">
                          <span>Recaudación potencial</span>
                          <strong class="rfm-summary__amount">$ {{ potentialRevenue() | number }}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </form>

            <div class="rfm-footer">
              <button type="button" class="rfm-btn rfm-btn--ghost" (click)="resetAndClose()">
                Cancelar
              </button>
              <button type="button" class="rfm-btn rfm-btn--primary" (click)="goToPrizeStep()">
                Continuar al premio <i class="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          }

          <!-- ══════ STEP 2: Prize & images ═══════════════ -->
          @if (step() === 'prize') {
            <form [formGroup]="prizeForm" novalidate>
              <div class="rfm-body rfm-body--split">

                <!-- Prize data -->
                <div class="rfm-prize-col">
                  <div class="rfm-prize-col__label">
                    <i class="bi bi-trophy-fill"></i>Premio
                  </div>

                  <div class="rfm-section">
                    <label class="rfm-label" for="rfm-prizeName">
                      <i class="bi bi-stars"></i>Nombre del premio
                    </label>
                    <input id="rfm-prizeName" type="text" class="rfm-input"
                           formControlName="prizeName" placeholder="Ej: Samsung 65 pulgadas"
                           [class.rfm-input--error]="showInvalid(prizeForm, 'prizeName')">
                    @if (showInvalid(prizeForm, 'prizeName')) {
                      <div class="rfm-field-error">Este campo es obligatorio.</div>
                    }
                  </div>

                  <div class="rfm-section">
                    <label class="rfm-label" for="rfm-prizeDescription">
                      <i class="bi bi-text-paragraph"></i>Descripción del premio
                      <span class="rfm-label__opt">opcional</span>
                    </label>
                    <textarea id="rfm-prizeDescription" class="rfm-input rfm-textarea"
                              style="height:100px"
                              formControlName="prizeDescription"
                              placeholder="Describí el premio en detalle..."></textarea>
                  </div>

                  <div class="rfm-section">
                    <label class="rfm-label" for="rfm-prizeValue">
                      <i class="bi bi-tag-fill"></i>Valor estimado
                      <span class="rfm-label__opt">opcional</span>
                    </label>
                    <input id="rfm-prizeValue" type="number" class="rfm-input"
                           formControlName="prizeEstimatedValue" placeholder="0" min="0">
                  </div>

                  <div class="rfm-info-box">
                    <div class="rfm-info-box__icon"><i class="bi bi-lightbulb-fill"></i></div>
                    <p class="rfm-info-box__text">
                      El valor estimado es solo informativo para los participantes. No afecta el sorteo ni el cobro.
                    </p>
                  </div>
                </div>

                <!-- Images -->
                <div class="rfm-images-col">
                  <div class="rfm-images-col__header">
                    <div>
                      <div class="rfm-prize-col__label">
                        <i class="bi bi-images"></i>Imágenes del premio
                      </div>
                      <div class="rfm-images-col__hint">Al menos una imagen es obligatoria</div>
                    </div>
                    <div class="rfm-img-counter"
                         [class.rfm-img-counter--empty]="previews().length === 0">
                      {{ previews().length }}/5
                    </div>
                  </div>

                  <input #fileInput type="file" accept="image/*" multiple class="d-none"
                         (change)="onFilesSelected($event)">

                  @if (previews().length === 0) {
                    <div class="rfm-dropzone" (click)="fileInput.click()"
                         (dragover)="$event.preventDefault()" (drop)="onDrop($event)"
                         [class.rfm-dropzone--error]="showImageError()"
                         role="button" tabindex="0" aria-label="Subir imágenes">
                      <div class="rfm-dropzone__icon">
                        <i class="bi bi-cloud-arrow-up-fill"></i>
                      </div>
                      <div class="rfm-dropzone__title">Arrastrá o hacé click</div>
                      <div class="rfm-dropzone__hint">JPG, PNG, WebP · Máx 2 MB · Hasta 5</div>
                    </div>
                  }

                  @if (previews().length > 0) {
                    <!-- Main preview -->
                    <div class="rfm-preview-main">
                      <img [src]="previews()[activeImg()].url"
                           class="rfm-preview-main__img"
                           [alt]="'Imagen ' + (activeImg() + 1)">
                      @if (previews().length > 1) {
                        <button type="button" class="rfm-preview-nav rfm-preview-nav--prev"
                                (click)="prevPreview()" [disabled]="activeImg() === 0"
                                aria-label="Imagen anterior">
                          <i class="bi bi-chevron-left"></i>
                        </button>
                        <button type="button" class="rfm-preview-nav rfm-preview-nav--next"
                                (click)="nextPreview()" [disabled]="activeImg() === previews().length - 1"
                                aria-label="Imagen siguiente">
                          <i class="bi bi-chevron-right"></i>
                        </button>
                      }
                      <span class="rfm-preview-counter">{{ activeImg() + 1 }} / {{ previews().length }}</span>
                    </div>

                    <!-- Thumbs -->
                    <div class="rfm-thumbs">
                      @for (p of previews(); track $index) {
                        <div class="rfm-thumb" [class.rfm-thumb--active]="activeImg() === $index"
                             (click)="activeImg.set($index)">
                          <img [src]="p.url" class="rfm-thumb__img" [alt]="'Miniatura ' + ($index + 1)">
                          <button type="button" class="rfm-thumb__remove"
                                  (click)="removeImage($index, $event)"
                                  [attr.aria-label]="'Eliminar imagen ' + ($index + 1)">
                            <i class="bi bi-x"></i>
                          </button>
                        </div>
                      }
                      @if (previews().length < 5) {
                        <div class="rfm-thumb rfm-thumb--add" (click)="fileInput.click()"
                             role="button" aria-label="Agregar imagen">
                          <i class="bi bi-plus-lg"></i>
                        </div>
                      }
                    </div>
                  }

                  @if (showImageError()) {
                    <div class="rfm-field-error mt-2">
                      <i class="bi bi-exclamation-circle-fill me-1"></i>
                      Debés subir al menos una imagen.
                    </div>
                  }
                </div>

              </div>
            </form>

            <div class="rfm-footer">
              <button type="button" class="rfm-btn rfm-btn--ghost" (click)="backToDetails()">
                <i class="bi bi-arrow-left me-2"></i>Volver
              </button>
              <button type="button" class="rfm-btn rfm-btn--primary" (click)="submit()"
                      [disabled]="loading()">
                @if (loading()) {
                  <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                  Creando rifa...
                } @else {
                  <i class="bi bi-check-circle-fill me-2"></i>Crear rifa
                }
              </button>
            </div>
          }

        </div>
      </div>
    }
  `,
  styles: [`
    /* ── Backdrop ─────────────────────────────────── */
    .rfm-backdrop {
      position: fixed; inset: 0; z-index: 1050;
      background: rgba(9,9,11,.72);
      backdrop-filter: blur(6px);
      animation: fadeIn .18s ease;
    }

    /* ── Shell & dialog ───────────────────────────── */
    .rfm-shell {
      position: fixed; inset: 0; z-index: 1055;
      overflow-x: hidden; overflow-y: auto;
      display: flex; align-items: flex-start; justify-content: center;
      padding: 1.5rem 1rem 3rem;
    }
    .rfm-dialog {
      width: 100%; background: #fff;
      border-radius: 1.5rem; overflow: hidden;
      box-shadow: 0 32px 80px rgba(0,0,0,.28), 0 8px 24px rgba(99,102,241,.15);
      animation: scale-in .22s cubic-bezier(0.34, 1.56, 0.64, 1);
      transform-origin: top center;
    }

    /* ── Header ───────────────────────────────────── */
    .rfm-header {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; padding: 1.1rem 1.5rem;
      background: linear-gradient(135deg, #09090b 0%, #1e1b4b 40%, #3b0764 100%);
      flex-wrap: wrap;
    }
    .rfm-header__brand {
      display: flex; align-items: center; gap: .85rem;
    }
    .rfm-header__icon {
      width: 44px; height: 44px; border-radius: .85rem; flex-shrink: 0;
      background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.15);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem; color: #fbbf24;
    }
    .rfm-header__step {
      font-size: .72rem; font-weight: 700; color: rgba(255,255,255,.55);
      text-transform: uppercase; letter-spacing: .1em;
    }
    .rfm-header__title {
      font-size: 1.1rem; font-weight: 900; color: #fff;
      margin: 0; letter-spacing: -0.02em;
    }

    /* Step pills */
    .rfm-steps {
      display: flex; align-items: center; gap: .5rem;
    }
    .rfm-step {
      display: flex; align-items: center; gap: .4rem;
      font-size: .75rem; font-weight: 700; color: rgba(255,255,255,.4);
      transition: color .2s;
      &--active { color: #fff; }
      &--done { color: #a5f3fc; }
    }
    .rfm-step__circle {
      width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: .72rem; font-weight: 900;
      background: rgba(255,255,255,.12); border: 1.5px solid rgba(255,255,255,.2);
      transition: all .2s;
      .rfm-step--active & {
        background: #6366f1; border-color: #6366f1; color: #fff;
      }
      .rfm-step--done & {
        background: #0891b2; border-color: #0891b2; color: #fff;
      }
    }
    .rfm-steps__line {
      width: 32px; height: 2px; border-radius: 1px;
      background: rgba(255,255,255,.15);
      transition: background .3s;
      &--done { background: #0891b2; }
    }

    .rfm-header__close {
      width: 36px; height: 36px; border-radius: .6rem;
      background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.12);
      color: rgba(255,255,255,.8); cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: .95rem; transition: background .15s;
      &:hover { background: rgba(255,255,255,.2); color: #fff; }
    }

    /* ── Error ────────────────────────────────────── */
    .rfm-error {
      display: flex; align-items: center; gap: .5rem;
      padding: .7rem 1.5rem; font-size: .85rem; font-weight: 600;
      background: #fff1f2; color: #be123c;
      border-left: 4px solid #f43f5e;
    }

    /* ── Body ─────────────────────────────────────── */
    .rfm-body {
      padding: 1.75rem 1.5rem;
    }
    .rfm-body--split {
      display: grid; grid-template-columns: 1fr 1.1fr; gap: 1.75rem; padding: 1.5rem;
      @media (max-width: 767px) { grid-template-columns: 1fr; }
    }

    /* ── Form elements ────────────────────────────── */
    .rfm-section { margin-bottom: 1.1rem; }
    .rfm-label {
      display: flex; align-items: center; gap: .35rem;
      font-size: .8rem; font-weight: 700; color: #3f3f46; margin-bottom: .4rem;
      i { font-size: .75rem; color: #a1a1aa; }
    }
    .rfm-label__opt { color: #a1a1aa; font-size: .72rem; font-weight: 400; margin-left: .25rem; }
    .rfm-input {
      display: block; width: 100%;
      padding: .65rem .9rem; font-size: .9rem;
      background: #fafaff; color: #18181b;
      border: 1.5px solid #e0e3ff; border-radius: .75rem;
      outline: none; transition: border-color .18s, box-shadow .18s, background .18s;
      &:focus {
        background: #fff; border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99,102,241,.14);
      }
      &--error { border-color: #f43f5e; background: #fff1f2; }
      &--error:focus { box-shadow: 0 0 0 3px rgba(244,63,94,.12); border-color: #f43f5e; }
    }
    .rfm-textarea { resize: vertical; height: 110px; }
    .rfm-field-error {
      margin-top: .3rem; font-size: .78rem; font-weight: 600; color: #be123c;
    }

    /* Info box */
    .rfm-info-box {
      display: flex; gap: .7rem; align-items: flex-start;
      background: #fffbeb; border: 1px solid #fde68a;
      border-radius: .85rem; padding: .8rem 1rem; margin-top: .5rem;
    }
    .rfm-info-box__icon {
      color: #d97706; font-size: 1rem; flex-shrink: 0; margin-top: 1px;
    }
    .rfm-info-box__text {
      font-size: .8rem; color: #92400e; margin: 0; line-height: 1.55;
    }

    /* Config card (step 1 right) */
    .rfm-config-card {
      background: #f8faff; border: 1px solid rgba(99,102,241,.1);
      border-radius: 1.1rem; padding: 1.1rem; height: 100%;
    }
    .rfm-config-card__header {
      display: flex; align-items: center; gap: .5rem;
      font-weight: 800; font-size: .88rem; color: #18181b;
      margin-bottom: 1rem; padding-bottom: .75rem;
      border-bottom: 1px solid rgba(99,102,241,.08);
      i { color: #6366f1; }
    }

    /* Summary box */
    .rfm-summary {
      background: linear-gradient(135deg, #ede9fe, #fce7f3);
      border-radius: .85rem; padding: .85rem 1rem; margin-top: .5rem;
    }
    .rfm-summary__row {
      display: flex; justify-content: space-between; align-items: baseline;
      font-size: .8rem; color: #6d28d9; margin-bottom: .3rem;
      strong { font-weight: 700; }
    }
    .rfm-summary__total {
      display: flex; justify-content: space-between; align-items: baseline;
      padding-top: .5rem; margin-top: .35rem; border-top: 1px solid rgba(139,92,246,.2);
      font-size: .8rem; font-weight: 700; color: #4c1d95;
    }
    .rfm-summary__amount {
      font-size: 1rem; font-weight: 900;
      background: linear-gradient(135deg,#6366f1,#8b5cf6);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }

    /* ── Prize step ───────────────────────────────── */
    .rfm-prize-col__label {
      display: flex; align-items: center; gap: .4rem;
      font-size: .78rem; font-weight: 800; color: #a1a1aa;
      text-transform: uppercase; letter-spacing: .08em;
      margin-bottom: .85rem;
      i { color: #6366f1; }
    }
    .rfm-prize-col {
      border-right: 1px solid #f0f0fb;
      padding-right: 1.75rem;
      @media (max-width: 767px) { border-right: none; padding-right: 0; border-bottom: 1px solid #f0f0fb; padding-bottom: 1.5rem; }
    }

    /* Images column */
    .rfm-images-col { }
    .rfm-images-col__header {
      display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: .85rem;
    }
    .rfm-images-col__hint { font-size: .75rem; color: #a1a1aa; margin-top: .2rem; }
    .rfm-img-counter {
      padding: .2rem .55rem; border-radius: 999px; font-size: .72rem; font-weight: 800;
      background: #ede9fe; color: #6d28d9;
      &--empty { background: #fff1f2; color: #be123c; }
    }

    /* Drop zone */
    .rfm-dropzone {
      border: 2px dashed #c7d2fe; border-radius: 1rem;
      background: linear-gradient(135deg, #f5f3ff, #fdf2f8);
      padding: 2.5rem 1rem; text-align: center; cursor: pointer;
      transition: border-color .18s, background .18s;
      &:hover { border-color: #6366f1; background: #eff0fe; }
      &--error { border-color: #f43f5e; background: #fff1f2; }
    }
    .rfm-dropzone__icon {
      width: 60px; height: 60px; border-radius: 50%; margin: 0 auto .9rem;
      background: linear-gradient(135deg, #dbeafe, #fce7f3);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.6rem; color: #6366f1;
    }
    .rfm-dropzone__title { font-size: .9rem; font-weight: 700; color: #3f3f46; margin-bottom: .3rem; }
    .rfm-dropzone__hint { font-size: .78rem; color: #a1a1aa; }

    /* Preview */
    .rfm-preview-main {
      position: relative; height: 240px; border-radius: 1rem; overflow: hidden;
      background: #09090b; margin-bottom: .75rem;
    }
    .rfm-preview-main__img {
      width: 100%; height: 100%; object-fit: contain; display: block;
    }
    .rfm-preview-nav {
      position: absolute; top: 50%; transform: translateY(-50%);
      width: 32px; height: 32px; border-radius: 50%;
      background: rgba(0,0,0,.55); border: 1px solid rgba(255,255,255,.15);
      color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
      font-size: .8rem; transition: background .15s;
      &:disabled { opacity: .3; cursor: not-allowed; }
      &:not(:disabled):hover { background: rgba(0,0,0,.8); }
      &--prev { left: .6rem; }
      &--next { right: .6rem; }
    }
    .rfm-preview-counter {
      position: absolute; bottom: .6rem; right: .75rem;
      background: rgba(0,0,0,.65); color: #fff; font-size: .72rem; font-weight: 700;
      padding: .2rem .5rem; border-radius: 999px;
    }

    /* Thumbs */
    .rfm-thumbs {
      display: flex; gap: .5rem; flex-wrap: wrap;
    }
    .rfm-thumb {
      position: relative; width: 58px; height: 58px; border-radius: .6rem;
      overflow: hidden; cursor: pointer; flex-shrink: 0;
      border: 2.5px solid #e4e4e7; transition: border-color .15s;
      &--active { border-color: #6366f1; }
      &--add {
        border: 2px dashed #c7d2fe; background: #f5f3ff;
        display: flex; align-items: center; justify-content: center;
        color: #a5b4fc; font-size: 1.2rem; overflow: visible;
        &:hover { border-color: #6366f1; color: #6366f1; }
      }
    }
    .rfm-thumb__img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .rfm-thumb__remove {
      position: absolute; top: -5px; right: -5px;
      width: 20px; height: 20px; border-radius: 50%;
      background: #ef4444; color: #fff; border: none;
      display: flex; align-items: center; justify-content: center;
      font-size: .7rem; cursor: pointer; padding: 0;
      transition: background .15s;
      &:hover { background: #b91c1c; }
    }

    /* ── Footer ───────────────────────────────────── */
    .rfm-footer {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      padding: .9rem 1.5rem; border-top: 1px solid #f0f0fb; background: #fafaff;
    }
    .rfm-btn {
      display: inline-flex; align-items: center; font-weight: 700; font-size: .9rem;
      padding: .65rem 1.5rem; border-radius: .75rem; cursor: pointer;
      border: none; transition: all .18s;
      &--ghost {
        background: transparent; color: #71717a;
        border: 1.5px solid #e4e4e7;
        &:hover { background: #f4f4f5; color: #3f3f46; border-color: #d4d4d8; }
      }
      &--primary {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: #fff; box-shadow: 0 4px 14px rgba(99,102,241,.35);
        &:hover { box-shadow: 0 6px 20px rgba(99,102,241,.45); transform: translateY(-1px); }
        &:disabled { opacity: .65; cursor: not-allowed; transform: none; }
      }
    }
  `]
})
export class RaffleFormModal implements OnDestroy {
  readonly open    = input.required<boolean>();
  readonly closed  = output<void>();
  readonly created = output<void>();

  private readonly raffleService = inject(RaffleService);
  private readonly fb = inject(FormBuilder);

  protected readonly step         = signal<RaffleModalStep>('details');
  protected readonly loading      = signal(false);
  protected readonly error        = signal('');
  protected readonly previews     = signal<ImgPreview[]>([]);
  protected readonly activeImg    = signal(0);
  protected readonly imageTouched = signal(false);

  protected readonly detailsForm = this.fb.group({
    title:          ['', Validators.required],
    description:    [''],
    totalNumbers:   [100, [Validators.required, Validators.min(2)]],
    pricePerNumber: [1000, [Validators.required, Validators.min(1)]],
    drawDateTime:   ['', Validators.required],
  });

  protected readonly prizeForm = this.fb.group({
    prizeName:           ['', Validators.required],
    prizeDescription:    [''],
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
    if (this.step() === 'prize') { this.backToDetails(); return; }
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
    this.activeImg.update(i => Math.min(i, Math.max(0, this.previews().length - 1)));
  }

  protected prevPreview(): void { this.activeImg.update(i => Math.max(0, i - 1)); }
  protected nextPreview(): void { this.activeImg.update(i => Math.min(this.previews().length - 1, i + 1)); }
  protected showImageError(): boolean { return this.imageTouched() && this.previews().length === 0; }

  protected resetAndClose(): void {
    this.detailsForm.reset({ title: '', description: '', totalNumbers: 100, pricePerNumber: 1000, drawDateTime: '' });
    this.prizeForm.reset({ prizeName: '', prizeDescription: '', prizeEstimatedValue: null });
    this.revokeAll();
    this.error.set('');
    this.step.set('details');
    this.imageTouched.set(false);
    this.closed.emit();
  }

  protected submit(): void {
    this.prizeForm.markAllAsTouched();
    this.imageTouched.set(true);
    if (this.detailsForm.invalid) { this.step.set('details'); this.detailsForm.markAllAsTouched(); return; }
    if (this.prizeForm.invalid || this.previews().length === 0) return;

    this.loading.set(true);
    this.error.set('');

    const details = this.detailsForm.getRawValue();
    const prize   = this.prizeForm.getRawValue();

    this.raffleService.create({
      title:               details.title!,
      description:         details.description || undefined,
      totalNumbers:        details.totalNumbers!,
      pricePerNumber:      details.pricePerNumber!,
      drawDateTime:        details.drawDateTime || undefined,
      drawMethod:          'MANUAL',
      drawPolicy:          'ALL_NUMBERS',
      prizeName:           prize.prizeName || undefined,
      prizeDescription:    prize.prizeDescription || undefined,
      prizeEstimatedValue: prize.prizeEstimatedValue ?? undefined,
    }).subscribe({
      next: raffle => {
        const files = this.previews().map(p => p.file);
        this.raffleService.uploadImages(raffle.id, files).subscribe({
          complete: () => { this.loading.set(false); this.resetAndClose(); this.created.emit(); },
          error:    () => { this.loading.set(false); this.resetAndClose(); this.created.emit(); },
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
      if (file.size > 2 * 1024 * 1024) { this.error.set(`"${file.name}" supera el límite de 2 MB`); return false; }
      if (!file.type.startsWith('image/')) return false;
      return true;
    });
    if (toAdd.length > 0) {
      this.previews.update(prev => [...prev, ...toAdd.map(file => ({ file, url: URL.createObjectURL(file) }))]);
      this.error.set('');
    }
  }

  private revokeAll(): void {
    this.previews().forEach(p => URL.revokeObjectURL(p.url));
    this.previews.set([]);
    this.activeImg.set(0);
  }

  ngOnDestroy(): void { this.revokeAll(); }
}
