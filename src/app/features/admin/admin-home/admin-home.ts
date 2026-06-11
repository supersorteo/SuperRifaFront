import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { AdminOrganizer } from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-home',
  template: `
    <div class="mb-4">
      <h2 class="fw-black mb-1" style="color:#f1f5f9">Panel de Administración</h2>
      <p style="color:#64748b">Vista general de la plataforma</p>
    </div>

    <!-- Stats -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-xl-3">
        <div class="admin-stat-card">
          <i class="bi bi-people-fill admin-stat-card__icon" style="color:#818cf8"></i>
          <div class="admin-stat-card__value">{{ organizers().length }}</div>
          <div class="admin-stat-card__label">Organizadores</div>
        </div>
      </div>
      <div class="col-6 col-xl-3">
        <div class="admin-stat-card">
          <i class="bi bi-check-circle-fill admin-stat-card__icon" style="color:#34d399"></i>
          <div class="admin-stat-card__value">{{ activeCount() }}</div>
          <div class="admin-stat-card__label">Activos</div>
        </div>
      </div>
      <div class="col-6 col-xl-3">
        <div class="admin-stat-card">
          <i class="bi bi-slash-circle admin-stat-card__icon" style="color:#f87171"></i>
          <div class="admin-stat-card__value">{{ inactiveCount() }}</div>
          <div class="admin-stat-card__label">Inactivos</div>
        </div>
      </div>
      <div class="col-6 col-xl-3">
        <div class="admin-stat-card">
          <i class="bi bi-calendar-plus admin-stat-card__icon" style="color:#fbbf24"></i>
          <div class="admin-stat-card__value">{{ recentCount() }}</div>
          <div class="admin-stat-card__label">Nuevos (30 días)</div>
        </div>
      </div>
    </div>

  `,
  styles: [`
    .admin-stat-card {
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.07);
      border-radius: .875rem;
      padding: 1.25rem 1rem;
      text-align: center;
    }
    .admin-stat-card__icon { font-size: 1.6rem; margin-bottom: .5rem; display: block; }
    .admin-stat-card__value { font-size: 1.75rem; font-weight: 800; color: #f1f5f9; line-height: 1.1; }
    .admin-stat-card__label { font-size: .75rem; color: #64748b; margin-top: .2rem; }
  `]
})
export class AdminHome implements OnInit {
  private readonly adminService = inject(AdminService);

  protected readonly loading    = signal(true);
  protected readonly organizers = signal<AdminOrganizer[]>([]);

  protected readonly activeCount   = computed(() => this.organizers().filter(o => o.active).length);
  protected readonly inactiveCount = computed(() => this.organizers().filter(o => !o.active).length);
  protected readonly recentCount   = computed(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return this.organizers().filter(o => new Date(o.createdAt) >= cutoff).length;
  });

  ngOnInit(): void {
    this.adminService.getOrganizers().subscribe({
      next: data => { this.organizers.set(data); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }
}
