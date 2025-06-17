import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-playground-examples',
  standalone: true,
  imports: [ButtonModule, ToastModule, TooltipModule, CardModule],
  providers: [MessageService],
  templateUrl: './playground-examples.component.html',
  styleUrl: './playground-examples.component.scss'
})
export class PlaygroundExamplesComponent {
  constructor(private messageService: MessageService) {}

  showMessage(message: string) {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: message
    });
  }
}
