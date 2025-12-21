import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-compras',
  imports: [
    CommonModule,
    ToastModule,
  ],
  templateUrl: './compras.component.html',
  styleUrl: './compras.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComprasComponent { }
