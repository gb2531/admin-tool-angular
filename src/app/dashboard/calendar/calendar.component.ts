import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarModule } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { AppointmentService } from '../../appointment/appointment.service';
import { Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface ServiceOption {
    name: string;
    duration: number;
}

@Component({
    selector: 'app-calendar',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CalendarModule
    ],
    templateUrl: './calendar.component.html',
    styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
    viewDate: Date = new Date();
    events: any[] = [];
    refresh = new Subject<void>();
    selectedDate: Date | null = null;
    timeSlots: string[] = [];
    activeDayIsOpen: boolean = false;
    excludeDays: number[] = [0]; // Exclude Sunday (0)
    weekStartsOn: number = 1; // Start week on Monday
    selectedService: string = ''; // Initialize as empty string
    today: Date = new Date(); // Add today property

    availableServices: ServiceOption[] = [
        { name: 'General Consultation', duration: 30 },
        { name: 'Dental Cleaning', duration: 60 },
        { name: 'Root Canal', duration: 90 },
        { name: 'Tooth Extraction', duration: 45 },
        { name: 'Dental Implant Consultation', duration: 45 },
        { name: 'Orthodontic Adjustment', duration: 30 },
        { name: 'Teeth Whitening', duration: 60 },
        { name: 'Dental X-Ray', duration: 15 }
    ];

    constructor(
        private appointmentService: AppointmentService,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadAppointments();
    }

    private loadAppointments() {
        this.appointmentService.getAllAppointments().subscribe(appointments => {
            this.events = appointments.map(appointment => ({
                title: `${appointment.patientName} - ${appointment.service}`,
                start: this.combineDateAndTime(new Date(appointment.date), appointment.time),
                end: this.addMinutesToDate(
                    this.combineDateAndTime(new Date(appointment.date), appointment.time),
                    appointment.duration
                ),
                color: this.getEventColor(appointment.status),
                service: appointment.service
            }));
            this.refresh.next();
        });
    }

    private combineDateAndTime(date: Date, timeString: string): Date {
        const [hours, minutes] = timeString.split(':').map(Number);
        const combined = new Date(date);
        combined.setHours(hours, minutes, 0, 0);
        return combined;
    }

    private addMinutesToDate(date: Date, minutes: number): Date {
        return new Date(date.getTime() + minutes * 60000);
    }

    private getEventColor(status: string): any {
        switch (status) {
            case 'completed':
                return { primary: '#4CAF50', secondary: '#E8F5E9' };
            case 'cancelled':
                return { primary: '#F44336', secondary: '#FFEBEE' };
            default:
                return { primary: '#2196F3', secondary: '#E3F2FD' };
        }
    }

    dayClicked(event: { day: { date: Date } }): void {
        const clickedDate = event.day.date;
        this.selectedDate = clickedDate;
        this.selectedService = ''; // Reset service selection
        this.generateTimeSlots();
    }

    onServiceSelect(serviceName: string): void {
        this.selectedService = serviceName;
        this.generateTimeSlots();
    }

    private generateTimeSlots(): void {
        if (!this.selectedDate) return;

        const slots: string[] = [];
        const startHour = 9; // 9 AM
        const endHour = 17; // 5 PM
        const interval = 30; // 30 minutes
        const now = new Date();
        const isToday = this.isSameDay(now, this.selectedDate);

        // For today, start from the next possible slot
        let currentHour = startHour;
        let currentMinute = 0;

        if (isToday) {
            currentHour = now.getHours();
            // Round up to the next interval
            currentMinute = Math.ceil(now.getMinutes() / interval) * interval;

            // If we've passed the interval, move to the next hour
            if (currentMinute >= 60) {
                currentHour++;
                currentMinute = 0;
            }
        }

        // Generate time slots
        for (let hour = currentHour; hour < endHour; hour++) {
            // If it's today and we're starting mid-hour, start from currentMinute
            let startMinute = (hour === currentHour && isToday) ? currentMinute : 0;

            for (let minute = startMinute; minute < 60; minute += interval) {
                // Skip if we're past end time
                if (hour >= endHour) continue;

                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(timeString);
            }
        }

        this.timeSlots = slots;
    }

    isTimeSlotTaken(timeString: string): boolean {
        if (!this.selectedDate || !this.selectedService) return true;

        return this.events.some(event => {
            const eventStart = event.start;
            const eventTime = `${eventStart.getHours().toString().padStart(2, '0')}:${eventStart.getMinutes().toString().padStart(2, '0')}`;
            return eventTime === timeString &&
                this.isSameDay(eventStart, this.selectedDate!) &&
                event.service === this.selectedService;
        });
    }

    isPastDate(): boolean {
        if (!this.selectedDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(this.selectedDate);
        selectedDate.setHours(0, 0, 0, 0);
        return selectedDate < today;
    }

    getServiceDuration(serviceName: string): number {
        const service = this.availableServices.find(s => s.name === serviceName);
        return service ? service.duration : 30;
    }

    onTimeSlotSelect(slot: string): void {
        // If it's a past date, don't allow navigation
        if (this.isPastDate()) {
            return;
        }

        if (this.selectedDate && this.selectedService) {
            const duration = this.getServiceDuration(this.selectedService);
            const formattedDate = this.formatDate(this.selectedDate);

            this.router.navigate(['/dashboard/appointments/new'], {
                queryParams: {
                    date: formattedDate,
                    time: slot,
                    service: this.selectedService,
                    duration: duration
                }
            });
        }
    }

    private formatDate(date: Date): string {
        // Adjust for timezone to prevent date shift
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
    }

    previousDate(): void {
        const date = new Date(this.viewDate);
        date.setMonth(date.getMonth() - 1);
        this.viewDate = date;
    }

    nextDate(): void {
        const date = new Date(this.viewDate);
        date.setMonth(date.getMonth() + 1);
        this.viewDate = date;
    }

    private isSameDay(date1: Date, date2: Date): boolean {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }
} 