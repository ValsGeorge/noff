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
                    this.router.navigate(['/']);
                    this.toastMessage('success', 'Success', response.success);
                },
                (error) => {
                    this.toastMessage('error', 'Error', error.error.error);
                }
            );
        }
    }
    toastMessage(severity: string, summary: string, detail: string) {
        this.messageService.add({ severity, summary, detail });
    }
}
