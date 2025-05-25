export interface Appointment {
    _id?: string;
    patientName: string;
    service: string;
    date: Date;
    time: string;
    duration: number;
    description: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    createdAt?: Date;
} 