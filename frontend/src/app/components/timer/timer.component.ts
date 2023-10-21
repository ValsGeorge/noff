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
import { ISession } from '../../models/isession';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { catchError, of, switchMap, take } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { WebSocketSubject } from 'rxjs/webSocket';
import { OnInit } from '@angular/core';

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
export class TimerComponent implements OnInit {
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
    timerActive: boolean = false;
    room: string = '';
    sessions: ISession[] = [];

    sessionData: ISession = {
        userId: 0,
        sessionType: '',
        startTime: new Date(),
        endTime: new Date(),
        sessionMinutes: 0,
        sessionSeconds: 0,
    };

    private socket$: WebSocketSubject<any> | undefined;

    constructor(
        public dialog: MatDialog,
        private httpClient: HttpClient,
        private router: Router,
        private authService: AuthService,
        private titleService: Title
    ) {}

    ngOnInit(): void {
        this.fetchTimer();
        this.checkIfInRoom();
    }

    isHost: boolean = false;

    private setupWebSocket(userID: number, shareCode: string): void {
        this.socket$ = new WebSocketSubject({
            url: `ws://localhost:8000/ws/timer/${shareCode}/`,
        });
        if (this.socket$ && !this.socket$.closed) {
            this.room = shareCode;
        }
        this.socket$.subscribe(
            (data) => {
                // Handle WebSocket data (timer updates)
                if (data.action === 'start') {
                    this.startTimer();
                } else if (data.action === 'pause') {
                    this.pauseTimer();
                } else if (data.action === 'reset') {
                    this.resetTimer();
                } else if (data.action === 'set_timer') {
                    if (this.isHost) {
                        this.sendUpdateTimer();
                    }
                } else if (data.action === 'update') {
                    if (!this.isHost) {
                        this.workMinutes = data.workMinutes;
                        this.workSeconds = data.workSeconds;
                        this.breakMinutes = data.breakMinutes;
                        this.breakSeconds = data.breakSeconds;
                        this.minutes = data.minutes;
                        this.seconds = data.seconds;
                        this.isWorkInterval = data.isWorkInterval;
                        if (data.timerActive) {
                            this.startTimer();
                        } else {
                            this.pauseTimer();
                        }
                    }
                }
            },
            (error) => {
                // Handle error here
                console.error('WebSocket error:', error);
            }
        );
    }
    sendUpdateTimer() {
        const timerSettings = {
            workMinutes: this.workMinutes,
            workSeconds: this.workSeconds,
            breakMinutes: this.breakMinutes,
            breakSeconds: this.breakSeconds,
            minutes: this.minutes,
            seconds: this.seconds,
            timerActive: this.isTimerRunning,
            isWorkInterval: this.isWorkInterval,
        };

        this.sendWebSocketMessage({
            action: 'set_timer',
            settings: timerSettings,
        });
    }

    private sendWebSocketMessage(message: any): void {
        if (this.socket$ && !this.socket$.closed) {
            this.socket$.next(message);
        }
    }

