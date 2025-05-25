import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-confirmation-dialog',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="dialog-overlay" *ngIf="isOpen">
            <div class="dialog-container">
                <div class="dialog-content">
                    <h3>{{ title }}</h3>
                    <p>{{ message }}</p>
                    <div class="dialog-actions">
                        <button class="btn btn-secondary" (click)="onCancel()">Cancel</button>
                        <button class="btn btn-danger" (click)="onConfirm()">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .dialog-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .dialog-container {
            background: white;
            border-radius: 8px;
            padding: 24px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .dialog-content {
            h3 {
                margin: 0 0 16px;
                color: #333;
                font-size: 1.25rem;
            }

            p {
                margin: 0 0 24px;
                color: #666;
                line-height: 1.5;
            }
        }

        .dialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;

            .btn {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;

                &.btn-secondary {
                    background-color: #6c757d;
                    color: white;

                    &:hover {
                        background-color: #5a6268;
                    }
                }

                &.btn-danger {
                    background-color: #dc3545;
                    color: white;

                    &:hover {
                        background-color: #c82333;
                    }
                }
            }
        }
    `]
})
export class ConfirmationDialogComponent {
    @Input() isOpen = false;
    @Input() title = 'Confirm Action';
    @Input() message = 'Are you sure you want to proceed?';
    @Output() confirm = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();

    onConfirm(): void {
        this.confirm.emit();
    }

    onCancel(): void {
        this.cancel.emit();
    }
} 