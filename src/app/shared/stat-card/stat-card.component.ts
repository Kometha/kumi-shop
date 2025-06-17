import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss'
})
export class StatCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() icon: string = '';
  @Input() iconColor: string = 'primary';
  @Input() trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  @Input() prefix?: string = '';
  @Input() suffix?: string = '';
}
