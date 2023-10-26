import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
})
export class HomeComponent {
    constructor(
        title: Title,
        private router: Router,
        private authService: AuthService
    ) {
        title.setTitle('Noff');
    }

    redd() {
        this.authService.getUserDetails().subscribe((data) => {
            if (data.id) {
                this.router.navigate(['/todo']);
            } else {
                this.router.navigate(['/register']);
            }
        });
    }
}