    private checkIfInRoom(): void {
        const csrfToken = this.getCookie('csrf-token');

        this.authService.getUserDetails().subscribe((userDetails) => {
            const userID = userDetails.id;

            const httpOptions = {
                headers: new HttpHeaders({
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),

                withCredentials: true,
            };

            if (csrfToken) {
                httpOptions.headers = httpOptions.headers.append(
                    'X-CSRFToken',
                    csrfToken
                );
            }

            this.httpClient
                .get<any>(
                    `http://localhost:8000/timer/check-if-in-room/${userID}`
                )
                .subscribe(
                    (response) => {
                        if (response) {
                            this.setupWebSocket(userID, response.share_code);
                            if (response.is_host) {
                                this.isHost = true;
                            }
                            this.workMinutes =
                                response.pomodoro_timer.workMinutes;
                            this.workSeconds =
                                response.pomodoro_timer.workSeconds;
                            this.breakMinutes =
                                response.pomodoro_timer.breakMinutes;
                            this.breakSeconds =
                                response.pomodoro_timer.breakSeconds;
                            this.minutes = response.pomodoro_timer.workMinutes;
                            this.seconds = response.pomodoro_timer.workSeconds;
                        }
                    },
                    (error) => {
                        console.error('Error check if in room:', error);
                    }
                );
        });
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

        this.authService
            .getUserDetails()
            .pipe(
                switchMap((userData) => {
                    const userId = userData.id;
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
                        `http://localhost:8000/timer/get-preset/${userId}`,
                        httpOptions
                    );
                }),
                catchError((error) => {
                    // Handle error if unable to fetch user details or timer data
                    console.error(
                        'Error fetching user details or timer:',
                        error
                    );
                    return of(null); // Return an empty observable in case of an error
                })
            )
            .subscribe((response) => {
                if (response) {
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
            });
    }

    startTimer(): void {
        if (!this.isTimerRunning) {
            this.isTimerRunning = true;
            this.sessionData.sessionType = this.isWorkInterval
                ? 'study'
                : 'break';
            this.sessionData.startTime = new Date();
            this.timerInterval = setInterval(() => {
                this.updateTimer();
            }, 1000);

            this.sendWebSocketMessage({ action: 'start' });
        }
    }

    pauseTimer(): void {
        if (this.isTimerRunning) {
            this.isTimerRunning = false;
            this.sessionData.endTime = new Date();
            clearInterval(this.timerInterval);
            this.sendWebSocketMessage({ action: 'pause' });
        }
    }

    resetTimer(): void {
        this.isTimerRunning = false;
        this.sessionData.endTime = new Date();
        this.saveSession(this.sessionData);
        this.sessionData = {
            userId: this.sessionData.userId,
            sessionType: '',
            startTime: new Date(),
            endTime: new Date(),
            sessionMinutes: 0,
            sessionSeconds: 0,
        };
        clearInterval(this.timerInterval);
        this.isWorkInterval = true;
        this.minutes = this.workMinutes;
        this.seconds = this.workSeconds;
        this.titleService.setTitle('Todo');
        this.sendWebSocketMessage({ action: 'reset' });
    }

    saveSession(sessionData: ISession): void {
        const csrfToken = this.getCookie('csrf-token');

        this.authService.getUserDetails().subscribe((userDetails) => {
            const userID = userDetails.id;

            const body = { userID: userID, sessionData: sessionData };

            const httpOptions = {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
                withCredentials: true, // Include CSRF cookie in the request
            };

            if (csrfToken) {
                httpOptions.headers = httpOptions.headers.append(
                    'X-CSRFToken',
                    csrfToken
                );
            }
            if (
                sessionData.sessionType == 'study' ||
                sessionData.sessionType == 'break'
            ) {
                this.httpClient
                    .post<any>(
                        'http://localhost:8000/timer/save-session/',
                        body,
                        httpOptions
                    )
                    .subscribe({
                        next: (response) => {},
                        error: (error) => {
                            console.error('Error adding Timer:', error);
                        },
                    });
            }
        });

        this.sessionData = {
            userId: this.sessionData.userId, // Retain the user ID
            sessionType: '', // Reset the session type
            startTime: new Date(),
            endTime: new Date(),
            sessionMinutes: 0,
            sessionSeconds: 0,
        };
    }

    updateTimer(): void {
        if (this.minutes == 0 && this.seconds == 0) {
            this.pauseTimer();
            this.saveSession(this.sessionData);
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
            if (this.sessionData.sessionSeconds === 59) {
                this.sessionData.sessionMinutes++;
                this.sessionData.sessionSeconds = 0;
            } else {
                this.sessionData.sessionSeconds++;
            }
        }
        this.titleService.setTitle(
            this.minutes + ':' + this.seconds + ' - ' + 'Todo'
        );
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

                this.authService.getUserDetails().subscribe((userDetails) => {
                    const userID = userDetails.id;

                    const body = new HttpParams()
                        .set('userId', userID)
                        .set('workMinutes', this.workMinutes)
                        .set('workSeconds', this.workSeconds)
                        .set('breakMinutes', this.breakMinutes)
                        .set('breakSeconds', this.breakSeconds)
                        .set('autoStart', this.autoRestart);

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
                            'http://localhost:8000/timer/save-preset/',
                            body.toString(),
                            httpOptions
                        )
                        .subscribe(
                            (response) => {
                                // Send a message to the WebSocket server to update the timer
                                this.sendUpdateTimer();
                            },
                            (error) => {
                                // Handle the error if the request fails
                                console.error('Error adding Timer:', error);
                            }
                        );
                });
            }
        });
    }

    saveTimer(): void {
        const csrfToken = this.getCookie('csrf-token');

        const timerData = {
            workMinutes: this.workMinutes,
            workSeconds: this.workSeconds,
            breakMinutes: this.breakMinutes,
            breakSeconds: this.breakSeconds,
        };

        this.authService.getUserDetails().subscribe((userDetails) => {
            const userID = userDetails.id;

            const body = new HttpParams()
                .set('userId', userID)
                .set('workMinutes', this.workMinutes)
                .set('workSeconds', this.workSeconds)
                .set('breakMinutes', this.breakMinutes)
                .set('breakSeconds', this.breakSeconds);

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
                    'http://localhost:8000/timer/save-timer/',
                    body.toString(),
                    httpOptions
                )
                .subscribe(
                    (response) => {
                        // Handle the response if needed (e.g., show a success message)
                        // Clear the input field after successful addition
                    },
                    (error) => {
                        // Handle the error if the request fails
                        console.error('Error adding Timer:', error);
                    }
                );
        });
    }

    goToRegisterPage(): void {
        this.router.navigate(['/register']);
    }

    goToLoginPage(): void {
        this.router.navigate(['/login']);
    }
    shareCode: string = '';

    generateShareCode(): void {
        const csrfToken = this.getCookie('csrf-token');

        this.authService.getUserDetails().subscribe((userDetails) => {
            const userID = userDetails.id;

            const body = new HttpParams().set('userID', userID);

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
                    'http://localhost:8000/timer/generate-share-code/',
                    body.toString(),
                    httpOptions
                )
                .subscribe(
                    (response) => {
                        // Handle the response if needed (e.g., show a success message)
                        // Clear the input field after successful addition
                        navigator.clipboard.writeText(response.share_code);
                        this.shareCode = response.share_code;
                        this.setupWebSocket(userID, this.shareCode);
                        this.isHost = true;
                    },
                    (error) => {
                        // Handle the error if the request fails
                        console.error('Error generate share code:', error);
                    }
                );
        });
    }

    connectWithCode(): void {
        const csrfToken = this.getCookie('csrf-token');

        this.authService.getUserDetails().subscribe((userDetails) => {
            const userID = userDetails.id;

            const body = new HttpParams()
                .set('userID', userID)
                .set('share_code', this.shareCode);

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
                    'http://localhost:8000/timer/connect-with-code/',
                    body.toString(),
                    httpOptions
                )
                .subscribe(
                    (response) => {
                        this.setupWebSocket(userID, this.shareCode);
                        this.sendWebSocketMessage({
                            action: 'update',
                            settings: response,
                        });
                    },
                    (error) => {
                        console.error('Error generate share code:', error);
                    }
                );
        });
    }

    disconnect(): void {
        // disconnect the socket and call the backend to delete the records from tables
        const csrfToken = this.getCookie('csrf-token');

        this.authService.getUserDetails().subscribe((userDetails) => {
            const userID = userDetails.id;

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
                .get<any>(
                    `http://localhost:8000/timer/delete-connection/${userID}`
                )
                .subscribe(
                    (response) => {
                        if (response) {
                            this.socket$?.complete();
                            this.socket$ = undefined;
                            this.isHost = false;
                            this.shareCode = '';
                            this.room = '';
                        }
                    },
                    (error) => {
                        // Handle the error if the request fails
                        console.error('Error generate share code:', error);
                    }
                );
        });
        this.fetchTimer();
    }
}
