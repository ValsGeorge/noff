import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
    registrationForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.registrationForm = this.fb.group({
            username: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            confirmPassword: ['', Validators.required],
        });
    }

    onSubmit() {
        if (this.registrationForm.valid) {
            const registrationData = this.registrationForm.value;
            this.authService.register(registrationData).subscribe(
                (response) => {
                    console.log('User is logged in');
                    this.router.navigate(['/']);
                },
                (error) => {
                    console.log('Error while logging in user', error);
                }
            );
            this.router.navigate(['/login']);
        }
    }
}
