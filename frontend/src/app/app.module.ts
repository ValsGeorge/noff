import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CrudComponent } from './components/crud/crud.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { TodoComponent } from './components/todo/todo.component';
import { TimerComponent } from './components/timer/timer.component';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { HttpClientModule } from '@angular/common/http';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EditDialogComponent } from './components/edit-dialog/edit-dialog.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AccountActivationComponent } from './components/account-activation/account-activation.component';
import { HomeComponent } from './components/home/home.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';

@NgModule({
    declarations: [
        AppComponent,
        CrudComponent,
        HeaderComponent,
        FooterComponent,
        TodoComponent,
        TimerComponent,
        EditDialogComponent,
        LoginComponent,
        RegisterComponent,
        AccountActivationComponent,
        HomeComponent,
        ProfileComponent,
        ConfirmationDialogComponent,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatToolbarModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        DragDropModule,
        FormsModule,
        MatDialogModule,
        MatSelectModule,
        MatOptionModule,
        HttpClientModule,
        MatSlideToggleModule,
        ToastModule,
    ],
    providers: [MessageService],
    bootstrap: [AppComponent],
})
export class AppModule {}
