import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { TodoComponent } from './components/todo/todo.component';
import { AccountActivationComponent } from './components/account-activation/account-activation.component';
import { HomeComponent } from './components/home/home.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ConfirmEmailComponent } from './components/confirm-email/confirm-email.component';
import { AuthGuard } from './auth/auth.guard';

const routes: Routes = [
    { path: '', component: HomeComponent, data: { title: 'Home' } },
    { path: 'register', component: RegisterComponent },
    { path: 'login', component: LoginComponent },
    {
        path: 'profile',
        component: ProfileComponent,
        data: { title: 'Profile' },
        canActivate: [AuthGuard],
    },
    { path: 'todo', component: TodoComponent, canActivate: [AuthGuard] },
    { path: 'activate/:uidb64/:token', component: AccountActivationComponent },
    { path: 'confirm-email/:uidb64/:token', component: ConfirmEmailComponent },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
