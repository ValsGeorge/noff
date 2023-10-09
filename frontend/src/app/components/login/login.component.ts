import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
})
export class LoginComponent {
    loginForm: FormGroup;
    showToast = false;
    messages: any[] = [];

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private messageService: MessageService
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
                    // Redirect to the home page immediately
                    this.router.navigate(['/']);

                    // Set a timeout to display the toast after the redirection
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Connected successfully',
                    });
                },
                (error) => {
                    console.log('Error while logging in user', error);
                    // Handle login error
                }
            );
        }
    }
}
