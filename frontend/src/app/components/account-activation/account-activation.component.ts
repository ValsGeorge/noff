import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-account-activation',
    template: '<div></div>',
})
export class AccountActivationComponent {
    constructor(
        private authService: AuthService,
        private route: ActivatedRoute,
        private router: Router,
        private messageService: MessageService
    ) {
        this.activateAccount();
    }

    activateAccount(): void {
        const uidb64 = this.route.snapshot.paramMap.get('uidb64');
        const token = this.route.snapshot.paramMap.get('token');

        // Check if both uidb64 and token are not null
        if (uidb64 !== null && token !== null) {
            this.authService.activateAccount(uidb64, token).subscribe(
                (response) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Account activated successfully',
                    });
                    this.router.navigate(['/login']);
                },
                (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error while activating account',
                    });
                    this.router.navigate(['/error']);
                }
            );
        } else {
            console.error('Invalid activation link: uidb64 or token is null');
            this.router.navigate(['/error']);
        }
    }
}
