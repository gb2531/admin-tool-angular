import { Routes } from '@angular/router';
import { AppointmentFormComponent } from './appointment/appointment-form/appointment-form.component';
import { AuthComponent } from './auth/auth.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeDashboardComponent } from './dashboard/home-dashboard/home-dashboard.component';
import { CalendarComponent } from './dashboard/calendar/calendar.component';

export const routes: Routes = [
    { path: '', redirectTo: 'auth', pathMatch: 'full' },
    { path: 'auth', component: AuthComponent },
    {
        path: 'dashboard',
        component: DashboardComponent,
        children: [
            { path: '', component: HomeDashboardComponent },
            { path: 'calendar', component: CalendarComponent },
            { path: 'appointments/new', component: AppointmentFormComponent },
            { path: 'appointments/edit', component: AppointmentFormComponent }
        ]
    }
];
