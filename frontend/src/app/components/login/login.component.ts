import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
})
export class LoginComponent {
    loginForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.loginForm = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required],
        });
    }

    onSubmit() {
        if (this.loginForm.valid) {
            const loginData = this.loginForm.value;
            this.authService.login(loginData).subscribe(
                (response) => {
                    // You can redirect the user here to any page you want or just stay on the same page
                    this.router.navigate(['/']);
                },
                (error) => {
                    console.log('Error while logging in user', error);
                    if (error.status === 401) {
                        // Handle unauthorized (invalid credentials) error
                        // For example, show an error message to the user
                        // this.errorMessage = 'Invalid credentials. Please try again.';
                    } else {
                        // Handle other errors (e.g., server error)
                        // For example, show a generic error message to the user
                        // this.errorMessage = 'An error occurred. Please try again later.';
                    }
                }
            );
        }
    }
}
