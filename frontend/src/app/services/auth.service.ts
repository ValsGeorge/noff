// auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
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

    getAuthToken(): string {
        return this.getAuthTokenFromLocalStorage();
    }

    private setAuthTokenInLocalStorage(token: string): void {
        localStorage.setItem(this.authTokenKey, token);
    }

    private getAuthTokenFromLocalStorage(): string {
        return localStorage.getItem(this.authTokenKey) || '';
    }

    private clearLocalStorage(): void {
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
                this.setAuthTokenInLocalStorage(token);
            }),
            catchError((error) => {
                // Handle login error, e.g., show an error message
                // Reset the isLoggedInValue to false on login failure
                this.isLoggedInValue = false;
                this.clearLocalStorage();
                return of(error);
            })
        );
    }

    logout(): void {
        // Clear the authentication token, username, and user ID from localStorage
        this.clearLocalStorage();

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

    private getAuthTokenWithPrefix(): string {
        const token = this.getAuthToken();
        return token ? `Token ${token}` : '';
    }
    
    getUserDetails(): Observable<any> {
        const token = this.getAuthToken();
        if (!token) {
            // If token is not available, return an empty observable
            return of({});
        }

        const url = `${this.baseUrl}/get-user-details/`; // Replace with the appropriate API endpoint to get user details
        const headers = new HttpHeaders({
            Authorization: `Token ${token}`,
        });

        return this.http.get(url, { headers }).pipe(
            map((userDetails: any) => userDetails), // Modify the map operator to directly return the user details
            catchError((error) => {
                // Handle error if unable to fetch user details
                // Clear the username in case of an error
                this.usernameSubject.next('');
                return of(error);
            })
        );
    }
}
