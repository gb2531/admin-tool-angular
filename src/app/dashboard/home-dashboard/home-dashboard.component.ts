import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../appointment/appointment.service';
import { Appointment } from '../../appointment/appointment.interface';
import { Router } from '@angular/router';
import { NotificationService } from '../../shared/notification.service';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationDialogComponent, BaseChartDirective],
  templateUrl: './home-dashboard.component.html',
  styleUrls: ['./home-dashboard.component.scss']
})
export class HomeDashboardComponent implements OnInit {
  todayAppointments = 0;
  pendingAppointments = 0;
  completedAppointments = 0;
  totalAppointments = 0;
  recentAppointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];

  // Search and filter properties
  searchQuery: string = '';
  statusFilter: string = '';
  dateFilter = {
    start: '',
    end: ''
  };

  showDeleteDialog = false;
  appointmentToDelete: string | null = null;

  // Chart properties
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Total Appointments',
        backgroundColor: '#4CAF50',
        barPercentage: 0.8,
      },
      {
        data: [],
        label: 'Completed Appointments',
        backgroundColor: '#2196F3',
        barPercentage: 0.8,
      },
      {
        data: [],
        label: 'Cancelled Appointments',
        backgroundColor: '#f44336',
        barPercentage: 0.8,
      }
    ]
  };

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Days of Week',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            weight: 'normal'
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Number of Bookings',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 12
          }
        },
        grid: {
          color: '#e0e0e0'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            size: 12
          },
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Weekly Appointment Distribution',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        callbacks: {
          title: (items) => {
            return items[0].label;
          },
          label: (item) => {
            return `${item.dataset.label}: ${item.formattedValue} bookings`;
          }
        }
      }
    }
  };

  constructor(
    private appointmentService: AppointmentService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.loadAppointmentStats();
    this.loadRecentAppointments();
    this.updateChartData();
  }

  private loadAppointmentStats() {
    this.appointmentService.getAllAppointments().subscribe(appointments => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      this.todayAppointments = appointments.filter(app => {
        const appDate = new Date(app.date);
        appDate.setHours(0, 0, 0, 0);
        return appDate.getTime() === today.getTime() && app.status !== 'cancelled';
      }).length;

      this.pendingAppointments = appointments.filter(app =>
        app.status === 'scheduled'
      ).length;

      this.completedAppointments = appointments.filter(app =>
        app.status === 'completed'
      ).length;

      this.totalAppointments = appointments.filter(app =>
        app.status !== 'cancelled'
      ).length;
    });
  }

  private loadRecentAppointments() {
    this.appointmentService.getAllAppointments().subscribe(appointments => {
      // Sort appointments by date and time, most recent first
      this.recentAppointments = appointments
        .sort((a, b) => {
          const dateA = new Date(a.date + 'T' + a.time);
          const dateB = new Date(b.date + 'T' + b.time);
          return dateB.getTime() - dateA.getTime();
        });

      this.applyFilters(); // Apply filters after loading appointments
    });
  }

  applyFilters(): void {
    let filtered = [...this.recentAppointments];

    // Apply name search
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.patientName.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (this.statusFilter) {
      filtered = filtered.filter(app => app.status === this.statusFilter);
    }

    // Apply date range filter
    if (this.dateFilter.start || this.dateFilter.end) {
      filtered = filtered.filter(app => {
        const appointmentDate = new Date(app.date);
        const startDate = this.dateFilter.start ? new Date(this.dateFilter.start) : null;
        const endDate = this.dateFilter.end ? new Date(this.dateFilter.end) : null;

        // Set all dates to start of day for consistent comparison
        appointmentDate.setHours(0, 0, 0, 0);
        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(0, 0, 0, 0);

        if (startDate && endDate) {
          return appointmentDate >= startDate && appointmentDate <= endDate;
        } else if (startDate) {
          return appointmentDate >= startDate;
        } else if (endDate) {
          return appointmentDate <= endDate;
        }
        return true;
      });
    }

    // Update filtered appointments
    this.filteredAppointments = filtered;
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString();
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

  onUpdate(appointment: Appointment): void {
    this.router.navigate(['/dashboard/appointments/edit'], {
      state: { appointment }
    });
  }

  onDelete(appointmentId: string): void {
    this.appointmentToDelete = appointmentId;
    this.showDeleteDialog = true;
  }

  onConfirmDelete(): void {
    if (this.appointmentToDelete) {
      this.appointmentService.deleteAppointment(this.appointmentToDelete).subscribe(() => {
        this.notificationService.show('Appointment deleted successfully', 'success');
        this.loadRecentAppointments();
        this.loadAppointmentStats();
        this.closeDeleteDialog();
      });
    }
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog = false;
    this.appointmentToDelete = null;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.statusFilter = '';
    this.dateFilter = {
      start: '',
      end: ''
    };
    this.applyFilters();
  }

  private updateChartData() {
    this.appointmentService.getAllAppointments().subscribe(appointments => {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      // Initialize data structure for weekdays (now including Saturday)
      const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const weeklyData = {
        total: Array(6).fill(0),      // 6 weekdays (Mon-Sat)
        completed: Array(6).fill(0),
        cancelled: Array(6).fill(0)
      };

      // Process appointments
      appointments.forEach(appointment => {
        const appDate = new Date(appointment.date);
        // Only count appointments from current month
        if (appDate.getMonth() === currentDate.getMonth() &&
          appDate.getFullYear() === currentDate.getFullYear()) {

          // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
          let dayOfWeek = appDate.getDay();

          // Skip Sunday (0) and adjust other days (1-6 to 0-5)
          if (dayOfWeek !== 0) {
            dayOfWeek = dayOfWeek - 1; // Convert to 0-5 index (Monday-Saturday)

            weeklyData.total[dayOfWeek]++;

            if (appointment.status === 'completed') {
              weeklyData.completed[dayOfWeek]++;
            } else if (appointment.status === 'cancelled') {
              weeklyData.cancelled[dayOfWeek]++;
            }
          }
        }
      });

      // Update chart data
      this.barChartData = {
        labels: weekdays,
        datasets: [
          {
            data: weeklyData.total,
            label: 'Total Appointments',
            backgroundColor: '#4CAF50',
            barPercentage: 0.8,
          },
          {
            data: weeklyData.completed,
            label: 'Completed Appointments',
            backgroundColor: '#2196F3',
            barPercentage: 0.8,
          },
          {
            data: weeklyData.cancelled,
            label: 'Cancelled Appointments',
            backgroundColor: '#f44336',
            barPercentage: 0.8,
          }
        ]
      };
    });
  }
} 