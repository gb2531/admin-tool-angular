import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AppointmentService } from '../appointment.service';
import { Appointment } from '../appointment.interface';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged, switchMap, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { NotificationService } from '../../shared/notification.service';

interface ServiceOption {
    name: string;
    duration: number;
}

@Component({
    selector: 'app-appointment-form',
    templateUrl: './appointment-form.component.html',
    styleUrls: ['./appointment-form.component.scss'],
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule]
})
export class AppointmentFormComponent implements OnInit {
    appointmentForm: FormGroup;
    isUpdateMode = false;
    appointmentId: string | null = null;
    minDate: string;
    today: Date = new Date();
    originalStatus: string = '';
    timeSlots: string[] = [];

    // Available services with their default durations
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
        private fb: FormBuilder,
        private appointmentService: AppointmentService,
        private router: Router,
        private route: ActivatedRoute,
        private notificationService: NotificationService
    ) {
        // Set minimum date to today
        this.minDate = this.formatDate(this.today);

        this.appointmentForm = this.fb.group({
            patientName: ['', Validators.required],
            service: ['', Validators.required],
            date: ['', [Validators.required, this.dateValidator()]],
            time: ['', [Validators.required, this.timeValidator()]],
            duration: [{ value: '', disabled: true }, [Validators.required, Validators.min(1)]],
            description: ['', Validators.required],
            status: ['scheduled', Validators.required]
        });

        // Generate time slots
        this.generateTimeSlots();

        // Check for appointment data in router state
        const navigation = this.router.getCurrentNavigation();
        const state = navigation?.extras.state as { appointment: Appointment };

        if (state?.appointment) {
            this.isUpdateMode = true;
            this.appointmentId = state.appointment._id || null;
            this.originalStatus = state.appointment.status;

            // Format date for the input field
            const formattedDate = new Date(state.appointment.date)
                .toISOString()
                .split('T')[0];

            this.appointmentForm.patchValue({
                patientName: state.appointment.patientName,
                service: state.appointment.service,
                date: formattedDate,
                time: state.appointment.time,
                duration: state.appointment.duration,
                description: state.appointment.description,
                status: state.appointment.status
            });
        }

        // Subscribe to service changes to update duration
        this.appointmentForm.get('service')?.valueChanges.subscribe(serviceName => {
            const selectedService = this.availableServices.find(s => s.name === serviceName);
            if (selectedService) {
                this.appointmentForm.patchValue({
                    duration: selectedService.duration
                });
                this.checkAvailability();
            }
        });

        // Subscribe to date and time changes
        this.appointmentForm.get('date')?.valueChanges.subscribe(() => {
            const timeControl = this.appointmentForm.get('time');
            if (timeControl?.value) {
                timeControl.updateValueAndValidity();
                this.checkAvailability();
            }
        });

        this.appointmentForm.get('time')?.valueChanges.subscribe(() => {
            this.checkAvailability();
        });

        // Subscribe to status changes
        this.appointmentForm.get('status')?.valueChanges.subscribe(newStatus => {
            // If changing from cancelled to scheduled, validate the time slot
            if (this.originalStatus === 'cancelled' && newStatus === 'scheduled') {
                this.checkAvailability();
            }
        });
    }

    private generateTimeSlots(): void {
        const slots: string[] = [];
        const startHour = 9;  // 9 AM
        const endHour = 17;   // 5 PM

        for (let hour = startHour; hour < endHour; hour++) {
            // Add hour:00
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            // Add hour:30 if not the last hour
            if (hour < endHour - 1) {
                slots.push(`${hour.toString().padStart(2, '0')}:30`);
            }
        }

        this.timeSlots = slots;
    }

    ngOnInit(): void {
        // Get query parameters and set form values
        this.route.queryParams.subscribe(params => {
            if (params['date']) {
                // Ensure the date is handled in local timezone
                const date = new Date(params['date']);
                date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

                this.appointmentForm.patchValue({
                    date: this.formatDate(date),
                    time: params['time'],
                    service: params['service'],
                    duration: params['duration']
                });
            }
        });

        // Add form state monitoring
        this.appointmentForm.statusChanges.subscribe(status => {
            if (status === 'INVALID') {
                console.log('Form Validation Errors:', Object.keys(this.appointmentForm.controls).reduce((acc, key) => {
                    const control = this.appointmentForm.get(key);
                    if (control?.errors) {
                        acc[key] = control.errors;
                    }
                    return acc;
                }, {} as any));
            }
        });
    }

    private checkAvailability(): void {
        const date = this.appointmentForm.get('date')?.value;
        const time = this.appointmentForm.get('time')?.value;
        const service = this.appointmentForm.get('service')?.value;
        const duration = this.appointmentForm.get('duration')?.value;
        const status = this.appointmentForm.get('status')?.value;

        // Only check availability if the appointment is scheduled (not cancelled)
        if (date && time && service && duration && status === 'scheduled') {
            // If we're updating a cancelled appointment to scheduled, don't exclude the current appointment ID
            const excludeId = this.originalStatus === 'cancelled' ? undefined : (this.appointmentId || undefined);

            this.appointmentService.checkTimeSlotAvailability(
                date,
                time,
                service,
                duration,
                excludeId
            ).subscribe(isAvailable => {
                const timeControl = this.appointmentForm.get('time');
                if (!isAvailable && timeControl) {
                    timeControl.setErrors({ timeSlotConflict: true });
                } else if (timeControl && timeControl.errors) {
                    // Clear the timeSlotConflict error if it exists
                    const errors = { ...timeControl.errors };
                    delete errors['timeSlotConflict'];
                    timeControl.setErrors(Object.keys(errors).length ? errors : null);
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

    private dateValidator() {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) {
                return null;
            }

            const selectedDate = new Date(control.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                return { pastDate: true };
            }

            // Check if the selected day is Sunday (0)
            if (selectedDate.getDay() === 0) {
                return { sunday: true };
            }

            return null;
        };
    }

    private timeValidator() {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) {
                return null;
            }

            const dateControl = this.appointmentForm?.get('date');
            if (!dateControl?.value) {
                return null;
            }

            const selectedDate = new Date(dateControl.value);
            const [hours, minutes] = control.value.split(':').map(Number);
            const now = new Date();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate.setHours(0, 0, 0, 0);

            // Check if time is within business hours (9 AM to 5 PM)
            if (hours < 9 || hours >= 17) {
                return { businessHours: true };
            }

            // Only check time if it's today's date
            if (selectedDate.getTime() === today.getTime()) {
                const currentHours = now.getHours();
                const currentMinutes = now.getMinutes();

                if (hours < currentHours || (hours === currentHours && minutes <= currentMinutes)) {
                    return { pastTime: true };
                }
            }

            return null;
        };
    }

    onSubmit(): void {
        if (this.appointmentForm.valid) {
            const formValue = this.appointmentForm.getRawValue();

            // Ensure the date is handled in local timezone
            const appointmentDate = new Date(formValue.date);
            appointmentDate.setMinutes(appointmentDate.getMinutes() - appointmentDate.getTimezoneOffset());

            const appointment: Appointment = {
                ...formValue,
                date: appointmentDate
            };

            if (this.isUpdateMode && this.appointmentId) {
                // Update existing appointment
                appointment._id = this.appointmentId;
                this.appointmentService.updateAppointment(appointment).subscribe(() => {
                    this.notificationService.show('Appointment updated successfully!', 'success');
                    this.router.navigate(['/dashboard']);
                });
            } else {
                // Create new appointment
                this.appointmentService.addAppointment(appointment).subscribe(() => {
                    this.notificationService.show('Appointment scheduled successfully!', 'success');
                    this.router.navigate(['/dashboard']);
                });
            }
        } else {
            // Mark all fields as touched to trigger validation messages
            Object.keys(this.appointmentForm.controls).forEach(key => {
                const control = this.appointmentForm.get(key);
                control?.markAsTouched();
            });
        }
    }

    onCancel(): void {
        this.router.navigate(['/dashboard']);
    }

    // Helper methods for the template
    getErrorMessage(controlName: string): string {
        const control = this.appointmentForm.get(controlName);
        if (control?.errors) {
            if (control.errors['required']) {
                return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
            }
            if (control.errors['pastDate']) {
                return 'Cannot select a past date';
            }
            if (control.errors['sunday']) {
                return 'Appointments are not available on Sundays';
            }
            if (control.errors['pastTime']) {
                return 'Cannot select a past time';
            }
            if (control.errors['businessHours']) {
                return 'Please select a time between 9 AM and 5 PM';
            }
            if (control.errors['min']) {
                return 'Duration must be at least 1 minute';
            }
            if (control.errors['timeSlotConflict']) {
                return 'This time slot is already booked for the selected service';
            }
        }
        return '';
    }

    // Debug method to check form state
    isFormValid(): boolean {
        const formValue = this.appointmentForm.value;
        console.log('Form Values:', formValue);
        console.log('Form Valid:', this.appointmentForm.valid);
        console.log('Form Errors:', this.appointmentForm.errors);
        return this.appointmentForm.valid;
    }
} 