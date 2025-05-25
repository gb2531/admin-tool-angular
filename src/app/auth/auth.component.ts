import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-auth',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: 'auth.component.html',
    styleUrls: ['auth.component.scss']
})

export class AuthComponent {
    isLoginMode = true;
    loginForm = {
        email: '',
        password: ''
    };
    signupForm = {
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    };

    constructor(private router: Router) { }

    toggleMode(): void {
        this.isLoginMode = !this.isLoginMode;
    }

    onSubmit(): void {
        if (this.isLoginMode) {
            // Handle login
            console.log('Login:', this.loginForm);
            // Navigate to dashboard after successful login
            this.router.navigate(['/dashboard']);
        } else {
            // Handle signup
            console.log('Signup:', this.signupForm);
            // Switch to login mode after successful signup
            this.isLoginMode = true;
        }
    }
} 