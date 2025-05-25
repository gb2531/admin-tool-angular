import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { NotificationComponent } from './shared/notification/notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NotificationComponent],
  template: `
    <div class="app-container">
      <router-outlet></router-outlet>
      <app-notification></app-notification>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      width: 100vw;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
  `]
})
export class AppComponent {
  constructor(private router: Router) { }

  isAuthPage(): boolean {
    return this.router.url === '/auth' || this.router.url === '/';
  }
}
