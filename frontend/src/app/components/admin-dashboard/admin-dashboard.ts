import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Translation, AdminStats } from '../../services/translation';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {
  stats: AdminStats | null = null;
  errorMessage = '';
  loading = true;

  constructor(private translationService: Translation, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.translationService.getAdminStats().subscribe({
      next: (res) => {
        this.stats = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.status === 403
          ? 'You do not have admin access.'
          : 'Failed to load dashboard.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}