import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
    registrationForm: FormGroup;
    isRegistering: boolean = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private messageService: MessageService
    ) {
        this.registrationForm = this.fb.group({
            username: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            confirmPassword: ['', Validators.required],
        });
    }

    onSubmit() {
        if (this.registrationForm.valid && !this.isRegistering) {
            this.isRegistering = true;
            const registrationData = this.registrationForm.value;
            this.authService.register(registrationData).subscribe(
                (response) => {
                    console.log(response);
                    this.isRegistering = false;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Account created successfully',
                    });
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Info',
                        detail: 'Please check your email for account activation',
                    });
                    this.router.navigate(['/login']);
                },
                (error) => {
                    console.log(error);
                    console.log(error.error);
                    console.log(error.error);
                    this.isRegistering = false;
                    for (const [key, value] of Object.entries(error.error)) {
                        this.messageService.add({
                            severity: 'error',
                            summary: `Error: ${key}`,
                            detail: `${value}`,
                        });
                    }

                    this.router.navigate(['/register']);
                }
            );
        }
    }
}
