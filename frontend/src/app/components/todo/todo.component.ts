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
import { Title } from '@angular/platform-browser';
import { AuthService } from 'src/app/services/auth.service';
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
        private httpClient: HttpClient,
        private titleService: Title,
        private authService: AuthService
    ) {
        this.titleService.setTitle("Todo");
    }

    drop(event: CdkDragDrop<ITask[]>): void {
        if (event.previousContainer === event.container) {
            moveItemInArray(
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
            // send the updated data to the server
            this.saveTask(event.container.data[event.currentIndex]);
            this.updateTaskOrders();
        } else {
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
            // send the updated data to the server
            this.saveTask(event.container.data[event.currentIndex]);
            this.updateTaskOrders();
        }
    }

    private updateTaskOrders(): void {
        // Update the order of tasks within each category array
        this.tasks.forEach((task, index) => task.order = index);
        this.inprogress.forEach((task, index) => task.order = index);
        this.completed.forEach((task, index) => task.order = index);
        // Save the updated orders to the backend
        this.saveTaskOrders([...this.tasks, ...this.inprogress, ...this.completed]);
    }

    private saveTaskOrders(tasks: ITask[]): void {
        // Fetch CSRF token from Django cookie (change csrftoken to the correct cookie title if needed)
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

        this.httpClient
            .put<any>(
                `http://localhost:8000/todo/updateTaskOrders/`,
                tasks, // Send the updated data in the request body as JSON
                httpOptions
            )
            .subscribe(
                (response) => {

                    // Handle the response if needed (e.g., show a success message)
                }
            );
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

    fetchAllTasks(): void {
        // Fetch CSRF token from Django cookie (change csrftoken to the correct cookie title if needed)
        this.authService.getUserDetails().subscribe((user) => {
            const userID = user.id;
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
                .get<any>(`http://localhost:8000/todo/getAllTasks/${userID}`, httpOptions)
                .subscribe(
                    (response) => {
                        // Handle the response if needed (e.g., store the tasks in the component property)
                        const groupedTasks: Record<string, ITask[]> = {
                            'todo': [],
                            'inprogress': [],
                            'completed': []
                        };

                        response.forEach((task: ITask) => {
                            groupedTasks[task.category].push(task);
                        });
                        // add the tasks to the correct array
                        this.tasks = groupedTasks['todo'].sort((a, b) => a.order - b.order);
                        this.inprogress = groupedTasks['inprogress'].sort((a, b) => a.order - b.order);
                        this.completed = groupedTasks['completed'].sort((a, b) => a.order - b.order);
                    },
                    (error) => {
                        // Handle the error if the request fails
                        console.error('Error fetching tasks:', error);
                    }
            );
        });
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
        // ! GET THE USER ID CORRECTLY
        const updatedTask: ITask = {
            id: task.id,
            title: task.title,
            description: task.description,
            creation_date: task.creation_date,
            update_date: currentDate.toISOString(),
            due_date: task.due_date,
            category: task.category,
            order: task.order,
            userID: task.userID,
        };
        this.httpClient
            .put<any>(
                `http://localhost:8000/todo/updateTask/${task.id}`,
                updatedTask, // Send the updated data in the request body as JSON
                httpOptions
            )
            .subscribe(
                (response) => {
                    // Handle the response if needed (e.g., show a success message)
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
                    // Remove the task from the tasks array
                    this.tasks.splice(taskIndex, 1);
                    this.fetchAllTasks();
                }
            );



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

    createTask(category: string): void {
        const dialogRef = this.dialog.open(EditDialogComponent, {
            width: '500px',
            data: {
                title: '',
                description: '',
                showPomodoroSettings: false, // Indicate that it's Todo Task settings
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.authService.getUserDetails().subscribe((user) => {
                    const userID = user.id;
                    const maxOrder = [...this.tasks, ...this.inprogress, ...this.completed].filter((t) => t.category === category).length;
                    const newTask: ITask = {
                        id: 0,
                        title: result.title,
                        description: result.description,
                        creation_date: currentDate.toISOString(),
                        update_date: currentDate.toISOString(),
                        due_date: currentDate.toISOString(),
                        category: category,
                        order: maxOrder,
                        userID: userID,
                    };
                    const csrfToken = this.getCookie('csrftoken');
                    const body = new HttpParams()
                        .set('title', newTask.title)
                        .set('description', newTask.description)
                        .set('category', newTask.category)
                        .set('order', newTask.order.toString())
                        .set('userID', newTask.userID.toString());
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
                                // Clear the input field after successful addition
                                this.todoForm.reset();
                            },
                            (error) => {
                                // Handle the error if the request fails
                                console.error('Error adding task:', error);
                            }
                        );
                });
                this.fetchAllTasks();
            }
        });
    }
}
