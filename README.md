# Dental Appointment Management System

A modern, responsive web application built with Angular for managing dental appointments efficiently.

## Features

### Appointment Management
- Create new appointments with detailed patient information
- Update existing appointments
- View appointments in a calendar view
- Responsive form layout with two-column design

### Appointment Form Fields
- Patient Name
- Service Selection (with pre-defined durations)
  - General Consultation (30 mins)
  - Dental Cleaning (60 mins)
  - Root Canal (90 mins)
  - Tooth Extraction (45 mins)
  - Dental Implant Consultation (45 mins)
  - Orthodontic Adjustment (30 mins)
  - Teeth Whitening (60 mins)
  - Dental X-Ray (15 mins)
- Date Selection
- Time Slot Selection
- Appointment Duration (auto-calculated)
- Description
- Status (Scheduled/Completed/Cancelled)

### Smart Validation & Business Rules
- Prevents booking appointments in the past
- No appointments on Sundays
- Business hours restricted to 9 AM - 5 PM
- Automatic time slot conflict detection
- Real-time validation of all form fields
- Comprehensive error messages

### User Experience
- Modern, clean interface
- Responsive design adapting to different screen sizes
- Clear feedback on form validation
- Automatic duration calculation based on service
- Success notifications for actions
- Easy navigation between dashboard and form

### Technical Features
- Standalone Angular components
- Reactive forms with custom validators
- Real-time form state monitoring
- Timezone handling for dates
- Type-safe implementation with TypeScript
- Modular architecture

## Routes
- `/auth` - Authentication page
- `/dashboard` - Main dashboard
  - `/dashboard/calendar` - Calendar view
  - `/dashboard/appointments/new` - Create new appointment
  - `/dashboard/appointments/edit` - Edit existing appointment

## Dependencies
- Angular (latest version)
- Angular Calendar
- Angular Forms
- RxJS
