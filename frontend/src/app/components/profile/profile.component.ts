import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';
import { catchError, switchMap } from 'rxjs';

interface TimerResponse {
    user: number;
    workMinutes: number;
    workSeconds: number;
    breakMinutes: number;
    breakSeconds: number;
}

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
    timerData: TimerResponse[] = [];

    constructor(
        private authService: AuthService,
        private httpClient: HttpClient
    ) {}

    ngOnInit(): void {
        this.getTimer();
    }

    private getCookie(title: string): string | null {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${title}=`);
        if (parts.length === 2) {
            return parts.pop()?.split(';').shift() || null;
        }
        return null;
    }

    getTimer() {
        const csrfToken = this.getCookie('timer');

        this.authService.getUserDetails().pipe(
            switchMap((userData) => {
                const userId = userData.id;
                const httpOptions = {
                    headers: new HttpHeaders(),
                    withCredentials: true,
                };

                if (csrfToken) {
                    httpOptions.headers = httpOptions.headers.append(
                        'X-CSRFToken',
                        csrfToken
                    );
                }

                return this.httpClient.get<TimerResponse[]>(
                    `http://localhost:8000/timer/get-timer/${userId}`,
                    httpOptions
                );
            }),
            catchError((error) => {
                console.error('Error fetching user details or timer:', error);
                return []; // Return an empty array in case of an error
            })
        ).subscribe(
            (response) => {
                this.timerData = response;
                console.log('Timer data:', this.timerData);
            }
        );
    }
}
