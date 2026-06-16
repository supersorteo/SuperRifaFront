import { Component, inject, input, OnDestroy, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { RaffleService } from '../../../core/services/raffle.service';

interface ImgPreview { file: File; url: string; }
type RaffleModalStep = 'details' | 'prize';

function minFutureDateTimeValidator(minMinutesAhead: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const rawValue = control.value;
    if (!rawValue) return null;

    const target = new Date(rawValue);
    if (Number.isNaN(target.getTime())) return { invalidDateTime: true };

    return target.getTime() >= Date.now() + minMinutesAhead * 60_000
      ? null
      : { minFutureDateTime: { minMinutesAhead } };
  };
}

@Component({
  selector: 'app-raffle-form-modal',
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    @if (open()) {
      <div class="rfm-backdrop" (click)="closeCurrentStep()"></div>

      <div class="rfm-shell" role="dialog" aria-modal="true"
           [attr.aria-labelledby]="step() === 'details' ? 'rfm-title-1' : 'rfm-title-2'">
        <div class="rfm-dialog">

          <!-- Header -->
          <div class="rfm-header">
            <div class="rfm-header__brand">
              <div class="rfm-header__icon">
                <i [class]="step() === 'details' ? 'bi bi-ticket-perforated-fill' : 'bi bi-trophy-fill'"></i>
              </div>
              <h4 class="rfm-header__title"
                  [id]="step() === 'details' ? 'rfm-title-1' : 'rfm-title-2'">
                {{ step() === 'details' ? 'Nueva rifa' : 'Premio e imágenes' }}
              </h4>
            </div>

            <div class="rfm-steps">
              <div class="rfm-step" [class.rfm-step--done]="step() === 'prize'" [class.rfm-step--active]="step() === 'details'">
                <div class="rfm-step__dot">@if (step() === 'prize') { <i class="bi bi-check2"></i> } @else { 1 }</div>
                <span>Datos</span>
              </div>
              <div class="rfm-steps__line" [class.rfm-steps__line--done]="step() === 'prize'"></div>
              <div class="rfm-step" [class.rfm-step--active]="step() === 'prize'">
                <div class="rfm-step__dot">2</div>
                <span>Premio</span>
              </div>
            </div>

            <button class="rfm-close"
                    (click)="step() === 'prize' ? backToDetails() : resetAndClose()"
                    [attr.aria-label]="step() === 'prize' ? 'Volver' : 'Cerrar'">
              <i [class]="step() === 'prize' ? 'bi bi-arrow-left' : 'bi bi-x-lg'"></i>
            </button>
          </div>

          @if (error()) {
            <div class="rfm-error">
              <i class="bi bi-exclamation-triangle-fill"></i>{{ error() }}
            </div>
          }

          <!-- ══ PASO 1 ══ -->
          @if (step() === 'details') {
            <form [formGroup]="detailsForm" novalidate>
              <div class="rfm-body">

                <div class="rfm-field">
                  <label class="rfm-label" for="rfm-title">Nombre de la rifa</label>
                  <input id="rfm-title" type="text" class="rfm-input"
                         formControlName="title" placeholder="Ej: Rifa del auto 0km"
                         [class.rfm-input--err]="showInvalid(detailsForm, 'title')">
                  @if (showInvalid(detailsForm, 'title')) {
                    <span class="rfm-err">Requerido</span>
                  }
                </div>

                <div class="rfm-row3">
                  <div class="rfm-field">
                    <label class="rfm-label" for="rfm-num">Números</label>
                    <input id="rfm-num" type="number" class="rfm-input"
                           formControlName="totalNumbers" placeholder="100" min="2"
                           [class.rfm-input--err]="showInvalid(detailsForm, 'totalNumbers')">
                    @if (showInvalid(detailsForm, 'totalNumbers')) {
                      <span class="rfm-err">Mín. 2</span>
                    }
                  </div>

                  <div class="rfm-field">
                    <label class="rfm-label" for="rfm-price">Precio por número</label>
                    <div class="rfm-prefix-wrap">
                      <span class="rfm-prefix">$</span>
                      <input id="rfm-price" type="number" class="rfm-input rfm-input--prefixed"
                             formControlName="pricePerNumber" placeholder="1000" min="1"
                             [class.rfm-input--err]="showInvalid(detailsForm, 'pricePerNumber')">
                    </div>
                    @if (showInvalid(detailsForm, 'pricePerNumber')) {
                      <span class="rfm-err">Mín. 1</span>
                    }
                  </div>

                  <div class="rfm-field">
                    <label class="rfm-label" for="rfm-date">Fecha del sorteo</label>
                    <div class="rfm-date-wrap" [class.rfm-date-wrap--err]="showInvalid(detailsForm, 'drawDateTime')">
                      <div class="rfm-date-wrap__icon">
                        <i class="bi bi-calendar-event"></i>
                      </div>
                      <input id="rfm-date" type="datetime-local" class="rfm-input rfm-input--date"
                             formControlName="drawDateTime"
                             [attr.min]="minDrawDateTime()"
                             [class.rfm-input--err]="showInvalid(detailsForm, 'drawDateTime')">
                    </div>
                    @if (showInvalid(detailsForm, 'drawDateTime')) {
                      <span class="rfm-err">{{ drawDateTimeError() }}</span>
                    }
                  </div>
                </div>

                <div class="rfm-field">
                  <label class="rfm-label" for="rfm-desc">
                    Descripción <span class="rfm-opt">· opcional</span>
                  </label>
                  <textarea id="rfm-desc" class="rfm-input rfm-textarea"
                            formControlName="description"
                            placeholder="Descripción de la rifa para los participantes..."></textarea>
                </div>

                <div class="rfm-revenue">
                  <span class="rfm-revenue__meta">
                    {{ detailsForm.get('totalNumbers')?.value ?? 0 }} números
                    × $ {{ detailsForm.get('pricePerNumber')?.value ?? 0 | number }}
                  </span>
                  <div class="rfm-revenue__right">
                    <span class="rfm-revenue__label">Recaudación potencial</span>
                    <strong class="rfm-revenue__amount">$ {{ potentialRevenue() | number }}</strong>
                  </div>
                </div>

              </div>
            </form>

            <div class="rfm-footer">
              <button type="button" class="rfm-btn rfm-btn--ghost" (click)="resetAndClose()">
                Cancelar
              </button>
              <button type="button" class="rfm-btn rfm-btn--primary" (click)="goToPrizeStep()">
                Continuar <i class="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          }

          <!-- ══ PASO 2 ══ -->
          @if (step() === 'prize') {
            <form [formGroup]="prizeForm" novalidate>
              <div class="rfm-body rfm-body--split">

                <!-- Datos del premio -->
                <div class="rfm-prize-col">
                  <div class="rfm-field">
                    <label class="rfm-label" for="rfm-prizeName">Nombre del premio</label>
                    <input id="rfm-prizeName" type="text" class="rfm-input"
                           formControlName="prizeName" placeholder="Ej: Samsung 65 pulgadas"
                           [class.rfm-input--err]="showInvalid(prizeForm, 'prizeName')">
                    @if (showInvalid(prizeForm, 'prizeName')) {
                      <span class="rfm-err">Requerido</span>
                    }
                  </div>

                  <div class="rfm-field">
                    <label class="rfm-label" for="rfm-prizeDesc">
                      Descripción <span class="rfm-opt">· opcional</span>
                    </label>
                    <textarea id="rfm-prizeDesc" class="rfm-input rfm-textarea"
                              formControlName="prizeDescription"
                              placeholder="Detalles del premio..."></textarea>
                  </div>

                  <div class="rfm-field">
                    <label class="rfm-label" for="rfm-prizeVal">
                      Valor estimado <span class="rfm-opt">· opcional</span>
                    </label>
                    <div class="rfm-prefix-wrap">
                      <span class="rfm-prefix">$</span>
                      <input id="rfm-prizeVal" type="number" class="rfm-input rfm-input--prefixed"
                             formControlName="prizeEstimatedValue" placeholder="0" min="0">
                    </div>
                  </div>
                </div>

                <!-- Imágenes -->
                <div class="rfm-images-col">
                  <div class="rfm-images-header">
                    <span class="rfm-label">Imágenes del premio</span>
                    <span class="rfm-img-count" [class.rfm-img-count--empty]="previews().length === 0">
                      {{ previews().length }}/5
                    </span>
                  </div>

                  <input #fileInput type="file" accept="image/*" multiple class="d-none"
                         (change)="onFilesSelected($event)">

                  @if (previews().length === 0) {
                    <div class="rfm-dropzone"
                         (click)="fileInput.click()"
                         (dragover)="$event.preventDefault()"
                         (drop)="onDrop($event)"
                         [class.rfm-dropzone--err]="showImageError()"
                         role="button" tabindex="0" aria-label="Subir imágenes">
                      <i class="bi bi-cloud-arrow-up-fill rfm-dropzone__icon"></i>
                      <div class="rfm-dropzone__title">Arrastrá o hacé click</div>
                      <div class="rfm-dropzone__sub">JPG · PNG · WebP · máx 2 MB</div>
                    </div>
                  }

                  @if (previews().length > 0) {
                    <div class="rfm-preview">
                      <img [src]="previews()[activeImg()].url"
                           class="rfm-preview__img"
                           [alt]="'Imagen ' + (activeImg() + 1)">
                      @if (previews().length > 1) {
                        <button type="button" class="rfm-nav rfm-nav--l"
                                (click)="prevPreview()" [disabled]="activeImg() === 0"
                                aria-label="Anterior"><i class="bi bi-chevron-left"></i></button>
                        <button type="button" class="rfm-nav rfm-nav--r"
                                (click)="nextPreview()" [disabled]="activeImg() === previews().length - 1"
                                aria-label="Siguiente"><i class="bi bi-chevron-right"></i></button>
                      }
                      <span class="rfm-preview__count">{{ activeImg() + 1 }}/{{ previews().length }}</span>
                    </div>

                    <div class="rfm-thumbs">
                      @for (p of previews(); track $index) {
                        <div class="rfm-thumb" [class.rfm-thumb--on]="activeImg() === $index"
                             (click)="activeImg.set($index)">
                          <img [src]="p.url" class="rfm-thumb__img" [alt]="'Miniatura ' + ($index+1)">
                          <button type="button" class="rfm-thumb__rm"
                                  (click)="removeImage($index, $event)"
                                  [attr.aria-label]="'Eliminar ' + ($index+1)">
                            <i class="bi bi-x"></i>
                          </button>
                        </div>
                      }
                      @if (previews().length < 5) {
                        <div class="rfm-thumb rfm-thumb--add" role="button"
                             (click)="fileInput.click()" aria-label="Agregar imagen">
                          <i class="bi bi-plus-lg"></i>
                        </div>
                      }
                    </div>
                  }

                  @if (showImageError()) {
                    <span class="rfm-err mt-2 d-block">
                      <i class="bi bi-exclamation-circle-fill me-1"></i>Subí al menos una imagen.
                    </span>
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
                  <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Creando...
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
    .rfm-backdrop {
      position: fixed; inset: 0; z-index: 1050;
      background: rgba(9,9,11,.75); backdrop-filter: blur(6px);
      animation: fadeIn .18s ease;
    }
    .rfm-shell {
      position: fixed; inset: 0; z-index: 1055;
      overflow-y: auto; overflow-x: hidden;
      display: flex; align-items: center; justify-content: center;
      padding: 1.5rem 1rem;
    }
    .rfm-dialog {
      width: min(100%, 860px); max-width: 860px; background: #fff;
      border-radius: 1.5rem;
      overflow-y: auto; overflow-x: hidden;
      max-height: calc(100dvh - 3rem);
      display: flex; flex-direction: column;
      overscroll-behavior: contain;
      box-shadow: 0 32px 80px rgba(0,0,0,.28), 0 8px 24px rgba(99,102,241,.14);
      animation: scale-in .22s cubic-bezier(0.34,1.56,0.64,1); transform-origin: center center;
      margin: auto 0;
    }

    /* Header */
    .rfm-header {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      padding: 1rem 1.4rem;
      background: linear-gradient(135deg,#09090b 0%,#1e1b4b 45%,#3b0764 100%);
    }
    .rfm-header__brand { display: flex; align-items: center; gap: .75rem; }
    .rfm-header__icon {
      width: 40px; height: 40px; border-radius: .75rem; flex-shrink: 0;
      background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.15);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; color: #fbbf24;
    }
    .rfm-header__title { font-size: 1rem; font-weight: 900; color: #fff; margin: 0; letter-spacing: -.02em; }

    /* Step indicator */
    .rfm-steps { display: flex; align-items: center; gap: .45rem; }
    .rfm-step {
      display: flex; align-items: center; gap: .35rem;
      font-size: .73rem; font-weight: 700; color: rgba(255,255,255,.35); transition: color .2s;
      &--active { color: #fff; }
      &--done { color: #a5f3fc; }
    }
    .rfm-step__dot {
      width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: .7rem; font-weight: 900;
      background: rgba(255,255,255,.1); border: 1.5px solid rgba(255,255,255,.18); transition: all .2s;
      .rfm-step--active & { background: #6366f1; border-color: #6366f1; color: #fff; }
      .rfm-step--done   & { background: #0891b2; border-color: #0891b2; color: #fff; }
    }
    .rfm-steps__line {
      width: 28px; height: 2px; border-radius: 1px;
      background: rgba(255,255,255,.15); transition: background .3s;
      &--done { background: #0891b2; }
    }
    .rfm-close {
      width: 34px; height: 34px; border-radius: .55rem; flex-shrink: 0;
      background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.12);
      color: rgba(255,255,255,.75); cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: .9rem;
      transition: background .15s;
      &:hover { background: rgba(255,255,255,.2); color: #fff; }
    }

    /* Error */
    .rfm-error {
      display: flex; align-items: center; gap: .5rem;
      padding: .65rem 1.4rem; font-size: .84rem; font-weight: 600;
      background: #fff1f2; color: #be123c; border-left: 4px solid #f43f5e;
    }

    /* Body */
    .rfm-body {
      padding: 1.5rem 1.4rem; display: flex; flex-direction: column; gap: 1rem;
      flex: 1 1 auto;
      min-height: 0;
      overflow: visible;
    }
    .rfm-body--split {
      display: grid; grid-template-columns: 1fr 1.15fr; gap: 1.5rem; padding: 1.5rem 1.4rem;
      @media (max-width: 767px) { grid-template-columns: 1fr; }
    }

    /* Fields */
    .rfm-field { display: flex; flex-direction: column; gap: .3rem; }
    .rfm-row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: .85rem; }
    .rfm-label { font-size: .8rem; font-weight: 700; color: #3f3f46; }
    .rfm-opt   { font-weight: 400; color: #a1a1aa; font-size: .75rem; }
    .rfm-input {
      width: 100%; padding: .62rem .85rem; font-size: .88rem;
      background: #fafaff; color: #18181b;
      border: 1.5px solid #e0e3ff; border-radius: .7rem; outline: none;
      transition: border-color .18s, box-shadow .18s, background .18s;
      &:focus { background: #fff; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.13); }
      &--err { border-color: #f43f5e; background: #fff1f2; }
      &--err:focus { box-shadow: 0 0 0 3px rgba(244,63,94,.11); border-color: #f43f5e; }
    }
    .rfm-prefix-wrap { position: relative; }
    .rfm-prefix {
      position: absolute; left: .85rem; top: 50%; transform: translateY(-50%);
      font-size: .88rem; font-weight: 700; color: #a1a1aa; pointer-events: none;
    }
    .rfm-date-wrap {
      display: flex; align-items: center; gap: .7rem;
      padding: .18rem .72rem;
      border: 1.5px solid #e0e3ff;
      border-radius: .8rem;
      background: linear-gradient(135deg, #fafaff, #f5f7ff);
      transition: border-color .18s, box-shadow .18s, background .18s;
    }
    .rfm-date-wrap:focus-within {
      background: #fff;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,.13);
    }
    .rfm-date-wrap--err {
      border-color: #f43f5e;
      background: #fff1f2;
    }
    .rfm-date-wrap--err:focus-within {
      border-color: #f43f5e;
      box-shadow: 0 0 0 3px rgba(244,63,94,.11);
    }
    .rfm-date-wrap__icon {
      width: 34px; height: 34px; border-radius: .75rem; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; font-size: .92rem;
      box-shadow: 0 10px 20px rgba(99,102,241,.22);
    }
    .rfm-input--prefixed { padding-left: 1.75rem; }
    .rfm-input--date {
      border: none;
      background: transparent;
      box-shadow: none;
      padding-left: 0;
      padding-right: 0;
      font-weight: 700;
      color: #312e81;
      min-height: 42px;
    }
    .rfm-input--date:focus {
      border: none;
      box-shadow: none;
      background: transparent;
    }
    .rfm-input--date::-webkit-calendar-picker-indicator {
      cursor: pointer;
      opacity: .85;
      filter: saturate(1.1);
    }
    .rfm-textarea { resize: vertical; height: 90px; }
    .rfm-err { font-size: .76rem; font-weight: 600; color: #be123c; }

    /* Revenue strip */
    .rfm-revenue {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      background: linear-gradient(135deg,#ede9fe,#fce7f3);
      border-radius: .85rem; padding: .75rem 1.1rem;
    }
    .rfm-revenue__meta { font-size: .78rem; color: #7c3aed; font-weight: 500; }
    .rfm-revenue__right { text-align: right; }
    .rfm-revenue__label { display: block; font-size: .7rem; color: #6d28d9; font-weight: 600; }
    .rfm-revenue__amount {
      font-size: 1.05rem; font-weight: 900;
      background: linear-gradient(135deg,#6366f1,#8b5cf6);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }

    /* Prize col */
    .rfm-prize-col {
      display: flex; flex-direction: column; gap: 1rem;
      border-right: 1px solid #f0f0fb; padding-right: 1.5rem;
      @media (max-width: 767px) { border-right: none; padding-right: 0; border-bottom: 1px solid #f0f0fb; padding-bottom: 1.25rem; }
    }

    /* Images col */
    .rfm-images-col { display: flex; flex-direction: column; gap: .75rem; }
    .rfm-images-header { display: flex; align-items: center; justify-content: space-between; }
    .rfm-img-count {
      padding: .18rem .5rem; border-radius: 999px; font-size: .72rem; font-weight: 800;
      background: #ede9fe; color: #6d28d9;
      &--empty { background: #fff1f2; color: #be123c; }
    }

    /* Drop zone */
    .rfm-dropzone {
      border: 2px dashed #c7d2fe; border-radius: 1rem;
      background: linear-gradient(135deg,#f5f3ff,#fdf2f8);
      padding: 2rem 1rem; text-align: center; cursor: pointer;
      transition: border-color .18s, background .18s;
      &:hover { border-color: #6366f1; background: #eff0fe; }
      &--err { border-color: #f43f5e; background: #fff1f2; }
    }
    .rfm-dropzone__icon {
      font-size: 2rem; color: #a5b4fc; display: block; margin-bottom: .6rem;
    }
    .rfm-dropzone__title { font-size: .88rem; font-weight: 700; color: #3f3f46; margin-bottom: .25rem; }
    .rfm-dropzone__sub   { font-size: .74rem; color: #a1a1aa; }

    /* Preview */
    .rfm-preview {
      position: relative; height: 220px; border-radius: .9rem; overflow: hidden; background: #09090b;
    }
    .rfm-preview__img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .rfm-nav {
      position: absolute; top: 50%; transform: translateY(-50%);
      width: 30px; height: 30px; border-radius: 50%;
      background: rgba(0,0,0,.55); border: 1px solid rgba(255,255,255,.15);
      color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: .78rem;
      transition: background .15s;
      &:disabled { opacity: .3; cursor: not-allowed; }
      &:not(:disabled):hover { background: rgba(0,0,0,.8); }
      &--l { left: .5rem; }
      &--r { right: .5rem; }
    }
    .rfm-preview__count {
      position: absolute; bottom: .5rem; right: .65rem;
      background: rgba(0,0,0,.6); color: #fff; font-size: .7rem; font-weight: 700;
      padding: .18rem .45rem; border-radius: 999px;
    }

    /* Thumbs */
    .rfm-thumbs { display: flex; gap: .45rem; flex-wrap: wrap; }
    .rfm-thumb {
      position: relative; width: 54px; height: 54px; border-radius: .55rem;
      overflow: hidden; cursor: pointer; flex-shrink: 0;
      border: 2.5px solid #e4e4e7; transition: border-color .15s;
      &--on  { border-color: #6366f1; }
      &--add {
        border: 2px dashed #c7d2fe; background: #f5f3ff; overflow: visible;
        display: flex; align-items: center; justify-content: center;
        color: #a5b4fc; font-size: 1.1rem;
        &:hover { border-color: #6366f1; color: #6366f1; }
      }
    }
    .rfm-thumb__img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .rfm-thumb__rm {
      position: absolute; top: -5px; right: -5px;
      width: 18px; height: 18px; border-radius: 50%;
      background: #ef4444; color: #fff; border: none; padding: 0; cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: .65rem;
      &:hover { background: #b91c1c; }
    }

    /* Footer */
    .rfm-footer {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      padding: .85rem 1.4rem; border-top: 1px solid #f0f0fb; background: #fafaff;
      flex-shrink: 0;
    }
    .rfm-btn {
      display: inline-flex; align-items: center; font-weight: 700; font-size: .88rem;
      padding: .6rem 1.35rem; border-radius: .7rem; cursor: pointer; border: none; transition: all .18s;
      &--ghost {
        background: transparent; color: #71717a; border: 1.5px solid #e4e4e7;
        &:hover { background: #f4f4f5; color: #3f3f46; }
      }
      &--primary {
        background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff;
        box-shadow: 0 4px 14px rgba(99,102,241,.32);
        &:hover { box-shadow: 0 6px 20px rgba(99,102,241,.44); transform: translateY(-1px); }
        &:disabled { opacity: .65; cursor: not-allowed; transform: none; }
      }
    }

    @media (max-width: 991.98px) {
      .rfm-dialog {
        width: min(100%, 760px);
      }

      .rfm-header {
        padding: .95rem 1rem;
      }

      .rfm-body,
      .rfm-body--split,
      .rfm-footer {
        padding-left: 1rem;
        padding-right: 1rem;
      }

      .rfm-row3 {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 767px) {
      .rfm-shell {
        align-items: center;
        padding: 1rem .75rem;
      }

      .rfm-dialog {
        width: 100%;
        max-width: min(100%, 680px);
        max-height: calc(100dvh - 2rem);
        margin: auto 0;
        border-radius: 1.15rem;
      }

      .rfm-header {
        flex-wrap: wrap;
        align-items: flex-start;
        gap: .85rem;
      }

      .rfm-header__brand {
        min-width: 0;
      }

      .rfm-header__title {
        font-size: .95rem;
      }

      .rfm-steps {
        width: 100%;
        order: 3;
        justify-content: flex-start;
        overflow-x: auto;
        padding-bottom: .1rem;
      }

      .rfm-close {
        margin-left: auto;
      }

      .rfm-body,
      .rfm-body--split {
        padding: 1rem;
      }

      .rfm-body--split {
        gap: 1rem;
      }
    }

    @media (max-width: 575.98px) {
      .rfm-shell {
        padding: .65rem;
      }

      .rfm-dialog {
        max-height: calc(100dvh - 1.3rem);
        border-radius: 1rem;
      }

      .rfm-header {
        padding: .85rem;
      }

      .rfm-header__icon {
        width: 36px;
        height: 36px;
        border-radius: .65rem;
        font-size: 1rem;
      }

      .rfm-steps {
        gap: .35rem;
      }

      .rfm-step {
        font-size: .67rem;
      }

      .rfm-step__dot {
        width: 20px;
        height: 20px;
        font-size: .65rem;
      }

      .rfm-steps__line {
        width: 20px;
      }

      .rfm-error {
        padding: .6rem .85rem;
        font-size: .78rem;
      }

      .rfm-body,
      .rfm-body--split {
        padding: .85rem;
      }

      .rfm-date-wrap {
        gap: .55rem;
        padding: .16rem .58rem;
      }

      .rfm-date-wrap__icon {
        width: 30px;
        height: 30px;
        border-radius: .65rem;
        font-size: .82rem;
      }

      .rfm-revenue {
        flex-direction: column;
        align-items: flex-start;
        padding: .85rem;
      }

      .rfm-revenue__right {
        width: 100%;
        text-align: left;
      }

      .rfm-preview {
        height: 190px;
      }

      .rfm-thumbs {
        gap: .4rem;
      }

      .rfm-thumb {
        width: 50px;
        height: 50px;
      }

      .rfm-footer {
        flex-direction: column-reverse;
        align-items: stretch;
        padding: .85rem;
      }

      .rfm-btn {
        width: 100%;
        justify-content: center;
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
    drawDateTime:   ['', [Validators.required, minFutureDateTimeValidator(30)]],
  });

  protected readonly prizeForm = this.fb.group({
    prizeName:           ['', Validators.required],
    prizeDescription:    [''],
    prizeEstimatedValue: [null as number | null],
  });

  protected showInvalid(form: ReturnType<FormBuilder['group']>, field: string): boolean {
    return !!form.get(field)?.touched && !!form.get(field)?.invalid;
  }

  protected drawDateTimeError(): string {
    const control = this.detailsForm.get('drawDateTime');
    if (!control?.touched || !control.errors) return '';
    if (control.hasError('required')) return 'Requerido';
    if (control.hasError('invalidDateTime')) return 'Fecha invalida';
    if (control.hasError('minFutureDateTime')) return 'Debe ser al menos 30 minutos posterior a la hora actual';
    return 'Fecha invalida';
  }

  protected minDrawDateTime(): string {
    return this.toLocalDateTimeValue(new Date(Date.now() + 30 * 60_000));
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

  private toLocalDateTimeValue(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  ngOnDestroy(): void { this.revokeAll(); }
}
