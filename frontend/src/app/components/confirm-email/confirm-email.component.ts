import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/services/auth.service';

@Component({
    selector: 'app-confirm-email',
    templateUrl: './confirm-email.component.html',
    styleUrls: ['./confirm-email.component.css'],
})
export class ConfirmEmailComponent implements OnInit {
    constructor(
        private authService: AuthService,
        private route: ActivatedRoute,
        private router: Router,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.confirmEmail();
    }

    confirmEmail(): void {
        const uidb64 = this.route.snapshot.paramMap.get('uidb64');
        const token = this.route.snapshot.paramMap.get('token');
        const email = this.route.snapshot.queryParamMap.get('email');

        // Check if both uidb64 and token are not null
        if (uidb64 !== null && token !== null) {
            const emailToSend = email || '';
            this.authService.confirmEmail(uidb64, token, emailToSend).subscribe(
                (response) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Email changed successfully',
                    });
                    this.router.navigate(['/profile']);
                },
                (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error while confirming email',
                    });
                    this.router.navigate(['/']);
                }
            );
        }
    }
}
