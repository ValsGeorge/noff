import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-account-activation',
    template: '<div>Loading...</div>',
})
export class AccountActivationComponent {
    constructor(
        private authService: AuthService,
        private route: ActivatedRoute,
        private router: Router
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
                    console.log('Account activated successfully:', response);
                    // Optionally, you can show a success message to the user
                    // this.showMessageToUser('Account activated successfully');
                    // Redirect to the login page or any other desired action
                    this.router.navigate(['/login']);
                },
                (error) => {
                    console.error('Error activating account:', error);
                    // Optionally, you can show an error message to the user
                    // this.showMessageToUser('Account activation failed');
                    // Redirect to an error page or any other desired action
                    this.router.navigate(['/error']);
                }
            );
        } else {
            console.error('Invalid activation link: uidb64 or token is null');
            // Redirect to an error page or any other desired action
            this.router.navigate(['/error']);
        }
    }
}
