// auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import {
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    Router,
} from '@angular/router';

@Injectable({
    providedIn: 'root',
})
export class AuthService implements CanActivate {
    private baseUrl = 'http://localhost:8000/accounts'; // Replace with your Django API base URL
    private authTokenKey = 'authToken'; // Key for storing the token in localStorage

    // Use BehaviorSubject to track login status changes
    private usernameSubject: BehaviorSubject<string> =
        new BehaviorSubject<string>('');
    private isLoggedInSubject: BehaviorSubject<boolean> =
        new BehaviorSubject<boolean>(false);
    isLoggedIn$: Observable<boolean> = this.isLoggedInSubject.asObservable();
    username$: Observable<string> = this.usernameSubject.asObservable();

    constructor(private http: HttpClient, private router: Router) {
        // Initialize the login status and username based on data in localStorage
        this.isLoggedInValue = this.checkLoginStatus();
        this.usernameSubject.next(this.getUserName());
    }

    private checkLoginStatus(): boolean {
        // Replace this with your actual authentication logic
        // For demonstration purposes, we'll simulate login status using a boolean property
        // You may replace this with your actual logic, e.g., checking for JWT, session, etc.
        const token = this.getAuthTokenFromLocalStorage();
        return !!token;
    }

    private get isLoggedInValue(): boolean {
        return this.isLoggedInSubject.value;
    }

    private set isLoggedInValue(isLoggedIn: boolean) {
        this.isLoggedInSubject.next(isLoggedIn);
    }

    isLoggedIn(): boolean {
        return this.isLoggedInValue;
    }

    getUserId(): number {
        const userData = this.getUserDataFromLocalStorage();
        return userData ? userData.userId : 0;
    }

    getUserName(): string {
        const userData = this.getUserDataFromLocalStorage();
        return userData ? userData.username : '';
    }

    getAuthToken(): string {
        return this.getAuthTokenFromLocalStorage();
    }

    private getAuthTokenFromLocalStorage(): string {
        return localStorage.getItem(this.authTokenKey) || '';
    }

    private getUserDataFromLocalStorage(): any {
        const userDataString = localStorage.getItem('userData');
        return userDataString ? JSON.parse(userDataString) : null;
    }

    private saveToLocalStorage(
        token: string,
        username: string,
        userId: number
    ): void {
        const userData = { token, username, userId };
        localStorage.setItem('userData', JSON.stringify(userData));
    }

    private clearFromLocalStorage(): void {
        localStorage.removeItem('userData');
    }

    register(userData: any): Observable<any> {
        const url = `${this.baseUrl}/register/`;
        const headers = { 'Content-Type': 'application/json' };
        const body = JSON.stringify(userData);

        return this.http.post(url, body, { headers });
    }

    login(loginData: any): Observable<any> {
        const url = `${this.baseUrl}/login/`;
        return this.http.post(url, loginData).pipe(
            tap((response: any) => {
                // Assuming login is successful, set the isLoggedInValue to true and store the user data
                this.isLoggedInValue = true;
                this.usernameSubject.next(response.username);
                const token = response.token;
                const userId = response.id; // Assuming the backend returns the user ID in the response
                this.saveToLocalStorage(token, response.username, userId);
                console.log('User', response.username, 'is logged in');
            }),
            catchError((error) => {
                // Handle login error, e.g., show an error message
                // Reset the isLoggedInValue to false on login failure
                this.isLoggedInValue = false;
                this.usernameSubject.next('');
                this.clearFromLocalStorage();
                return of(error);
            })
        );
    }

    logout(): void {
        // Clear the authentication token, username, and user ID from localStorage
        this.clearFromLocalStorage();

        // Update the login status and username properties
        this.isLoggedInValue = false;
        this.usernameSubject.next('');

        // Navigate the user to the login page
        this.router.navigate(['/login']);
    }

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): boolean {
        // Check if the user is logged in
        if (this.isLoggedIn()) {
            // If logged in, allow access to the route
            return true;
        } else {
            // If not logged in, redirect to the login page
            this.router.navigate(['/login']);
            return false;
        }
    }

    activateAccount(uidb64: string, token: string): Observable<any> {
        const url = `${this.baseUrl}/activate/${uidb64}/${token}/`;
        return this.http.post(url, {});
    }
}
