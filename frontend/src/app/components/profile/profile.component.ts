import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';
import { catchError, switchMap } from 'rxjs/operators';
import { Tooltip } from 'chart.js/dist';
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

    constructor(
        private authService: AuthService,
        private httpClient: HttpClient
    ) {}

    ngOnInit(): void {
        this.getSessionSummary();
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
}
