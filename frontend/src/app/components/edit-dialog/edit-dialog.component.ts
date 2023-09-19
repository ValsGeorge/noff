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
        const formatDueDate = (dateString: string) => {
            const [day, month, year] = dateString.split('/').map(Number);
            console.log(day, month, year);
            const formattedMonth = String(month).padStart(2, '0');
            const formattedDay = String(day).padStart(2, '0');
            return `${year}-${formattedMonth}-${formattedDay}`;
        };

        this.editForm = this.fb.group({
            title: [data.title || '', Validators.required],
            description: [data.description || ''],
            priority: [''],
            dueDate: [data.dueDate ? formatDueDate(data.dueDate) : ''],
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
