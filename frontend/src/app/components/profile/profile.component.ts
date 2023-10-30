import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';
import { catchError, switchMap } from 'rxjs/operators';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
interface SessionResponse {
    session_type: string;
    session_date: string;
    total_minutes: number;
    total_seconds: number;
}
@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
    studySessionData: SessionResponse[] = [];
    breakSessionData: SessionResponse[] = [];
    chartData: any;
    options = {
        plugins: {
            legend: {
                labels: {
                    color: 'white',
                },
            },
            tooltip: {
                enabled: true,
                mode: 'point',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderColor: 'rgba(0, 0, 0, 0.5)',
                followCursor: true,
                borderWidth: 1,
                titleColor: 'white',
                bodyColor: 'white',
                callbacks: {
                    title: (items: any) => {
                        return items[0].label;
                    },
                    label: (tooltipItem: any) => {
                        const totalSeconds = tooltipItem.parsed.y;
                        const minutes = Math.floor(totalSeconds / 60);
                        const seconds = totalSeconds % 60;
                        return `Total Time: ${minutes}m ${seconds}s`;
                    },
                },
            },
        },
        scales: {
            x: {
                stacked: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: {
                    color: 'white',
                },
            },
            y: {
                stacked: true,
                beginAtZero: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: {
                    color: 'white',
                    stepSize: 30 * 60,
                    callback: (value: number) => {
                        const minutes = Math.floor(value / 60);
                        const seconds = value % 60;
                        return `${minutes}m ${seconds}s`;
                    },
                },
            },
        },
        layout: {
            padding: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10,
            },
        },
    };

    usernameForm: FormGroup;
    emailForm: FormGroup;
    passwordForm: FormGroup;

    oldEmail: string = '';
    isChangingEmail: boolean = false;

    constructor(
        private authService: AuthService,
        private httpClient: HttpClient,
        private fb: FormBuilder,
        private messageService: MessageService,
        private router: Router,
        private titleService: Title
    ) {
        this.titleService.setTitle('Profile');
        this.usernameForm = this.fb.group({
            username: '',
        });
        this.emailForm = this.fb.group({
            email: '',
        });
        this.passwordForm = this.fb.group({
            oldPassword: '',
            password: '',
            confirmPassword: '',
        });
    }
    activeTab: 'username' | 'email' | 'password' = 'username';

    setActiveTab(tab: 'username' | 'email' | 'password') {
        this.activeTab = tab;
    }

    ngOnInit(): void {
        this.getSessionSummary();
        this.authService.getUserDetails().subscribe((user) => {
            this.usernameForm.setValue({
                username: user.username || '',
            });
            this.emailForm.setValue({
                email: user.email || '',
            });
            this.oldEmail = user.email;
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

    getSessionSummary() {
        const csrfToken = this.getCookie('timer');

        this.authService
            .getUserDetails()
            .pipe(
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

                    return this.httpClient.get<any>(
                        `http://localhost:8000/timer/get-session/${userId}`,
                        httpOptions
                    );
                }),
                catchError((error) => {
                    console.error(
                        'Error fetching user details or session summary:',
                        error
                    );
                    return [];
                })
            )
            .subscribe((response) => {
                const studyData = response['study'];
                const breakData = response['break'];

                const labels = studyData.map((item: any) => item.session_date);

                const studyMinutes = studyData.map(
                    (item: any) => item.total_minutes * 60 + item.total_seconds
                );
                const breakMinutes = breakData.map(
                    (item: any) => item.total_minutes * 60 + item.total_seconds
                );

                this.chartData = {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Work Time',
                            data: studyMinutes,
                            backgroundColor: 'rgba(54, 162, 235, 0.4)',
                            borderWidth: 1,
                            borderColor: 'rgba(54, 162, 235, 1)',
                        },
                        {
                            label: 'Break Time',
                            data: breakMinutes,
                            backgroundColor: 'rgba(255, 99, 132, 0.4)',
                            borderWidth: 1,
                            borderColor: 'rgba(255, 99, 132, 1)',
                        },
                    ],
                };
            });
    }
    updateUsername() {
        const username = this.usernameForm.value.username;
        this.authService.updateUsername(username).subscribe(
            (response) => {
                this.toastMessage('success', 'Success', response.success);
            },
            (error) => {
                this.toastMessage('error', 'Error', error.error.error);
            }
        );
    }
    updateEmail() {
        const email = this.emailForm.value.email;
        if (email === this.oldEmail) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Your new email address is the same as your old email address.',
            });
        } else {
            this.isChangingEmail = true;
            this.authService.updateEmail(email).subscribe(
                (response) => {
                    this.isChangingEmail = false;
                    this.toastMessage('success', 'Success', response.success);
                },
                (error) => {
                    this.toastMessage('error', 'Error', error.error.error);
                }
            );
        }
    }
    updatePassword() {
        const oldPassword = this.passwordForm.value.oldPassword;
        const password = this.passwordForm.value.password;
        const confirmPassword = this.passwordForm.value.confirmPassword;
        if (password !== confirmPassword) {
            this.toastMessage(
                'error',
                'Error',
                'Password and confirm password do not match'
            );
            this.passwordForm.reset();
            return;
        } else {
            this.authService
                .updatePassword(oldPassword, password, confirmPassword)
                .subscribe(
                    (response) => {
                        this.toastMessage(
                            'success',
                            'Success',
                            response.success
                        );
                    },
                    (error) => {
                        this.toastMessage('error', 'Error', error.error.error);
                    }
                );
            this.passwordForm.reset();
        }
    }

    toastMessage(type: string, error: string, message: string) {
        this.messageService.add({
            severity: type,
            summary: error,
            detail: message,
        });
    }
}
