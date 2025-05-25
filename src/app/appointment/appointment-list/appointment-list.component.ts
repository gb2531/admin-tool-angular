import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppointmentService } from '../appointment.service';
import { Appointment } from '../appointment.interface';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { NotificationService } from '../../shared/notification.service';

@Component({
    selector: 'app-appointment-list',
    templateUrl: './appointment-list.component.html',
    styleUrls: ['./appointment-list.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, ConfirmationDialogComponent]
})
export class AppointmentListComponent implements OnInit {
    appointments: Appointment[] = [];
    searchQuery: string = '';
    showDropdownId: string | null = null;

    // Dialog properties
    showDeleteDialog = false;
    appointmentToDelete: string | undefined;

    constructor(
        private appointmentService: AppointmentService,
        private notificationService: NotificationService,
        public router: Router
    ) { }

    ngOnInit(): void {
        this.loadAppointments();
    }

    private loadAppointments(): void {
        this.appointmentService.getAllAppointments().subscribe(appointments => {
            this.appointments = appointments;
        });
    }

    onSearch(): void {
        if (this.searchQuery.trim()) {
            this.appointments = this.appointmentService.searchAppointments(this.searchQuery);
        } else {
            this.loadAppointments();
        }
    }

    toggleDropdown(id: string | undefined): void {
        if (id) {
            this.showDropdownId = this.showDropdownId === id ? null : id;
        }
    }

    closeDropdown(): void {
        this.showDropdownId = null;
    }

    onUpdate(appointment: Appointment): void {
        this.router.navigate(['/dashboard/appointments/new'], {
            state: { appointment }
        });
    }

    // New methods for delete confirmation
    openDeleteDialog(appointmentId: string): void {
        this.appointmentToDelete = appointmentId;
        this.showDeleteDialog = true;
    }

    closeDeleteDialog(): void {
        this.showDeleteDialog = false;
        this.appointmentToDelete = undefined;
    }

    onConfirmDelete(): void {
        if (this.appointmentToDelete) {
            this.appointmentService.deleteAppointment(this.appointmentToDelete).subscribe(() => {
                this.notificationService.show('Appointment deleted successfully', 'success');
                this.closeDeleteDialog();
            });
        }
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'completed':
                return 'status-completed';
            case 'cancelled':
                return 'status-cancelled';
            default:
                return 'status-scheduled';
        }
    }

    formatDate(date: string | Date): string {
        return new Date(date).toLocaleDateString();
    }
} 