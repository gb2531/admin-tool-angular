import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { Appointment } from './appointment.interface';

@Injectable({
    providedIn: 'root'
})
export class AppointmentService {
    private apiUrl = 'http://localhost:5000/api/appointments';
    private appointmentsSubject = new BehaviorSubject<Appointment[]>([]);

    constructor(private http: HttpClient) {
        this.loadAppointments();
    }

    private loadAppointments(): void {
        this.http.get<Appointment[]>(this.apiUrl)
            .subscribe(appointments => {
                this.appointmentsSubject.next(appointments);
            });
    }

    getAllAppointments(): Observable<Appointment[]> {
        return this.appointmentsSubject.asObservable();
    }

    checkTimeSlotAvailability(
        date: string,
        time: string,
        service: string,
        duration: number,
        excludeId?: string
    ): Observable<boolean> {
        return this.getAllAppointments().pipe(
            map(appointments => {
                const selectedDateTime = this.combineDateAndTime(new Date(date), time);
                const selectedEndTime = new Date(selectedDateTime.getTime() + duration * 60000);

                return !appointments.some(appointment => {
                    if (excludeId && appointment._id === excludeId) {
                        return false;
                    }

                    if (appointment.service !== service) {
                        return false;
                    }

                    const appointmentDateTime = this.combineDateAndTime(new Date(appointment.date), appointment.time);
                    const appointmentEndTime = new Date(appointmentDateTime.getTime() + appointment.duration * 60000);

                    return (
                        (selectedDateTime >= appointmentDateTime && selectedDateTime < appointmentEndTime) ||
                        (selectedEndTime > appointmentDateTime && selectedEndTime <= appointmentEndTime) ||
                        (selectedDateTime <= appointmentDateTime && selectedEndTime >= appointmentEndTime)
                    );
                });
            })
        );
    }

    addAppointment(appointment: Appointment): Observable<Appointment> {
        return this.http.post<Appointment>(this.apiUrl, appointment).pipe(
            tap(newAppointment => {
                const currentAppointments = this.appointmentsSubject.value;
                this.appointmentsSubject.next([...currentAppointments, newAppointment]);
            })
        );
    }

    updateAppointment(appointment: Appointment): Observable<Appointment> {
        return this.http.patch<Appointment>(`${this.apiUrl}/${appointment._id}`, appointment).pipe(
            tap(updatedAppointment => {
                const currentAppointments = this.appointmentsSubject.value;
                const index = currentAppointments.findIndex(a => a._id === updatedAppointment._id);
                if (index !== -1) {
                    currentAppointments[index] = updatedAppointment;
                    this.appointmentsSubject.next([...currentAppointments]);
                }
            })
        );
    }

    deleteAppointment(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => {
                const appointments = this.appointmentsSubject.value;
                this.appointmentsSubject.next(appointments.filter(app => app._id !== id));
            })
        );
    }

    searchAppointments(query: string): Appointment[] {
        return this.appointmentsSubject.value.filter(app =>
            app.patientName.toLowerCase().includes(query.toLowerCase()) ||
            app.description.toLowerCase().includes(query.toLowerCase())
        );
    }

    private combineDateAndTime(date: Date, timeString: string): Date {
        const [hours, minutes] = timeString.split(':').map(Number);
        const combined = new Date(date);
        combined.setHours(hours, minutes, 0, 0);
        return combined;
    }
} 