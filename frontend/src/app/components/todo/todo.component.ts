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
import { ICategory } from '../../models/icategory';
import { EditDialogComponent } from '../edit-dialog/edit-dialog.component';
import { Title } from '@angular/platform-browser';
import { AuthService } from 'src/app/services/auth.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
const currentDate: Date = new Date();
@Component({
    selector: 'app-todo',
    templateUrl: './todo.component.html',
    styleUrls: ['./todo.component.css'],
})
export class TodoComponent {
    todoForm!: FormGroup;
    categories: ICategory[] = [];
    contextMenuTask: ITask | null = null;
    contextMenuX = 0;
    contextMenuY = 0;
    editedTitle = '';
    editedDescription = '';
    newCategoryName: string = '';

    constructor(
        private fb: FormBuilder,
        private dialog: MatDialog,
        private httpClient: HttpClient,
        private titleService: Title,
        private authService: AuthService
    ) {
        this.titleService.setTitle('Todo');
    }

    drop(event: CdkDragDrop<ITask[]>): void {
        if (event.previousContainer === event.container) {
            moveItemInArray(
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
            this.updateTaskOrders();
            this.saveTask(
                event.container.data[event.currentIndex],
                event.currentIndex
            );
        } else {
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
            this.updateTaskOrders();
            this.saveTask(
                event.container.data[event.currentIndex],
                event.currentIndex
            );
        }
    }

    private updateTaskOrders(): void {
        // Update the order of tasks
        this.categories.forEach((category) => {
            category.task.forEach((task, index) => (task.order = index));
        });
        // Save the updated orders to the backend
        this.saveTaskOrders(
            this.categories.flatMap((category) => category.task)
        );
    }

    private saveTaskOrders(tasks: ITask[]): void {
        const csrfToken = this.getCookie('csrftoken');
        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
            }),
            withCredentials: true,
        };

        if (csrfToken) {
            httpOptions.headers = httpOptions.headers.append(
                'X-CSRFToken',
                csrfToken
            );
        }
        this.httpClient.put<any>(
            `http://localhost:8000/todo/updateTaskOrders/`,
            tasks,
            httpOptions
        );
    }

    ngOnInit(): void {
        this.todoForm = this.fb.group({
            item: ['', Validators.required],
        });
        this.getAllCategories();
        this.fetchAllTasks();
    }

    dropCategory(event: CdkDragDrop<ICategory[]>): void {
        if (event.previousContainer === event.container) {
            // If a category was reordered within the same list
            moveItemInArray(
                this.categories,
                event.previousIndex,
                event.currentIndex
            );
            this.updateCategoryOrders();
        } else {
            // If a category was moved from one list to another
            const movedCategory =
                event.previousContainer.data[event.previousIndex];
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
            this.updateCategoryOrders();
        }
    }

    private updateCategoryOrders(): void {
        // Update the order of categories
        this.categories.forEach((category, index) => (category.order = index));
        // Save the updated orders to the backend
        this.saveCategoryOrders(this.categories);
    }

    private saveCategoryOrders(categories: ICategory[]): void {
        const csrfToken = this.getCookie('csrftoken');
        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
            }),
            withCredentials: true,
        };

        if (csrfToken) {
            httpOptions.headers = httpOptions.headers.append(
                'X-CSRFToken',
                csrfToken
            );
        }
        this.httpClient
            .put<any>(
                `http://localhost:8000/category/update-category-orders/`,
                categories,
                httpOptions
            )
            .subscribe({
                next: (response) => {
                    // Category orders updated successfully
                },
                error: (error) => {
                    console.error('Error updating category orders:', error);
                },
            });
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
        this.authService.getUserDetails().subscribe((user) => {
            const userID = user.id;
            const csrfToken = this.getCookie('csrftoken');

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

            this.httpClient
                .get<any>(
                    `http://localhost:8000/todo/getAllTasks/${userID}`,
                    httpOptions
                )
                .subscribe(
                    (response) => {
                        // Populate tasks for each category
                        this.populateCategoryTasks(response.tasks);
                    },
                    (error) => {
                        // Handle the error if the request fails
                        console.error('Error fetching tasks:', error);
                    }
                );
        });
    }

    populateCategoryTasks(tasks: any[]): void {
        // Remove all tasks from each category
        this.categories.forEach((category) => (category.task = []));
        // Iterate through tasks and add them to their respective categories and order them by positionID
        tasks.forEach((task) => {
            const categoryIndex = this.categories.findIndex(
                (category) => category.name === task.category
            );

            if (categoryIndex !== -1) {
                this.categories[categoryIndex].task.push({
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    creation_date: task.created_at,
                    update_date: task.updated_at,
                    due_date: task.due_date,
                    category: task.category,
                    order: task.positionID,
                    userID: task.user_id,
                });
            }
        });
        // Sort tasks by their order
        this.categories.forEach((category) => {
            category.task.sort((a, b) => a.order - b.order);
        });
    }

    saveTask(task: ITask, index: number): void {
        const csrfToken = this.getCookie('csrftoken');

        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
            }),
            withCredentials: true,
        };

        if (csrfToken) {
            httpOptions.headers = httpOptions.headers.append(
                'X-CSRFToken',
                csrfToken
            );
        }
        const categoryContainingTask = this.categories.find((category) =>
            category.task.some((t) => t === task)
        );

        if (categoryContainingTask) {
            task.category = categoryContainingTask.name;
        }

        const updatedTask: ITask = {
            id: task.id,
            title: task.title,
            description: task.description,
            creation_date: task.creation_date,
            update_date: currentDate.toISOString(),
            due_date: task.due_date,
            category: task.category,
            order: index,
            userID: task.userID,
        };
        this.httpClient
            .put<any>(
                `http://localhost:8000/todo/updateTask/${task.id}`,
                updatedTask,
                httpOptions
            )
            .subscribe(
                (response) => {
                    this.fetchAllTasks();
                },
                (error) => {}
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
        this.contextMenuTask = null;

        const csrfToken = this.getCookie('csrftoken');

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

        this.httpClient
            .delete<any>(
                `http://localhost:8000/todo/deleteTask/${task.id}`,
                httpOptions
            )
            .subscribe((response) => {
                this.fetchAllTasks();
            });
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
                dueDate: task.due_date,
                showPomodoroSettings: false,
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                task.title = result.title;
                task.description = result.description;
                task.due_date = result.dueDate || '';
                this.saveTask(task, result.order);
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

                    const categoryIndex = this.categories.findIndex(
                        (c) => c.name === category
                    );
                    const categoryTasks = this.categories[categoryIndex].task;
                    const maxOrder =
                        categoryTasks.length > 0
                            ? Math.max(...categoryTasks.map((t) => t.order), 0)
                            : -1;

                    const newTask: ITask = {
                        id: 0,
                        title: result.title,
                        description: result.description,
                        creation_date: currentDate.toISOString(),
                        update_date: currentDate.toISOString(),
                        due_date: result.dueDate || '',
                        category: category,
                        order: maxOrder + 1,
                        userID: userID,
                    };
                    const csrfToken = this.getCookie('csrftoken');

                    const body = {
                        title: newTask.title,
                        description: newTask.description,
                        category: newTask.category,
                        order: newTask.order,
                        userID: newTask.userID,
                        due_date: newTask.due_date,
                    };
                    const httpOptions = {
                        headers: new HttpHeaders({
                            'Content-Type': 'application/json',
                        }),
                        withCredentials: true,
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
                            body,
                            httpOptions
                        )
                        .subscribe(
                            (response) => {
                                this.todoForm.reset();
                            },
                            (error) => {}
                        );
                });
                this.fetchAllTasks();
            }
        });
    }
    createCategory(): void {
        const newCategoryName = this.newCategoryName;
        if (newCategoryName) {
            const newCategory = {
                name: newCategoryName,
                task: [],
            };
            this.authService.getUserDetails().subscribe((user) => {
                const userID = user.id;
                const csrfToken = this.getCookie('csrftoken');

                const httpOptions = {
                    headers: new HttpHeaders({
                        'Content-Type': 'application/json',
                    }),
                    withCredentials: true,
                };
                const body = {
                    name: newCategoryName,
                    userID: userID,
                };

                if (csrfToken) {
                    httpOptions.headers = httpOptions.headers.append(
                        'X-CSRFToken',
                        csrfToken
                    );
                }

                this.httpClient
                    .post<any>(
                        'http://localhost:8000/category/create-category/',
                        body,
                        httpOptions
                    )
                    .subscribe(
                        (response) => {
                            this.newCategoryName = '';
                            this.getAllCategories();
                        },
                        (error) => {
                            console.error('Error adding category:', error);
                        }
                    );
            });
        }
    }

    getAllCategories(): void {
        const csrfToken = this.getCookie('csrftoken');

        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
            }),
            withCredentials: true,
        };

        if (csrfToken) {
            httpOptions.headers = httpOptions.headers.append(
                'X-CSRFToken',
                csrfToken
            );
        }

        this.authService.getUserDetails().subscribe((user) => {
            const userID = user.id;

            this.httpClient
                .get<any>(
                    `http://localhost:8000/category/get-all-categories/${userID}`,
                    httpOptions
                )
                .subscribe(
                    (response) => {
                        // Populate tasks for each category
                        this.categories = response.categories;
                        // Order the categories by their order
                        this.categories.sort((a, b) => a.order - b.order);
                        // Fetch all tasks
                        this.fetchAllTasks();
                    },
                    (error) => {
                        console.error('Error fetching categories:', error);
                    }
                );
        });
    }
    deleteCategory(category: ICategory): void {
        if (category.task.length > 0) {
            const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
                data: {
                    message:
                        'This category has tasks. Are you sure you want to delete it?',
                },
            });

            dialogRef.afterClosed().subscribe((result) => {
                if (result) {
                    // User confirmed deletion, proceed with deletion
                    this.performCategoryDeletion(category);
                }
            });
        } else {
            // No tasks associated with the category, proceed with deletion
            this.performCategoryDeletion(category);
        }
    }

    performCategoryDeletion(category: ICategory): void {
        const csrfToken = this.getCookie('csrftoken');

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

        this.httpClient
            .delete<any>(
                `http://localhost:8000/category/delete-category/${category.id}`,
                httpOptions
            )
            .subscribe({
                next: (response) => {
                    // Category deleted successfully, update the category list
                    this.getAllCategories();
                },
                error: (error) => {
                    console.error('Error deleting category:', error);
                },
            });
    }

    editCategory(category: ICategory): void {
        const csrfToken = this.getCookie('csrftoken');

        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
            }),
            withCredentials: true,
        };

        // get the user id
        this.authService.getUserDetails().subscribe((user) => {
            const userID = user.id;

            const body = {
                id: category.id,
                name: category.name,
                userID: userID,
            };

            if (csrfToken) {
                httpOptions.headers = httpOptions.headers.append(
                    'X-CSRFToken',
                    csrfToken
                );
            }

            this.httpClient
                .put<any>(
                    `http://localhost:8000/category/update-category/`,
                    body,
                    httpOptions
                )
                .subscribe((response) => {
                    this.getAllCategories();
                });
            category.isEditing = false;
        });
    }
}
