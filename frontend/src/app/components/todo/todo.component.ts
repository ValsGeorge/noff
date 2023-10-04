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
            console.log('drop');
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
            console.log('drop else');
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
        console.log('updateTaskOrders', this.categories);
        this.saveTaskOrders(
            this.categories.flatMap((category) => category.task)
        );
    }

    private saveTaskOrders(tasks: ITask[]): void {
        console.log('saveTaskOrders', tasks);
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
                `http://localhost:8000/todo/updateTaskOrders/`,
                tasks,
                httpOptions
            )
            .subscribe(
                (response) => {
                    console.log(response);
                },
                (error) => {
                    console.error('Error updating task orders:', error);
                }
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
        console.log('dropCategory', event);
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
            // You may need to update the moved category's properties here
            // For example, if you want to update its position or parent category
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
        console.log('saveCategoryOrders');
        this.httpClient
            .put<any>(
                `http://localhost:8000/category/update-category-orders/`,
                categories,
                httpOptions
            )
            .subscribe(
                (response) => {
                    console.log(response);
                },
                (error) => {
                    console.error('Error updating category orders:', error);
                }
            );
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
        // console.log('updatedTask', updatedTask);
        this.httpClient
            .put<any>(
                `http://localhost:8000/todo/updateTask/${task.id}`,
                updatedTask,
                httpOptions
            )
            .subscribe(
                (response) => {
                    console.log(response);
                    this.fetchAllTasks();
                },
                (error) => {
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
        // TODO: Rewrite this function to use the new categories array

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
            data: {
                title: task.title,
                description: task.description,
                dueDate: task.due_date,
                showPomodoroSettings: false,
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            console.log(result);
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

                    const newTask: ITask = {
                        id: 0,
                        title: result.title,
                        description: result.description,
                        creation_date: currentDate.toISOString(),
                        update_date: currentDate.toISOString(),
                        due_date: result.dueDate || '',
                        category: category,
                        order: 0,
                        userID: userID,
                    };
                    console.log(newTask);
                    const csrfToken = this.getCookie('csrftoken');
                    const body = new HttpParams()
                        .set('title', newTask.title)
                        .set('description', newTask.description)
                        .set('category', newTask.category)
                        .set('order', newTask.order.toString())
                        .set('userID', newTask.userID.toString())
                        .set('due_date', newTask.due_date.toString());
                    const httpOptions = {
                        headers: new HttpHeaders({
                            'Content-Type': 'application/x-www-form-urlencoded',
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
                            body.toString(),
                            httpOptions
                        )
                        .subscribe(
                            (response) => {
                                this.todoForm.reset();
                            },
                            (error) => {
                                console.error('Error adding task:', error);
                            }
                        );
                });
                this.fetchAllTasks();
            }
        });
    }
    createCategory(): void {
        const newCategoryName = this.newCategoryName;
        console.log(newCategoryName);
        if (newCategoryName) {
            const newCategory = {
                name: newCategoryName,
                task: [],
            };

            const csrfToken = this.getCookie('csrftoken');

            const body = new HttpParams().set('name', newCategory.name);

            const httpOptions = {
                headers: new HttpHeaders({
                    'Content-Type': 'application/x-www-form-urlencoded',
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
                    'http://localhost:8000/category/create-category/',
                    body.toString(),
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
        }
    }

    getAllCategories(): void {
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
                'http://localhost:8000/category/get-all-categories/',
                httpOptions
            )
            .subscribe(
                (response) => {
                    // Populate tasks for each category
                    this.categories = response.categories;
                    // Order the categories by their order
                    this.categories.sort((a, b) => a.order - b.order);
                    console.log(this.categories);
                    // Fetch all tasks
                    this.fetchAllTasks();
                },
                (error) => {
                    console.error('Error fetching categories:', error);
                }
            );
    }
    deleteCategory(category: ICategory): void {
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
            .subscribe((response) => {
                this.getAllCategories();
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

        const body = { name: category.name };

        if (csrfToken) {
            httpOptions.headers = httpOptions.headers.append(
                'X-CSRFToken',
                csrfToken
            );
        }

        this.httpClient
            .put<any>(
                `http://localhost:8000/category/update-category/${category.id}`,
                body,
                httpOptions
            )
            .subscribe((response) => {
                this.getAllCategories();
            });
        category.isEditing = false;
    }
}
