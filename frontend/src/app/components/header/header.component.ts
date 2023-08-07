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
    username$: Observable<string>;

    constructor(private authService: AuthService, private router: Router) {
        this.isLoggedIn$ = this.authService.isLoggedIn$; // Subscribe to the isLoggedIn$ observable
        this.username$ = this.authService.username$; // Subscribe to the username$ observable
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/']);
    }
}
