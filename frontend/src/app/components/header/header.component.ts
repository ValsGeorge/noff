import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
    isLoggedIn$: Observable<boolean>;
    username: string = '';

    constructor(private authService: AuthService, private router: Router) {
        this.isLoggedIn$ = this.authService.isLoggedIn$;

        this.authService.username$.subscribe((username) => {
            this.username = username;
        });
    }

    ngOnInit(): void {
        this.authService.getUserDetails().subscribe((userDetails) => {
            this.username = userDetails.username;
        });
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/']);
    }
}
