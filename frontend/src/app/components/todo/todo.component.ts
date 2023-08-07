import { Component, HostListener } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import {
    CdkDragDrop,
    moveItemInArray,
    transferArrayItem,
} from '@angular/cdk/drag-drop';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { MatDialog } from '@angular/material/dialog';
import { ITask } from '../../models/itask';
import { EditDialogComponent } from '../edit-dialog/edit-dialog.component';
const currentDate: Date = new Date();
@Component({
    selector: 'app-todo',
    templateUrl: './todo.component.html',
    styleUrls: ['./todo.component.css'],
})
export class TodoComponent {
    todoForm!: FormGroup;
    tasks: ITask[] = [];
    inprogress: ITask[] = [];
    completed: ITask[] = [];
    contextMenuTask: ITask | null = null;
    contextMenuX = 0;
    contextMenuY = 0;
    editedTitle = '';
    editedDescription = '';

    constructor(
        private fb: FormBuilder,
        private dialog: MatDialog,
        private httpClient: HttpClient
    ) {}

    drop(event: CdkDragDrop<ITask[]>): void {
        if (event.previousContainer === event.container) {
            moveItemInArray(
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
            console.log(event.container.data);
            // send the updated data to the server
            this.saveTask(event.container.data[event.currentIndex]);
        } else {
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
            console.log(event.container.data);
            // send the updated data to the server
            this.saveTask(event.container.data[event.currentIndex]);
        }
    }
    ngOnInit(): void {
        this.todoForm = this.fb.group({
            item: ['', Validators.required],
        });
        this.fetchAllTasks();
    }

    private getCookie(title: string): string | null {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${title}=`);
        if (parts.length === 2) {
            return parts.pop()?.split(';').shift() || null;
        }
        return null;
    }

    addTask(): void {
        const body = new HttpParams()
            .set('title', this.todoForm.value.item)
            .set('description', ''); // You can add a description if needed

        // Fetch CSRF token from Django cookie (change csrftoken to the correct cookie title if needed)
        const csrfToken = this.getCookie('csrftoken');

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
                'http://localhost:8000/todo/add/',
                body.toString(),
                httpOptions
            )
            .subscribe(
                (response) => {
                    // Handle the response if needed (e.g., show a success message)
                    console.log('Task added successfully!', response);
                    // Clear the input field after successful addition
                    this.todoForm.reset();
                },
                (error) => {
                    // Handle the error if the request fails
                    console.error('Error adding task:', error);
                }
        );
        this.fetchAllTasks();
    }

    fetchAllTasks(): void {
        // Fetch CSRF token from Django cookie (change csrftoken to the correct cookie title if needed)
        const csrfToken = this.getCookie('csrftoken');

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

        this.httpClient
            .get<any>('http://localhost:8000/todo/getAllTasks', httpOptions)
            .subscribe(
                (response) => {
                    // Handle the response if needed (e.g., store the tasks in the component property)
                    console.log('Tasks fetched successfully!', response);
                    // add the tasks to the correct array
                    this.tasks = response.filter((t: ITask) => t.category === 'todo');
                    this.inprogress = response.filter((t: ITask) => t.category === 'inprogress');
                    this.completed = response.filter((t: ITask) => t.category === 'completed');
                },
                (error) => {
                    // Handle the error if the request fails
                    console.error('Error fetching tasks:', error);
                }
            );
    }

    saveTask(task: ITask): void {
        // Fetch CSRF token from Django cookie (change csrftoken to the correct cookie name if needed)
        const csrfToken = this.getCookie('csrftoken');

        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json', // Set the content type to JSON
            }),
            withCredentials: true, // Include CSRF cookie in the request
        };

        if (csrfToken) {
            httpOptions.headers = httpOptions.headers.append(
                'X-CSRFToken',
                csrfToken
            );
        }

        // Create an object with the updated properties
        // find in what array the task is to determine the category
        if (this.tasks.find((t) => t === task)) {
            task.category = 'todo';
        } else if (this.inprogress.find((t) => t === task)) {
            task.category = 'inprogress';
        } else if (this.completed.find((t) => t === task)) {
            task.category = 'completed';
        }
        console.log(task);
        const updatedTask: ITask = {
            id: task.id,
            title: task.title,
            description: task.description,
            creation_date: task.creation_date,
            update_date: currentDate.toISOString(),
            due_date: task.due_date,
            category: task.category,
        };
        console.log(updatedTask);

        this.httpClient
            .put<any>(
                `http://localhost:8000/todo/updateTask/${task.id}`,
                updatedTask, // Send the updated data in the request body as JSON
                httpOptions
            )
            .subscribe(
                (response) => {
                    // Handle the response if needed (e.g., show a success message)
                    console.log('Task updated successfully!', response);
                },
                (error) => {
                    // Handle the error if the request fails
                    console.error('Error updating task:', error);
                }
            );
    }

    openContextMenu(event: MouseEvent, task: ITask): void {
        event.preventDefault();
        this.contextMenuTask = task;
        this.setContextMenuPosition(event);
    }

    closeContextMenu(): void {
        this.contextMenuTask = null;
    }

    deleteTask(task: ITask): void {
        const taskIndex = this.tasks.findIndex((t) => t === task);

        this.contextMenuTask = null;

        // Fetch CSRF token from Django cookie (change csrftoken to the correct cookie name if needed)
        const csrfToken = this.getCookie('csrftoken');

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

        this.httpClient
            .delete<any>(
                `http://localhost:8000/todo/deleteTask/${task.id}`,
                httpOptions
        )
            .subscribe(
                (response) => {
                    // Handle the response if needed (e.g., show a success message)
                    console.log('Task deleted successfully!', response);
                    // Remove the task from the tasks array
                    this.tasks.splice(taskIndex, 1);
                }
        );
        this.fetchAllTasks();

    }

    setContextMenuPosition(event: MouseEvent): void {
        this.contextMenuX = event.clientX;
        this.contextMenuY = event.clientY + window.scrollY;
    }

    openEditDialog(task: ITask): void {
        const dialogRef = this.dialog.open(EditDialogComponent, {
            width: '500px',
            data: {
                title: task.title,
                description: task.description,
                showPomodoroSettings: false, // Indicate that it's Todo Task settings
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                task.title = result.title;
                task.description = result.description;
                console.log(task);
                this.saveTask(task);
            }
        });
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        const clickedInsideMenu = target.closest('.context-menu');
        if (!clickedInsideMenu) {
            this.closeContextMenu();
        }
    }
}
