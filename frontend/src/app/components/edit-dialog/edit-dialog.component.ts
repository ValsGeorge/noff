import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
    FormBuilder,
    FormGroup,
    Validators,
    FormControl,
} from '@angular/forms';

@Component({
    selector: 'app-edit-dialog',
    templateUrl: './edit-dialog.component.html',
    styleUrls: ['./edit-dialog.component.css'],
})
export class EditDialogComponent {
    editForm: FormGroup;
    showPomodoroSettings: boolean = false;

    constructor(
        public dialogRef: MatDialogRef<EditDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private fb: FormBuilder
    ) {
        this.editForm = this.fb.group({
            title: [data.title || '', Validators.required],
            description: [data.description || ''],
            priority: [''],
            dueDate: [''],
            wMinutes: [data.wMinutes || 0],
            wSeconds: [data.wSeconds || 0],
            bMinutes: [data.bMinutes || 0],
            bSeconds: [data.bSeconds || 0],
            autoRestart: [data.autoRestart || false],
        });

        // Check if the dialog should show Pomodoro Timer settings
        this.showPomodoroSettings = data.showPomodoroSettings || false;
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        if (!this.showPomodoroSettings && this.editForm.valid) {
            this.dialogRef.close(this.editForm.value);
        }
    }

    onSavePomodoroSettings(): void {
        if (this.showPomodoroSettings) {
            this.dialogRef.close(this.editForm.value);
        }
    }
}
