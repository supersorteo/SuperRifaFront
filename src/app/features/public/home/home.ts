import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <!-- Hero -->
    <section class="hero-gradient text-white py-5">
      <div class="container py-4">
        <div class="row align-items-center g-5">
          <div class="col-lg-6">
            <span class="badge bg-white bg-opacity-20 text-white mb-3">
              <i class="bi bi-shield-check me-1"></i>Plataforma segura y transparente
            </span>
            <h1 class="display-4 fw-bold mb-3">
              Organizá rifas online de forma <span class="text-warning">profesional</span>
            </h1>
            <p class="lead opacity-75 mb-4">
              Creá tu rifa en minutos, vendé números digitales y sorteá con total transparencia.
              Pagos via Mercado Pago, transferencia o efectivo.
            </p>
            <div class="d-flex flex-wrap gap-3">
              <a routerLink="/auth/register" class="btn btn-warning btn-lg fw-bold px-4">
                <i class="bi bi-rocket-takeoff me-2"></i>Empezar gratis
              </a>
              <a routerLink="/auth/login" class="btn btn-outline-light btn-lg px-4">
                Iniciar sesión
              </a>
            </div>
          </div>
          <div class="col-lg-6 text-center">
            <div class="card-glass p-4 d-inline-block">
              <i class="bi bi-ticket-perforated-fill text-primary" style="font-size:6rem"></i>
              <div class="mt-3 row g-2 text-dark text-start">
                <div class="col-6">
                  <div class="bg-white rounded p-2 text-center shadow-sm">
                    <div class="fs-4 fw-bold text-primary">100%</div>
                    <div class="small text-muted">Digital</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="bg-white rounded p-2 text-center shadow-sm">
                    <div class="fs-4 fw-bold text-success">Gratis</div>
                    <div class="small text-muted">Para empezar</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="bg-white rounded p-2 text-center shadow-sm">
                    <div class="fs-4 fw-bold text-warning">⚡</div>
                    <div class="small text-muted">Tiempo real</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="bg-white rounded p-2 text-center shadow-sm">
                    <div class="fs-4 fw-bold text-info">🔒</div>
                    <div class="small text-muted">Seguro</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-5 bg-white">
      <div class="container">
        <div class="text-center mb-5">
          <h2 class="fw-bold">Todo lo que necesitás</h2>
          <p class="text-muted">Una plataforma completa para organizar rifas como un profesional</p>
        </div>
        <div class="row g-4">
          @for (f of features; track f.icon) {
            <div class="col-md-4">
              <div class="d-flex gap-3">
                <div class="rounded-3 bg-primary bg-opacity-10 p-3 flex-shrink-0" style="height:fit-content">
                  <i [class]="'bi ' + f.icon + ' fs-4 text-primary'"></i>
                </div>
                <div>
                  <h5 class="fw-semibold mb-1">{{ f.title }}</h5>
                  <p class="text-muted small mb-0">{{ f.desc }}</p>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="hero-gradient text-white py-5">
      <div class="container text-center py-3">
        <h2 class="fw-bold mb-3">¿Listo para tu próxima rifa?</h2>
        <p class="opacity-75 mb-4">Creá tu cuenta gratis y publicá tu primera rifa en minutos</p>
        <a routerLink="/auth/register" class="btn btn-warning btn-lg fw-bold px-5">
          <i class="bi bi-arrow-right-circle me-2"></i>Comenzar ahora
        </a>
      </div>
    </section>
  `
})
export class Home {
  protected readonly features = [
    { icon: 'bi-grid-3x3-gap-fill', title: 'Grilla de números interactiva', desc: 'Tus participantes eligen sus números con una experiencia visual moderna y en tiempo real.' },
    { icon: 'bi-credit-card-2-front', title: 'Múltiples métodos de pago', desc: 'Mercado Pago, transferencia bancaria, alias CBU/CVU o efectivo. Vos decidís.' },
    { icon: 'bi-lightning-charge-fill', title: 'Tiempo real con WebSocket', desc: 'Los números reservados se actualizan instantáneamente para todos los participantes.' },
    { icon: 'bi-stars', title: 'Sorteo transparente', desc: 'Ejecutá el sorteo de forma manual, automática o con proveedor externo certificado.' },
    { icon: 'bi-shield-check-fill', title: 'Seguro y auditable', desc: 'Cada acción queda registrada con log de auditoría. Total trazabilidad.' },
    { icon: 'bi-graph-up-arrow', title: 'Dashboard completo', desc: 'Gestioná reservas, pagos y participantes desde un panel intuitivo.' },
  ];
}
