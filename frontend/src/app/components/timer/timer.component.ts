import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EditDialogComponent } from '../edit-dialog/edit-dialog.component';
import {
    trigger,
    state,
    style,
    transition,
    animate,
} from '@angular/animations';
import { ITimer } from '../../models/itimer';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { catchError, of, switchMap, take } from 'rxjs';

@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.css'],
    animations: [
        trigger('timerAnimation', [
            state('in', style({ opacity: 1, transform: 'scale(1)' })),
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.8)' }),
                animate('200ms ease-out'),
            ]),
            transition(':leave', [
                animate(
                    '200ms ease-in',
                    style({ opacity: 0, transform: 'scale(0.8)' })
                ),
            ]),
        ]),
    ],
})
export class TimerComponent {
    timerTitle: string = 'Pomodoro Timer';
    minutes: number = 25;
    seconds: number = 0;
    isTimerRunning: boolean = false;
    timerInterval: any;
    isWorkInterval: boolean = true;
    workMinutes: number = 25;
    workSeconds: number = 0;
    breakMinutes: number = 5;
    breakSeconds: number = 0;
    autoRestart: boolean = true;

    constructor(
        public dialog: MatDialog,
        private httpClient: HttpClient,
        private router: Router,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        this.fetchTimer();
        // this.resetTimer();
    }

    private getCookie(title: string): string | null {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${title}=`);
        if (parts.length === 2) {
            return parts.pop()?.split(';').shift() || null;
        }
        return null;
    }

    fetchTimer(): void {
        // call the backend to get the timer
        const csrfToken = this.getCookie('timer');

        this.authService.getUserDetails().pipe(
            switchMap((userData) => {
                const userId = userData.id;
                console.log(userData);
                const httpOptions = {
                    headers: new HttpHeaders(),
                    withCredentials: true, // Include CSRF cookie in the request
                };

                if (csrfToken) {
                    httpOptions.headers = httpOptions.headers.append(
                        'X-CSRFToken',
                        csrfToken
                    );
                }

                return this.httpClient.get<ITimer>(
                    `http://localhost:8000/timer/getPreset/${userId}`,
                    httpOptions
                );
            }),
            catchError((error) => {
                // Handle error if unable to fetch user details or timer data
                console.error('Error fetching user details or timer:', error);
                return of(null); // Return an empty observable in case of an error
            })
        ).subscribe(
            (response) => {
                if (response) {
                    console.log(response);
                    this.workMinutes = response.workMinutes;
                    this.workSeconds = response.workSeconds;
                    this.breakMinutes = response.breakMinutes;
                    this.breakSeconds = response.breakSeconds;
                    this.autoRestart = response.autoStart;
                    this.isWorkInterval = true;

                    // Update the minutes based on the current interval
                    this.minutes = this.workMinutes;
                    this.seconds = this.workSeconds;
                }
            }
        );
    }

    startTimer(): void {
        if (!this.isTimerRunning) {
            this.isTimerRunning = true;
            this.timerInterval = setInterval(() => {
                this.updateTimer();
            }, 1000);
        }
    }

    pauseTimer(): void {
        if (this.isTimerRunning) {
            this.isTimerRunning = false;
            clearInterval(this.timerInterval);
        }
    }

    resetTimer(): void {
        this.isTimerRunning = false;
        clearInterval(this.timerInterval);
        this.isWorkInterval = true;
        this.minutes = this.workMinutes;
        this.seconds = 0;
    }

    updateTimer(): void {
        if (this.minutes == 0 && this.seconds == 0) {
            this.pauseTimer();
            // save it to the database

            this.isWorkInterval = !this.isWorkInterval; // Toggle between work and break intervals

            if (this.isWorkInterval) {
                this.minutes = this.workMinutes;
            } else {
                this.minutes = this.breakMinutes;
            }
            this.seconds = 0;
            this.startTimer(); // Start the timer again for the next interval
        } else {
            if (this.seconds === 0) {
                this.minutes--;
                this.seconds = 59;
            } else {
                this.seconds--;
            }
        }
    }

    openEditDialog(): void {
        const dialogRef = this.dialog.open(EditDialogComponent, {
            width: '500px',
            data: {
                wMinutes: this.workMinutes,
                wSeconds: this.workSeconds,
                bMinutes: this.breakMinutes,
                bSeconds: this.breakSeconds,
                autoRestart: this.autoRestart,
                showPomodoroSettings: true,
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.workMinutes = result.wMinutes;
                this.workSeconds = result.wSeconds;
                this.breakMinutes = result.bMinutes;
                this.breakSeconds = result.bSeconds;
                this.autoRestart = result.autoRestart;
                this.isWorkInterval = true;

                // Update the minutes based on the current interval
                this.minutes = this.workMinutes;
                this.seconds = this.workSeconds;

                const csrfToken = this.getCookie('csrf-token');
                console.log(csrfToken);

                const timerData = {
                    workMinutes: this.workMinutes,
                    workSeconds: this.workSeconds,
                    breakMinutes: this.breakMinutes,
                    breakSeconds: this.breakSeconds,
                    autoStart: this.autoRestart,
                };

                const body = new HttpParams()
                    .set('workMinutes', this.workMinutes)
                    .set('workSeconds', this.workSeconds)
                    .set('breakMinutes', this.breakMinutes)
                    .set('breakSeconds', this.breakSeconds)
                    .set('autoStart', this.autoRestart)

                const httpOptions = {
                    headers: new HttpHeaders({
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }),
                    withCredentials: true, // Include CSRF cookie in the request
                };

                if (csrfToken) {
                    httpOptions.headers = httpOptions.headers.append(
                        'X-CSRFToken',
                        csrfToken
                    );
                }

                this.httpClient
                    .post<any>(
                        'http://localhost:8000/timer/savePreset/',
                        body.toString(),
                        httpOptions
                    )
                    .subscribe(
                        (response) => {
                            // Handle the response if needed (e.g., show a success message)
                            console.log('Timer added successfully!', response);
                            // Clear the input field after successful addition
                        },
                        (error) => {
                            // Handle the error if the request fails
                            console.error('Error adding Timer:', error);
                        }
                    );
            }
        });
    }
    goToRegisterPage(): void {
        this.router.navigate(['/register']);
    }

    goToLoginPage(): void {
        this.router.navigate(['/login']);
    }
}
