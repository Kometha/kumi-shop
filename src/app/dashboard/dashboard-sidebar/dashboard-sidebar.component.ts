import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    DrawerModule
  ],
  templateUrl: './dashboard-sidebar.component.html',
  styleUrl: './dashboard-sidebar.component.scss'
})
export class DashboardSidebarComponent {
  private _visible: boolean = false;

  @Input()
  get visible(): boolean {
    return this._visible;
  }
  set visible(value: boolean) {
    this._visible = value;
    this.visibleChange.emit(value);
  }

  @Input() selectedMenu: string = 'dashboard';
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() menuSelected = new EventEmitter<string>();

  constructor(private router: Router) {}

  onVisibleChange(visible: boolean): void {
    this._visible = visible;
    this.visibleChange.emit(visible);
  }

  onMenuSelect(menu: string): void {
    // Mapear el menú a la ruta correspondiente
    const routes: { [key: string]: string } = {
      'dashboard': '/dashboard',
      'inventario': '/inventario',
      'ventas': '/ventas',
      'aplicacion-movil': '/aplicacion-movil'
    };

    const route = routes[menu] || '/dashboard';
    this.router.navigate([route]);

    // Emitir evento para que el componente padre actualice el menú seleccionado
    this.menuSelected.emit(menu);

    // Cerrar el drawer automáticamente después de seleccionar
    this.onVisibleChange(false);
  }
}
