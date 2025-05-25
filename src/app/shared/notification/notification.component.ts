import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../notification.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-notification',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="notifications-container">
      <div *ngFor="let notification of activeNotifications"
           class="notification"
           [ngClass]="notification.type">
        {{ notification.message }}
      </div>
    </div>
  `,
    styles: [`
    .notifications-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
    }

    .notification {
      padding: 15px 25px;
      margin-bottom: 10px;
      border-radius: 4px;
      color: white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease-out;
    }

    .success {
      background-color: #4caf50;
    }

    .error {
      background-color: #f44336;
    }

    .info {
      background-color: #2196f3;
    }

    .warning {
      background-color: #ff9800;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class NotificationComponent implements OnInit, OnDestroy {
    activeNotifications: { message: string; type: string }[] = [];
    private subscription: Subscription;

    constructor(private notificationService: NotificationService) {
        this.subscription = this.notificationService.notifications$.subscribe(notification => {
            this.activeNotifications.push(notification);
            setTimeout(() => {
                this.activeNotifications = this.activeNotifications.filter(n => n !== notification);
            }, 3000);
        });
    }

    ngOnInit(): void { }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
} 