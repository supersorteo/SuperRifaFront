import {
  Component, computed, inject, OnDestroy, OnInit, signal
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RaffleService } from '../../../core/services/raffle.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { CurrencyArPipe } from '../../../shared/pipes/currency-ar.pipe';
import { NumberInfo, NumberStatus, RafflePublicResponse } from '../../../core/models/raffle.models';
import { LiveDrawOverlay } from '../../../shared/components/live-draw-overlay/live-draw-overlay';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-raffle-detail',
  imports: [RouterLink, ReactiveFormsModule, DecimalPipe, CurrencyArPipe, LiveDrawOverlay],
  template: `
    <app-live-draw-overlay
      [open]="showLiveDraw()"
      [title]="raffle()?.title || 'Sorteo en vivo'"
      [subtitle]="liveWinnerNumber() === null ? 'Todos los participantes estan viendo esta cuenta regresiva en tiempo real.' : 'Ya tenemos numero ganador.'"
      [countdown]="liveCountdown()"
      [winnerNumber]="liveWinnerNumber()"
      [winnerName]="raffle()?.winnerName || ''" />

    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <header class="rd-header">
      <div class="rd-header__inner">
        <span class="rd-logo">
          <i class="bi bi-ticket-perforated-fill"></i>
          <span>SuperSorteo</span>
        </span>
        @if (raffle()) {
          <a [routerLink]="['/mis-numeros']" [queryParams]="{ slug: raffle()!.slug }"
             class="rd-btn-outline">
            <i class="bi bi-ticket-perforated"></i>
            <span>Mis números</span>
          </a>
        }
      </div>
    </header>

    <!-- ── Loading ─────────────────────────────────────────────────────── -->
    @if (loading()) {
      <div class="rd-loader">
        <div class="rd-loader__spinner" role="status" aria-label="Cargando">
          <div class="rd-spinner"></div>
        </div>
        <p class="rd-loader__text">Cargando rifa...</p>
      </div>
    }

    <!-- ── Main content ────────────────────────────────────────────────── -->
    @if (!loading() && raffle()) {

      <!-- Carousel -->
      @if (allImages().length > 0) {
        <div class="rd-carousel" aria-label="Imágenes del premio">
          <div class="rd-carousel__track">
            <img [src]="allImages()[activeImg()].url"
                 [alt]="allImages()[activeImg()].altText || raffle()!.title"
                 class="rd-carousel__img">
            <div class="rd-carousel__overlay"></div>
          </div>

          <!-- Raffle title floating at bottom of carousel -->
          <div class="rd-carousel__caption">
            <div class="rd-carousel__caption-inner">
              <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
                <span [class]="statusBadgeClass()">{{ operationalLabel() }}</span>
                @if (raffle()!.winnerNumber) {
                  <span class="rd-badge rd-badge--gold">
                    <i class="bi bi-trophy-fill"></i>Ganador: #{{ raffle()!.winnerNumber }}
                  </span>
                }
              </div>
              <h1 class="rd-carousel__title">{{ raffle()!.title }}</h1>
              <div class="d-flex align-items-center gap-3 flex-wrap">
                <span class="rd-carousel__price">{{ raffle()!.pricePerNumber | currencyAr }} por número</span>
                @if (raffle()!.drawDateTime) {
                  <span class="rd-carousel__meta">
                    <i class="bi bi-calendar3"></i>{{ formatDate(raffle()!.drawDateTime!) }}
                  </span>
                }
              </div>
            </div>
          </div>

          @if (allImages().length > 1) {
            <button class="rd-carousel__btn rd-carousel__btn--prev" (click)="prevImg()" aria-label="Imagen anterior">
              <i class="bi bi-chevron-left"></i>
            </button>
            <button class="rd-carousel__btn rd-carousel__btn--next" (click)="nextImg()" aria-label="Imagen siguiente">
              <i class="bi bi-chevron-right"></i>
            </button>
            <div class="rd-carousel__dots" role="tablist" aria-label="Imágenes">
              @for (img of allImages(); track $index) {
                <button class="rd-carousel__dot" [class.rd-carousel__dot--active]="$index === activeImg()"
                        (click)="activeImg.set($index)"
                        role="tab"
                        [attr.aria-selected]="$index === activeImg()"
                        [attr.aria-label]="'Imagen ' + ($index + 1)"></button>
              }
            </div>
          }
        </div>
      }

      <!-- No carousel: show info as hero strip -->
      @if (allImages().length === 0) {
        <div class="rd-hero-strip hero-gradient text-white">
          <div class="container py-4">
            <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <span [class]="statusBadgeClass()">{{ operationalLabel() }}</span>
              @if (raffle()!.winnerNumber) {
                <span class="rd-badge rd-badge--gold">
                  <i class="bi bi-trophy-fill"></i>Ganador: #{{ raffle()!.winnerNumber }}
                </span>
              }
            </div>
            <h1 class="fw-black display-6 mb-2" style="letter-spacing:-0.03em">{{ raffle()!.title }}</h1>
            @if (raffle()!.description) {
              <p class="opacity-75 mb-3">{{ raffle()!.description }}</p>
            }
            <div class="d-flex flex-wrap gap-3 opacity-90">
              <span class="d-flex align-items-center gap-1 small fw-semibold">
                <i class="bi bi-hash"></i>{{ raffle()!.totalNumbers }} números
              </span>
              <span class="d-flex align-items-center gap-1 small fw-semibold">
                <i class="bi bi-currency-exchange"></i>{{ raffle()!.pricePerNumber | currencyAr }} c/u
              </span>
            </div>
          </div>
        </div>
      }

      <!-- Info strip below carousel -->
      @if (allImages().length > 0 && raffle()!.description) {
        <div class="rd-desc-strip">
          <div class="container">
            <p class="mb-0 text-muted" style="font-size:.95rem">{{ raffle()!.description }}</p>
          </div>
        </div>
      }

      <!-- Prize card -->
      @if (raffle()!.prize) {
        <div class="rd-prize-wrap">
          <div class="container">
            <div class="rd-prize-card">
              <div class="rd-prize-card__glow"></div>
              <div class="rd-prize-card__inner">
                @if (raffle()!.prize!.imageUrl) {
                  <img [src]="raffle()!.prize!.imageUrl" [alt]="raffle()!.prize!.name"
                       class="rd-prize-card__img">
                } @else {
                  <div class="rd-prize-card__icon">
                    <i class="bi bi-trophy-fill"></i>
                  </div>
                }
                <div class="rd-prize-card__body">
                  <div class="rd-prize-card__label">
                    <i class="bi bi-trophy-fill"></i>Premio principal
                  </div>
                  <div class="rd-prize-card__name">{{ raffle()!.prize!.name }}</div>
                  @if (raffle()!.prize!.estimatedValue) {
                    <div class="rd-prize-card__value">
                      Valor estimado: <strong>{{ raffle()!.prize!.estimatedValue | currencyAr }}</strong>
                    </div>
                  }
                  @if (raffle()!.prize!.description) {
                    <div class="rd-prize-card__desc">{{ raffle()!.prize!.description }}</div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Progress strip -->
      <div class="rd-progress-strip">
        <div class="container">
          <div class="row g-3 align-items-center">
            <div class="col-md-9">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <div class="d-flex gap-4 flex-wrap">
                  <span class="rd-stat rd-stat--green">
                    <i class="bi bi-check-circle-fill"></i>{{ paidCount() }} confirmados
                  </span>
                  <span class="rd-stat rd-stat--amber">
                    <i class="bi bi-clock-fill"></i>{{ reservedCount() }} reservados
                  </span>
                  <span class="rd-stat rd-stat--gray">
                    <i class="bi bi-circle"></i>{{ availableCount() }} disponibles
                  </span>
                </div>
              </div>
              <div class="rd-progress-bar" role="progressbar"
                   [attr.aria-valuenow]="soldPercent()"
                   aria-valuemin="0" aria-valuemax="100">
                <div class="rd-progress-bar__paid"   [style.width.%]="paidPercent()"></div>
                <div class="rd-progress-bar__reserved" [style.width.%]="reservedPercent()"></div>
              </div>
            </div>
            <div class="col-md-3 text-md-end">
              <span class="rd-sold-pct text-gradient">
                {{ soldPercent() | number:'1.0-0' }}% vendido
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main: grid + form -->
      <div class="container rd-main-wrap">
        <div class="row g-4">

          <!-- Number grid -->
          <div class="col-lg-8">
            <div class="rd-grid-card">
              <!-- Grid header -->
              <div class="rd-grid-card__header">
                <div class="d-flex align-items-center gap-2">
                  <div class="rd-grid-card__icon-wrap">
                    <i class="bi bi-grid-3x3-gap-fill"></i>
                  </div>
                  <div>
                    <div class="rd-grid-card__title">Elegí tus números</div>
                    <div class="rd-grid-card__sub">{{ availableCount() }} disponibles de {{ totalNumbers() }}</div>
                  </div>
                </div>
                <!-- Legend -->
                <div class="rd-legend">
                  <span class="rd-legend__item">
                    <span class="rd-legend__dot rd-legend__dot--available"></span>Libre
                  </span>
                  <span class="rd-legend__item">
                    <span class="rd-legend__dot rd-legend__dot--selected"></span>Elegido
                  </span>
                  <span class="rd-legend__item">
                    <span class="rd-legend__dot rd-legend__dot--paid"></span>Vendido
                  </span>
                  <span class="rd-legend__item">
                    <span class="rd-legend__dot rd-legend__dot--winner"></span>Ganador
                  </span>
                </div>
              </div>

              <!-- Grid body -->
              <div class="rd-grid-card__body">
                <div class="number-grid">
                  @for (n of numbers(); track n.number) {
                    <button
                      type="button"
                      [class]="'number-cell number-cell--' + cellClass(n)"
                      [disabled]="!isAvailable(n)"
                      (click)="toggleNumber(n.number)"
                      [attr.aria-label]="'Número ' + n.number + ', ' + n.status"
                      [attr.aria-pressed]="isSelected(n.number)">
                      {{ n.number }}
                    </button>
                  }
                </div>
              </div>

              <!-- Selected footer -->
              @if (selected().length > 0) {
                <div class="rd-grid-card__footer">
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <span class="rd-grid-card__footer-label">
                      {{ selected().length }} número{{ selected().length !== 1 ? 's' : '' }}
                    </span>
                    <div class="d-flex flex-wrap gap-1">
                      @for (n of selected(); track n) {
                        <span class="rd-num-chip">{{ n }}</span>
                      }
                    </div>
                  </div>
                  <span class="rd-grid-card__footer-price">{{ totalPrice() | currencyAr }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Sidebar: form + organizer -->
          <div class="col-lg-4">

            <!-- Reserve card -->
            <div class="rd-reserve-card sticky-top" style="top:80px">

              <!-- Empty state -->
              @if (selected().length === 0) {
                <div class="rd-reserve-card__empty">
                  <div class="rd-reserve-card__empty-icon">
                    <i class="bi bi-hand-index-thumb-fill"></i>
                  </div>
                  <div class="rd-reserve-card__empty-title">Elegí un número</div>
                  <div class="rd-reserve-card__empty-sub">
                    Tocá cualquier número disponible en la grilla para agregarlo a tu reserva
                  </div>
                </div>
              }

              <!-- Form -->
              @if (selected().length > 0) {

                <!-- Success -->
                @if (reservationSuccess()) {
                  <div class="rd-success">
                    <div class="rd-success__icon">
                      <i class="bi bi-check-circle-fill"></i>
                    </div>
                    <div class="rd-success__title">¡Reserva creada!</div>
                    <p class="rd-success__sub">
                      Tu reserva expira en 30 minutos. Contactá al organizador para confirmar el pago.
                    </p>
                  </div>
                } @else {

                  <!-- Selection summary -->
                  <div class="rd-summary">
                    <div class="rd-summary__label">Tus números</div>
                    <div class="d-flex flex-wrap gap-1 mb-3">
                      @for (n of selected(); track n) {
                        <span class="rd-num-chip rd-num-chip--lg">{{ n }}</span>
                      }
                    </div>
                    <div class="d-flex justify-content-between align-items-baseline">
                      <span class="rd-summary__sub">Total a pagar</span>
                      <span class="rd-summary__price text-gradient">{{ totalPrice() | currencyAr }}</span>
                    </div>
                  </div>

                  <!-- Error alert -->
                  @if (reservationError()) {
                    <div class="rd-alert rd-alert--danger mb-3" role="alert">
                      <i class="bi bi-exclamation-triangle-fill"></i>
                      {{ reservationError() }}
                    </div>
                  }

                  <form [formGroup]="reserveForm" (ngSubmit)="submitReservation()">
                    <div formGroupName="participant" class="rd-form-section">
                      <div class="rd-form-section__title">Tus datos</div>

                      <div class="mb-3">
                        <label class="rd-label" for="fullName">Nombre completo *</label>
                        <input id="fullName" type="text" class="form-control"
                               formControlName="fullName" autocomplete="name"
                               placeholder="Juan Pérez"
                               [class.is-invalid]="rtouched('fullName') && reserveForm.get('participant.fullName')?.invalid">
                        <div class="invalid-feedback">Requerido</div>
                      </div>

                      <div class="mb-3">
                        <label class="rd-label" for="rPhone">
                          <i class="bi bi-whatsapp text-success me-1"></i>Teléfono / WhatsApp *
                        </label>
                        <input id="rPhone" type="tel" class="form-control"
                               formControlName="phone" autocomplete="tel"
                               placeholder="+54 9 11 1234-5678"
                               [class.is-invalid]="rtouched('phone') && reserveForm.get('participant.phone')?.invalid">
                        <div class="invalid-feedback">Requerido</div>
                      </div>

                      <div class="mb-2">
                        <label class="rd-label" for="rEmail">Email <span class="rd-label--opt">(opcional)</span></label>
                        <input id="rEmail" type="email" class="form-control"
                               formControlName="email" autocomplete="email"
                               placeholder="juan@email.com">
                      </div>
                    </div>

                    <!-- Access code -->
                    <div class="rd-form-section">
                      <div class="rd-form-section__title">Código de acceso</div>
                      <label class="rd-label" for="accessCode">Código del organizador</label>
                      <input id="accessCode" type="text" class="form-control"
                             formControlName="accessCode"
                             placeholder="Ej: RIFA-123456"
                             [class.is-invalid]="reserveForm.get('accessCode')?.touched && reserveForm.get('accessCode')?.invalid">
                      <div class="form-text mt-1" style="font-size:.78rem">
                        <i class="bi bi-info-circle me-1 text-primary"></i>
                        El organizador te lo comparte por WhatsApp o redes
                      </div>
                    </div>

                    <!-- Payment methods -->
                    @if (raffle()!.paymentMethods.length > 0) {
                      <div class="rd-form-section">
                        <div class="rd-form-section__title">Método de pago</div>
                        @for (pm of raffle()!.paymentMethods; track pm.displayName) {
                          <div class="rd-pm-card"
                               [class.rd-pm-card--active]="selectedPaymentMethod() === pm.displayName"
                               (click)="selectedPaymentMethod.set(pm.displayName)"
                               role="radio"
                               [attr.aria-checked]="selectedPaymentMethod() === pm.displayName"
                               tabindex="0"
                               (keydown.enter)="selectedPaymentMethod.set(pm.displayName)"
                               (keydown.space)="selectedPaymentMethod.set(pm.displayName)">
                            <div class="rd-pm-card__head">
                              <i class="bi" [class]="pmIcon(pm.type)" style="font-size:1.1rem"></i>
                              <span class="fw-semibold">{{ pm.displayName }}</span>
                              <i class="bi bi-check-circle-fill rd-pm-card__check ms-auto"></i>
                            </div>
                            @if (pm.alias) {
                              <div class="rd-pm-card__detail">Alias: <strong>{{ pm.alias }}</strong></div>
                            }
                            @if (pm.cbuCvu) {
                              <div class="rd-pm-card__detail">CBU/CVU: {{ pm.cbuCvu }}</div>
                            }
                            @if (pm.accountHolder) {
                              <div class="rd-pm-card__detail">Titular: {{ pm.accountHolder }}</div>
                            }
                            @if (pm.instructions) {
                              <div class="rd-pm-card__detail rd-pm-card__detail--note">
                                <i class="bi bi-chat-left-text me-1"></i>{{ pm.instructions }}
                              </div>
                            }
                          </div>
                        }
                      </div>
                    }

                    <!-- Payment form (mock checkout) -->
                    <div formGroupName="payment" class="rd-form-section">
                      <div class="d-flex align-items-center justify-content-between mb-3">
                        <div class="rd-form-section__title mb-0">Pago</div>
                        <span class="badge rounded-pill fw-semibold"
                              style="background:rgba(99,102,241,0.1);color:#6366f1;font-size:.7rem;border:1px solid rgba(99,102,241,0.15)">
                          Simulación visual
                        </span>
                      </div>

                      <!-- Mock MP card -->
                      <div class="rd-mp-card mb-3">
                        <div class="d-flex align-items-center justify-content-between">
                          <div>
                            <div class="small opacity-75 mb-0">Mercado Pago</div>
                            <div class="fw-bold">Pago online simulado</div>
                          </div>
                          <i class="bi bi-credit-card-2-front-fill" style="font-size:1.8rem;opacity:.9"></i>
                        </div>
                        <div class="small mt-2 opacity-65">
                          Integración anticipada · No procesa cobros reales
                        </div>
                      </div>

                      <div class="mb-2">
                        <label class="rd-label">Canal de pago</label>
                        <select class="form-select" formControlName="method">
                          <option value="MERCADO_PAGO">Mercado Pago</option>
                          <option value="TRANSFERENCIA">Transferencia bancaria</option>
                          <option value="MANUAL">Pago manual / efectivo</option>
                        </select>
                      </div>

                      <div class="mb-2">
                        <label class="rd-label" for="payerName">
                          Titular del pago <span class="rd-label--opt">(opcional)</span>
                        </label>
                        <input id="payerName" type="text" class="form-control"
                               formControlName="payerName"
                               placeholder="Nombre del titular">
                      </div>

                      <div class="mb-3">
                        <label class="rd-label" for="payRef">
                          Referencia / comprobante <span class="rd-label--opt">(opcional)</span>
                        </label>
                        <input id="payRef" type="text" class="form-control"
                               formControlName="reference"
                               placeholder="Operación, referencia o nota">
                      </div>

                      <div class="form-check mb-3">
                        <input id="paidCheck" class="form-check-input" type="checkbox" formControlName="paid">
                        <label class="form-check-label small fw-medium" for="paidCheck">
                          Ya realicé o simulé el pago
                        </label>
                      </div>

                      <button type="button"
                              class="btn btn-sm rounded-pill fw-semibold px-3 mb-1"
                              style="background:rgba(0,110,212,0.1);color:#006ed4;border:1px solid rgba(0,110,212,0.2)">
                        <i class="bi bi-wallet2 me-1"></i>Pagar con Mercado Pago
                      </button>
                    </div>

                    <!-- Submit -->
                    <button type="submit"
                            class="btn btn-gradient w-100 py-3 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2"
                            style="font-size:1rem"
                            [disabled]="reserving() || raffle()!.operationalStatus === 'EXECUTING' || raffle()!.operationalStatus === 'FINISHED'">
                      @if (reserving()) {
                        <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                        Reservando...
                      } @else {
                        <i class="bi bi-lock-fill"></i>Reservar {{ selected().length }} número{{ selected().length !== 1 ? 's' : '' }}
                      }
                    </button>
                  </form>
                }
              }
            </div>

            <!-- Organizer card -->
            <div class="rd-org-card mt-3">
              <div class="rd-org-card__label">Organiza esta rifa</div>
              <div class="d-flex align-items-center gap-3">
                @if (raffle()!.organizer.avatarUrl) {
                  <img [src]="raffle()!.organizer.avatarUrl" alt="Organizador"
                       class="rd-org-card__avatar">
                } @else {
                  <div class="rd-org-card__avatar rd-org-card__avatar--initial">
                    {{ raffle()!.organizer.displayName.charAt(0).toUpperCase() }}
                  </div>
                }
                <div>
                  <div class="fw-bold" style="font-size:.95rem">{{ raffle()!.organizer.displayName }}</div>
                  @if (raffle()!.organizer.whatsappNumber) {
                    <a [href]="'https://wa.me/' + raffle()!.organizer.whatsappNumber!.replace(/\\D/g, '')"
                       target="_blank" rel="noopener noreferrer"
                       class="rd-wa-btn mt-2">
                      <i class="bi bi-whatsapp"></i>Contactar por WhatsApp
                    </a>
                  }
                </div>
              </div>
            </div>

          </div><!-- /col sidebar -->
        </div><!-- /row -->
      </div><!-- /container -->

      <!-- Footer -->
      <footer class="rd-footer">
        <div class="rd-footer__inner">
          <span class="rd-footer__brand">
            <i class="bi bi-ticket-perforated-fill"></i>SuperSorteo
          </span>
          <span class="rd-footer__powered">Plataforma de rifas digitales</span>
        </div>
      </footer>
    }

    <!-- Error: not found -->
    @if (!loading() && !raffle()) {
      <div class="rd-not-found">
        <div class="rd-not-found__icon">
          <i class="bi bi-ticket-x"></i>
        </div>
        <h3 class="rd-not-found__title">Rifa no encontrada</h3>
        <p class="rd-not-found__sub">
          El enlace puede ser incorrecto o la rifa aún no está disponible.
        </p>
      </div>
    }
  `,
  styles: [`
    /* ── Host ─────────────────────────────────────── */
    :host {
      display: block;
      min-height: 100vh;
      background: #f3f4ff;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    }

    /* ── Header ───────────────────────────────────── */
    .rd-header {
      background: rgba(9,9,11,0.92);
      backdrop-filter: blur(16px) saturate(1.6);
      -webkit-backdrop-filter: blur(16px) saturate(1.6);
      border-bottom: 1px solid rgba(99,102,241,0.18);
      padding: .7rem 1.25rem;
      position: sticky; top: 0; z-index: 200;
    }
    .rd-header__inner {
      max-width: 1200px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
    }
    .rd-logo {
      display: flex; align-items: center; gap: .55rem;
      color: #fff; font-weight: 800; font-size: 1.1rem;
      letter-spacing: -0.025em;
    }
    .rd-logo i {
      font-size: 1.35rem;
      background: linear-gradient(135deg, #6366f1, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .rd-btn-outline {
      display: inline-flex; align-items: center; gap: .4rem;
      color: rgba(255,255,255,.82); text-decoration: none; font-weight: 600; font-size: .82rem;
      border: 1px solid rgba(255,255,255,.18); border-radius: 999px;
      padding: .38rem .9rem;
      backdrop-filter: blur(8px);
      transition: background .15s, border-color .15s, color .15s;
    }
    .rd-btn-outline:hover { background: rgba(255,255,255,.12); color: #fff; border-color: rgba(255,255,255,.3); }

    /* ── Loading ──────────────────────────────────── */
    .rd-loader {
      min-height: 70vh;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 1rem;
    }
    .rd-loader__spinner { position: relative; width: 56px; height: 56px; }
    .rd-spinner {
      width: 56px; height: 56px; border-radius: 50%;
      border: 3px solid rgba(99,102,241,.15);
      border-top-color: #6366f1;
      animation: spin-slow 0.8s linear infinite;
    }
    .rd-loader__text { color: #71717a; font-weight: 500; font-size: .9rem; }

    /* ── Carousel ─────────────────────────────────── */
    .rd-carousel {
      position: relative; width: 100%; overflow: hidden;
      background: #09090b; max-height: 520px;
    }
    .rd-carousel__track { width: 100%; }
    .rd-carousel__img {
      width: 100%; height: 520px; object-fit: cover; display: block;
      transition: opacity .45s ease;
    }
    .rd-carousel__overlay {
      position: absolute; inset: 0;
      background: linear-gradient(
        to bottom,
        rgba(9,9,11,0.08) 0%,
        rgba(9,9,11,0.1) 30%,
        rgba(9,9,11,0.65) 70%,
        rgba(9,9,11,0.88) 100%
      );
      pointer-events: none;
    }
    /* Floating caption inside carousel */
    .rd-carousel__caption {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 1.5rem;
      z-index: 2;
    }
    .rd-carousel__caption-inner { max-width: 1200px; margin: 0 auto; }
    .rd-carousel__title {
      margin: 0 0 .5rem; color: #fff; font-size: clamp(1.4rem, 4vw, 2.2rem);
      font-weight: 900; letter-spacing: -0.04em; line-height: 1.1;
      text-shadow: 0 2px 24px rgba(0,0,0,.4);
    }
    .rd-carousel__price {
      color: #fbbf24; font-weight: 800; font-size: 1rem;
      text-shadow: 0 2px 10px rgba(0,0,0,.3);
    }
    .rd-carousel__meta {
      color: rgba(255,255,255,.7); font-size: .82rem; font-weight: 500;
      display: flex; align-items: center; gap: .35rem;
    }
    .rd-carousel__btn {
      position: absolute; top: 50%; transform: translateY(-50%);
      background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.18);
      color: #fff; width: 46px; height: 46px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; cursor: pointer;
      backdrop-filter: blur(12px);
      transition: background .15s, transform .2s;
      z-index: 3;
    }
    .rd-carousel__btn:hover {
      background: rgba(255,255,255,.28);
      transform: translateY(-50%) scale(1.08);
    }
    .rd-carousel__btn--prev { left: 1.25rem; }
    .rd-carousel__btn--next { right: 1.25rem; }
    .rd-carousel__dots {
      position: absolute; bottom: 1.5rem; right: 1.5rem;
      display: flex; gap: .4rem; z-index: 3;
    }
    .rd-carousel__dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: rgba(255,255,255,.38); border: none; cursor: pointer;
      transition: all .25s ease;
    }
    .rd-carousel__dot--active { width: 22px; border-radius: 4px; background: #fff; }

    /* ── Badges ───────────────────────────────────── */
    .rd-badge {
      display: inline-flex; align-items: center; gap: .3rem;
      padding: .25rem .7rem; border-radius: 999px;
      font-size: .75rem; font-weight: 700; letter-spacing: .02em;
    }
    .rd-badge--gold {
      background: linear-gradient(135deg, rgba(251,191,36,.22), rgba(239,68,68,.18));
      color: #fbbf24; border: 1px solid rgba(251,191,36,.3);
    }

    /* ── Description strip ────────────────────────── */
    .rd-desc-strip {
      background: #fff; border-bottom: 1px solid #ebebf5; padding: .9rem 0;
    }

    /* ── Hero strip (no carousel) ─────────────────── */
    .rd-hero-strip { padding: 2.5rem 0; }

    /* ── Prize card ───────────────────────────────── */
    .rd-prize-wrap { background: #fff; padding: 1.1rem 0; border-bottom: 1px solid #ebebf5; }
    .rd-prize-card {
      position: relative; overflow: hidden;
      border-radius: 1.25rem;
      background: linear-gradient(135deg, #09090b, #1c1240);
      border: 1px solid rgba(251,191,36,.25);
      padding: 1.25rem;
    }
    .rd-prize-card__glow {
      position: absolute; top: -40px; right: -40px;
      width: 180px; height: 180px; border-radius: 50%;
      background: radial-gradient(circle, rgba(251,191,36,0.25), transparent 70%);
      pointer-events: none;
    }
    .rd-prize-card__inner {
      display: flex; align-items: center; gap: 1.25rem; position: relative; z-index: 1;
    }
    .rd-prize-card__img {
      width: 90px; height: 90px; object-fit: cover;
      border-radius: 1rem; flex-shrink: 0;
      box-shadow: 0 8px 24px rgba(0,0,0,.3);
      border: 2px solid rgba(251,191,36,.3);
    }
    .rd-prize-card__icon {
      width: 90px; height: 90px; border-radius: 1rem; flex-shrink: 0;
      background: linear-gradient(135deg, rgba(251,191,36,.2), rgba(239,68,68,.12));
      border: 2px solid rgba(251,191,36,.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 2.2rem; color: #fbbf24;
      box-shadow: 0 0 24px rgba(251,191,36,.25);
    }
    .rd-prize-card__label {
      display: flex; align-items: center; gap: .35rem;
      color: #fbbf24; font-size: .72rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .1em; margin-bottom: .3rem;
    }
    .rd-prize-card__name {
      color: #fff; font-size: 1.2rem; font-weight: 800;
      letter-spacing: -0.02em; line-height: 1.2; margin-bottom: .25rem;
    }
    .rd-prize-card__value { color: #4ade80; font-size: .88rem; font-weight: 700; margin-bottom: .25rem; }
    .rd-prize-card__desc { color: rgba(255,255,255,.55); font-size: .82rem; }

    /* ── Progress strip ───────────────────────────── */
    .rd-progress-strip {
      background: #fff; border-bottom: 1px solid #ebebf5; padding: 1rem 0;
    }
    .rd-stat {
      display: inline-flex; align-items: center; gap: .3rem;
      font-size: .8rem; font-weight: 700;
    }
    .rd-stat--green { color: #059669; }
    .rd-stat--amber { color: #d97706; }
    .rd-stat--gray  { color: #71717a; }
    .rd-progress-bar {
      height: 10px; border-radius: 999px; overflow: hidden;
      background: #e4e4e7; display: flex;
    }
    .rd-progress-bar__paid {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #059669);
      transition: width .5s ease;
    }
    .rd-progress-bar__reserved {
      height: 100%;
      background: linear-gradient(90deg, #fbbf24, #f59e0b);
      transition: width .5s ease;
    }
    .rd-sold-pct {
      font-size: 1.4rem; font-weight: 900; letter-spacing: -0.04em;
    }

    /* ── Main wrap ────────────────────────────────── */
    .rd-main-wrap { padding-top: 2rem; padding-bottom: 3rem; }

    /* ── Grid card ────────────────────────────────── */
    .rd-grid-card {
      border-radius: 1.5rem; overflow: hidden;
      background: #fff;
      box-shadow: 0 4px 24px rgba(99,102,241,.08), 0 1px 4px rgba(0,0,0,.05);
      border: 1px solid rgba(99,102,241,.07);
    }
    .rd-grid-card__header {
      background: linear-gradient(135deg, #09090b 0%, #1e1b4b 55%, #3b0764 100%);
      padding: 1rem 1.25rem;
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: .75rem;
    }
    .rd-grid-card__icon-wrap {
      width: 38px; height: 38px; border-radius: .7rem; flex-shrink: 0;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 1rem;
      box-shadow: 0 4px 12px rgba(99,102,241,.4);
    }
    .rd-grid-card__title {
      color: #fff; font-weight: 800; font-size: .95rem; letter-spacing: -0.015em;
    }
    .rd-grid-card__sub {
      color: rgba(255,255,255,.5); font-size: .75rem; font-weight: 500; margin-top: 1px;
    }
    .rd-legend {
      display: flex; flex-wrap: wrap; gap: .5rem .8rem;
    }
    .rd-legend__item {
      display: flex; align-items: center; gap: .35rem;
      color: rgba(255,255,255,.65); font-size: .72rem; font-weight: 600;
    }
    .rd-legend__dot {
      width: 14px; height: 14px; border-radius: 4px; border: 2px solid transparent;
    }
    .rd-legend__dot--available { background: #fff; border-color: #c7d2fe; }
    .rd-legend__dot--selected  { background: linear-gradient(135deg,#6366f1,#a855f7); border-color: #6366f1; }
    .rd-legend__dot--paid      { background: linear-gradient(135deg,#d1fae5,#a7f3d0); border-color: #34d399; }
    .rd-legend__dot--winner    { background: linear-gradient(135deg,#fbbf24,#ef4444); border-color: #d97706; }

    .rd-grid-card__body { padding: 1rem; }

    .rd-grid-card__footer {
      background: #f3f4ff; border-top: 1px solid #e0e3ff; padding: .85rem 1.25rem;
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: .5rem;
    }
    .rd-grid-card__footer-label {
      color: #6366f1; font-weight: 700; font-size: .85rem; margin-right: .35rem;
    }
    .rd-grid-card__footer-price {
      font-size: 1.3rem; font-weight: 900; letter-spacing: -0.03em;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }

    /* Number chips */
    .rd-num-chip {
      display: inline-flex; align-items: center; justify-content: center;
      padding: .18rem .55rem; border-radius: .4rem;
      background: linear-gradient(135deg, #eef2ff, #e0e3ff);
      color: #4338ca; font-size: .72rem; font-weight: 800; border: 1px solid #c7d2fe;
    }
    .rd-num-chip--lg {
      padding: .3rem .75rem; font-size: .85rem; border-radius: .5rem;
    }

    /* ── Reserve card ─────────────────────────────── */
    .rd-reserve-card {
      border-radius: 1.5rem; overflow: hidden;
      background: #fff;
      box-shadow: 0 8px 40px rgba(99,102,241,.12), 0 2px 8px rgba(0,0,0,.06);
      border: 1px solid rgba(99,102,241,.1);
      padding: 1.5rem;
    }

    /* Empty state */
    .rd-reserve-card__empty {
      text-align: center; padding: 2.5rem 1rem;
    }
    .rd-reserve-card__empty-icon {
      width: 70px; height: 70px; border-radius: 1.2rem; margin: 0 auto 1rem;
      background: linear-gradient(135deg, #eef2ff, #e0e3ff);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.8rem; color: #6366f1;
      animation: float-slow 4s ease-in-out infinite;
    }
    .rd-reserve-card__empty-title {
      font-weight: 800; font-size: 1.05rem; color: #18181b; margin-bottom: .4rem;
    }
    .rd-reserve-card__empty-sub {
      color: #71717a; font-size: .85rem; line-height: 1.55;
    }

    /* Selection summary */
    .rd-summary {
      background: linear-gradient(135deg, #09090b, #1e1b4b);
      border-radius: 1rem; padding: 1.1rem 1.25rem; margin-bottom: 1.25rem;
    }
    .rd-summary__label {
      color: rgba(255,255,255,.55); font-size: .7rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .08em; margin-bottom: .5rem;
    }
    .rd-summary__sub {
      color: rgba(255,255,255,.5); font-size: .82rem;
    }
    .rd-summary__price {
      font-size: 1.5rem; font-weight: 900; letter-spacing: -0.04em;
    }

    /* Alert */
    .rd-alert {
      display: flex; align-items: flex-start; gap: .5rem;
      padding: .7rem .9rem; border-radius: .75rem;
      font-size: .85rem; font-weight: 500;
    }
    .rd-alert--danger {
      background: #fff1f2; color: #be123c; border: 1px solid rgba(244,63,94,.2);
    }

    /* Form sections */
    .rd-form-section {
      border-radius: 1rem; background: #fafaff;
      border: 1px solid #e0e3ff; padding: 1rem 1.1rem; margin-bottom: 1rem;
    }
    .rd-form-section__title {
      font-size: .75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .09em; color: #71717a; margin-bottom: .85rem;
    }
    .rd-label {
      display: block; font-size: .82rem; font-weight: 700; color: #3f3f46; margin-bottom: .3rem;
    }
    .rd-label--opt { font-weight: 400; color: #a1a1aa; font-size: .78rem; }

    /* Payment method cards */
    .rd-pm-card {
      border: 1.5px solid #e0e3ff; border-radius: .875rem;
      padding: .75rem 1rem; margin-bottom: .6rem; cursor: pointer;
      transition: border-color .18s, background .18s, box-shadow .18s;
      background: #fff;
    }
    .rd-pm-card:hover { border-color: #a5b4fc; background: #f5f6ff; }
    .rd-pm-card--active {
      border-color: #6366f1; background: #f3f4ff;
      box-shadow: 0 0 0 3px rgba(99,102,241,.15);
    }
    .rd-pm-card__head {
      display: flex; align-items: center; gap: .6rem;
      color: #18181b; font-weight: 700; font-size: .88rem;
    }
    .rd-pm-card__check {
      color: #c7d2fe; font-size: .9rem; transition: color .18s;
    }
    .rd-pm-card--active .rd-pm-card__check { color: #6366f1; }
    .rd-pm-card__detail {
      padding-left: 1.8rem; color: #71717a; font-size: .78rem; margin-top: .2rem;
    }
    .rd-pm-card__detail--note { color: #4338ca; font-style: italic; }

    /* Mock Mercado Pago card */
    .rd-mp-card {
      border-radius: .875rem; padding: 1rem;
      background: linear-gradient(135deg, #009ee3 0%, #0068b5 100%);
      color: #fff;
    }

    /* Success state */
    .rd-success {
      text-align: center; padding: 2rem 1rem;
    }
    .rd-success__icon {
      width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 1rem;
      background: linear-gradient(135deg, #10b981, #059669);
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem; color: #fff;
      box-shadow: 0 8px 30px rgba(16,185,129,.4);
      animation: scale-in .5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .rd-success__title {
      font-size: 1.3rem; font-weight: 900; color: #065f46; margin-bottom: .5rem;
    }
    .rd-success__sub { color: #6b7280; font-size: .88rem; line-height: 1.6; }

    /* ── Organizer card ───────────────────────────── */
    .rd-org-card {
      background: #fff; border-radius: 1.25rem; padding: 1.25rem;
      box-shadow: 0 4px 20px rgba(99,102,241,.08);
      border: 1px solid rgba(99,102,241,.07);
    }
    .rd-org-card__label {
      font-size: .7rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .09em; color: #a1a1aa; margin-bottom: .85rem;
    }
    .rd-org-card__avatar {
      width: 52px; height: 52px; border-radius: 50%; object-fit: cover;
      border: 2.5px solid rgba(99,102,241,.25); flex-shrink: 0;
    }
    .rd-org-card__avatar--initial {
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; font-weight: 800; font-size: 1.3rem;
      flex-shrink: 0;
    }
    .rd-wa-btn {
      display: inline-flex; align-items: center; gap: .4rem;
      background: linear-gradient(135deg, #25d366, #128c7e);
      color: #fff; text-decoration: none;
      padding: .4rem .9rem; border-radius: 999px;
      font-size: .8rem; font-weight: 700;
      transition: transform .15s, box-shadow .25s;
      box-shadow: 0 4px 14px rgba(37,211,102,.3);
    }
    .rd-wa-btn:hover {
      color: #fff; transform: translateY(-2px);
      box-shadow: 0 8px 22px rgba(37,211,102,.45);
    }

    /* ── Footer ───────────────────────────────────── */
    .rd-footer {
      background: #09090b; border-top: 1px solid rgba(99,102,241,.12);
      padding: 1.25rem;
    }
    .rd-footer__inner {
      max-width: 1200px; margin: 0 auto;
      display: flex; align-items: center; justify-content: center; gap: .75rem;
      flex-wrap: wrap;
    }
    .rd-footer__brand {
      display: flex; align-items: center; gap: .45rem;
      font-weight: 800; font-size: .9rem;
      background: linear-gradient(135deg, #6366f1, #ec4899);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .rd-footer__brand i { font-size: 1rem; }
    .rd-footer__powered { color: rgba(255,255,255,.3); font-size: .78rem; }

    /* ── Not found ────────────────────────────────── */
    .rd-not-found {
      min-height: 70vh; display: flex; flex-direction: column;
      align-items: center; justify-content: center; text-align: center; padding: 2rem;
    }
    .rd-not-found__icon {
      font-size: 4.5rem; color: #d4d4d8; margin-bottom: 1rem;
      animation: float-slow 5s ease-in-out infinite;
    }
    .rd-not-found__title { font-size: 1.5rem; font-weight: 800; color: #3f3f46; margin-bottom: .5rem; }
    .rd-not-found__sub   { color: #71717a; max-width: 360px; line-height: 1.6; }

    /* ── Responsive ───────────────────────────────── */
    @media (max-width: 576px) {
      .rd-carousel__img { height: 280px; }
      .rd-carousel { max-height: 280px; }
      .rd-carousel__title { font-size: 1.2rem; }
      .rd-legend { display: none; }
      .rd-reserve-card { border-radius: 1.25rem; padding: 1.1rem; }
    }
  `]
})
export class RaffleDetail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly raffleService = inject(RaffleService);
  private readonly reservationService = inject(ReservationService);
  private readonly ws = inject(WebSocketService);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);

  protected readonly loading = signal(true);
  protected readonly raffle = signal<RafflePublicResponse | null>(null);
  protected readonly numbers = signal<NumberInfo[]>([]);
  protected readonly selected = signal<number[]>([]);
  protected readonly reserving = signal(false);
  protected readonly reservationSuccess = signal(false);
  protected readonly reservationError = signal('');
  protected readonly selectedPaymentMethod = signal('');
  protected readonly activeImg = signal(0);
  protected readonly liveCountdown = signal<number | null>(null);
  protected readonly liveWinnerNumber = signal<number | null>(null);
  protected readonly showLiveDraw = signal(false);

  protected readonly allImages = computed(() => {
    const raffle = this.raffle();
    if (!raffle) return [];
    const images = [...raffle.images].sort((a, b) => a.displayOrder - b.displayOrder);
    if (raffle.prize?.imageUrl && !images.some(i => i.url === raffle.prize!.imageUrl)) {
      images.unshift({ url: raffle.prize.imageUrl, altText: raffle.prize.name, coverImage: false, displayOrder: -1 });
    }
    return images;
  });

  protected readonly availableCount = computed(() => this.raffle()?.availableCount ?? 0);
  protected readonly reservedCount = computed(() => this.raffle()?.reservedCount ?? 0);
  protected readonly paidCount = computed(() => this.raffle()?.paidCount ?? 0);
  protected readonly totalNumbers = computed(() => this.raffle()?.totalNumbers ?? 1);
  protected readonly paidPercent = computed(() => (this.paidCount() / this.totalNumbers()) * 100);
  protected readonly reservedPercent = computed(() => (this.reservedCount() / this.totalNumbers()) * 100);
  protected readonly soldPercent = computed(() => ((this.paidCount() + this.reservedCount()) / this.totalNumbers()) * 100);
  protected readonly totalPrice = computed(() => this.selected().length * (this.raffle()?.pricePerNumber ?? 0));

  protected readonly reserveForm = this.fb.group({
    participant: this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', Validators.required],
      email: [''],
    }),
    accessCode: ['', Validators.required],
    payment: this.fb.group({
      method: ['MERCADO_PAGO'],
      payerName: [''],
      reference: [''],
      paid: [false],
    }),
  });

  private wsSubs: Subscription[] = [];
  private slideTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.raffleService.getPublic(slug).subscribe({
      next: raffle => {
        this.raffle.set(raffle);
        this.loading.set(false);
        this.loadNumbers(slug);
        this.connectWebSocket(raffle.id);
        this.startSlideTimer();
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy(): void {
    for (const sub of this.wsSubs) sub.unsubscribe();
    this.ws.disconnect();
    clearInterval(this.slideTimer);
  }

  private loadNumbers(slug: string): void {
    this.raffleService.getNumbers(slug).subscribe(numbers => this.numbers.set(numbers));
  }

  private connectWebSocket(raffleId: string): void {
    this.ws.connect().then(() => {
      this.wsSubs = [
        this.ws.subscribe<{ reservedNumbers: number[] }>(`/topic/raffle/${raffleId}/numbers`).subscribe(evt => {
          this.numbers.update(numbers =>
            numbers.map(number =>
              evt.reservedNumbers.includes(number.number)
                ? { ...number, status: 'RESERVED' as NumberStatus }
                : number
            )
          );
        }),
        this.ws.subscribe<{ available: number; reserved: number; paid: number }>(`/topic/raffle/${raffleId}/progress`).subscribe(evt => {
          this.raffle.update(raffle => raffle ? {
            ...raffle,
            availableCount: evt.available,
            reservedCount: evt.reserved,
            paidCount: evt.paid,
            operationalStatus: raffle.operationalStatus === 'FINISHED'
              ? raffle.operationalStatus
              : (evt.available === 0 ? 'SOLD_OUT' : raffle.operationalStatus),
          } : raffle);
        }),
        this.ws.subscribe<{ status: string }>(`/topic/raffle/${raffleId}/status`).subscribe(evt => {
          if (evt.status === 'EXECUTING') {
            this.showLiveDraw.set(true);
            this.liveCountdown.set(5);
            this.liveWinnerNumber.set(null);
            this.raffle.update(raffle => raffle ? { ...raffle, operationalStatus: 'EXECUTING' } : raffle);
          }
          if (evt.status === 'FAILED') {
            this.showLiveDraw.set(false);
            this.liveCountdown.set(null);
            this.liveWinnerNumber.set(null);
            this.raffle.update(raffle => raffle ? { ...raffle, operationalStatus: 'ACTIVE' } : raffle);
          }
        }),
        this.ws.subscribe<{ secondsRemaining: number }>(`/topic/raffle/${raffleId}/countdown`).subscribe(evt => {
          this.showLiveDraw.set(true);
          this.liveCountdown.set(evt.secondsRemaining);
        }),
        this.ws.subscribe<{ winnerNumber: number; winnerName?: string }>(`/topic/raffle/${raffleId}/result`).subscribe(evt => {
          this.liveCountdown.set(null);
          this.liveWinnerNumber.set(evt.winnerNumber);
          this.raffle.update(raffle => raffle ? {
            ...raffle,
            operationalStatus: 'FINISHED',
            winnerNumber: evt.winnerNumber,
            winnerName: evt.winnerName || raffle.winnerName,
          } : raffle);
          this.numbers.update(numbers =>
            numbers.map(number => number.number === evt.winnerNumber
              ? { ...number, status: 'WINNER' as NumberStatus }
              : number
            )
          );
          this.selected.set([]);
          setTimeout(() => this.showLiveDraw.set(false), 3200);
        }),
      ];
    });
  }

  private startSlideTimer(): void {
    if (this.allImages().length < 2) return;
    this.slideTimer = setInterval(() => {
      this.activeImg.update(index => (index + 1) % this.allImages().length);
    }, 4000);
  }

  protected prevImg(): void {
    clearInterval(this.slideTimer);
    this.activeImg.update(index => (index - 1 + this.allImages().length) % this.allImages().length);
    this.startSlideTimer();
  }

  protected nextImg(): void {
    clearInterval(this.slideTimer);
    this.activeImg.update(index => (index + 1) % this.allImages().length);
    this.startSlideTimer();
  }

  protected isAvailable(n: NumberInfo): boolean {
    return n.status === 'AVAILABLE'
      && this.raffle()?.operationalStatus !== 'FINISHED'
      && this.raffle()?.operationalStatus !== 'EXECUTING';
  }

  protected isSelected(num: number): boolean {
    return this.selected().includes(num);
  }

  protected cellClass(n: NumberInfo): string {
    if (this.isSelected(n.number)) return 'selected';
    return n.status.toLowerCase();
  }

  protected toggleNumber(num: number): void {
    this.reservationSuccess.set(false);
    this.reservationError.set('');
    this.selected.update(selected =>
      selected.includes(num) ? selected.filter(n => n !== num) : [...selected, num]
    );
  }

  protected rtouched(field: string): boolean {
    return !!this.reserveForm.get('participant')?.get(field)?.touched;
  }

  protected pmIcon(type: string): string {
    const icons: Record<string, string> = {
      MERCADO_PAGO: 'bi-credit-card-2-front-fill text-primary',
      ALIAS_CBU: 'bi-bank text-success',
      TRANSFER: 'bi-arrow-left-right text-info',
      CASH: 'bi-cash text-warning',
      WALLET: 'bi-wallet2',
    };
    return icons[type] ?? 'bi-credit-card text-muted';
  }

  protected formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  protected operationalLabel(): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Activa', SOLD_OUT: 'Agotada', PENDING_DRAW: 'Sorteo pronto',
      EXECUTING: 'Sorteando...', FINISHED: 'Finalizada', CANCELLED: 'Cancelada',
    };
    return labels[this.raffle()?.operationalStatus ?? ''] ?? '';
  }

  protected statusBadgeClass(): string {
    const classes: Record<string, string> = {
      ACTIVE: 'badge bg-success', SOLD_OUT: 'badge bg-warning text-dark',
      PENDING_DRAW: 'badge bg-info', EXECUTING: 'badge bg-warning text-dark',
      FINISHED: 'badge bg-secondary', CANCELLED: 'badge bg-danger',
    };
    return classes[this.raffle()?.operationalStatus ?? ''] ?? 'badge bg-secondary';
  }

  protected submitReservation(): void {
    this.reserveForm.markAllAsTouched();
    if (this.reserveForm.invalid || this.selected().length === 0) return;
    if (this.raffle()?.operationalStatus === 'EXECUTING' || this.raffle()?.operationalStatus === 'FINISHED') return;

    this.reserving.set(true);
    this.reservationSuccess.set(false);
    this.reservationError.set('');

    const participant = this.reserveForm.get('participant')!.getRawValue() as {
      fullName: string; phone: string; email: string;
    };
    const accessCode = (this.reserveForm.get('accessCode')?.value ?? '').trim();

    this.reservationService.create({
      raffleSlug: this.raffle()!.slug,
      numbers: this.selected(),
      participant: { fullName: participant.fullName, phone: participant.phone, email: participant.email || undefined },
      accessCode,
    }).subscribe({
      next: () => {
        this.reservationSuccess.set(true);
        this.reserving.set(false);
        this.notifications.success(
          'Reserva creada',
          'Tu reserva expirará en 30 minutos si no se confirma el pago.'
        );
        this.numbers.update(numbers =>
          numbers.map(number =>
            this.selected().includes(number.number)
              ? { ...number, status: 'RESERVED' as NumberStatus }
              : number
          )
        );
        this.selected.set([]);
      },
      error: (e: { message: string }) => {
        this.reservationError.set(e.message ?? 'Error al crear la reserva');
        this.reserving.set(false);
        this.notifications.error(
          'No se pudo crear la reserva',
          e.message ?? 'Verifica el código de acceso y los datos ingresados.'
        );
      },
    });
  }
}
