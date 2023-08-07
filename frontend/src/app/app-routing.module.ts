import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { TodoComponent } from './components/todo/todo.component';
import { AccountActivationComponent } from './components/account-activation/account-activation.component';

const routes: Routes = [
    { path: 'register', component: RegisterComponent },
    { path: 'login', component: LoginComponent },
    { path: 'todo', component: TodoComponent },
    { path: 'activate/:uidb64/:token', component: AccountActivationComponent },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
