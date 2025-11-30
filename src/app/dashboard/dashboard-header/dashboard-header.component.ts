import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TraditionalAuthService } from '../../services/traditional-auth.service';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule
  ],
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.scss'
})
export class DashboardHeaderComponent {
  @Input() title: string = 'Kumi Shop';
  @Output() openSidebar = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  constructor(public authService: TraditionalAuthService) {}

  onOpenSidebar(): void {
    this.openSidebar.emit();
  }

  onLogout(): void {
    this.logout.emit();
  }
}
