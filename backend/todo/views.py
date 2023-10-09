import json
from django.shortcuts import render
from django.shortcuts import render, redirect
from .models import Todo
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth.models import User
from category.models import Category
def index(request):
    todos = Todo.objects.all()
    context = {
        'todos': todos,
    }
    return render(request, 'index.html', context)


@csrf_exempt
def getAllTasks(request, userID):
    # Get the user using the user id from the request
    user = User.objects.get(id=userID)
    # Get all tasks that belong to the user
    tasks = Todo.objects.filter(user=user)

    formatted_tasks = []
    
    # Reverse the due_date format to DD-MM-YYYY and create a list of formatted dictionaries
    for task in tasks:
        formatted_task = {
            'id': task.id,
            'user_id': task.user_id,
            'positionID': task.positionID,
            'category': task.category_id,
            'title': task.title,
            'description': task.description,
            'completed': task.completed,
            'created_at': task.created_at,
            'updated_at': task.updated_at,
            'due_date': task.due_date
        }

        # change the category id to the category name
        # but first we need to find the name of that category using the id
        category = Category.objects.get(id=task.category_id)
        formatted_task['category'] = category.name
        
        # format the date for each task
        if task.due_date:
            formatted_task['due_date'] = task.due_date.strftime('%d-%m-%Y')
        formatted_tasks.append(formatted_task)

    # Convert the formatted tasks list to a JSON serializable format
    response_data = {
        'tasks': formatted_tasks
    }

    # Return the tasks data as JSON response
    return JsonResponse(response_data, safe=False)


@csrf_exempt
def add(request):
    try:
        title = request.POST['title']
        description = request.POST['description']
        category = request.POST['category']
        user_id = request.POST['userID']
        positionID = request.POST['order']
        user = User.objects.get(id=user_id)
        due_date = request.POST['due_date']

        # find the category using the category name provided in the request
        category = Category.objects.get(name=category)

        if due_date == '':
            due_date = None
        
        # create a new task
        Todo.objects.create(user=user, category=category, title=title, description=description, positionID=positionID, due_date=due_date)

        return JsonResponse({'message': 'Task added successfully!'})
    except KeyError:
        # If 'title' or 'description' is not present in the request
        return JsonResponse({'error': 'Invalid data'}, status=400)
    except Exception as e:
        # Other exceptions (e.g., database error)
        return JsonResponse({'error': str(e)}, status=500)
    
@csrf_exempt
def updateTaskOrders(request):
    try:
        data = json.loads(request.body)
        for task in data:
            # match the task id with the database
            todo = Todo.objects.get(id=task['id'])
            # update the positionID
            todo.positionID = task['order']
            # save the changes
            todo.save()
        return JsonResponse({'message': 'Task updated successfully!'})
    except Exception as e:
        # Other exceptions (e.g., database error)
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def update(request, todo_id):
    try:
        todo = Todo.objects.get(id=todo_id)
    except Todo.DoesNotExist:
        # return a json response with an error message with the task name and 404 status code
        return JsonResponse({'error': f'Task not found'}, status=404)

    if request.method == 'PUT':
        data = json.loads(request.body)
        title = data.get('title')
        description = data.get('description')
        category_name = data.get('category')
        due_date = data.get('due_date')
        position_id = data.get('order')
        # Check if the category exists or create a new one if it doesn't
        try:
            category = Category.objects.get(name=category_name)
        except Category.DoesNotExist:
            return JsonResponse({'error': 'Category not found'}, status=404)

        try:
            todo.title = title if title is not None else todo.title
            todo.description = description if description is not None else todo.description
            todo.category_id = category.id
            todo.due_date = due_date if due_date != '' else todo.due_date if todo.due_date else None
            todo.positionID = position_id if position_id is not None else todo.positionID

            todo.save()
        except Exception as e:
            # Other exceptions (e.g., database error)
            return JsonResponse({'error': str(e)}, status=500)

        return JsonResponse({'message': 'Task updated successfully!'})
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)
@csrf_exempt
def delete(request, todo_id):
    todo = Todo.objects.get(id=todo_id)
    todo.delete()
    return JsonResponse({'message': 'Task deleted successfully!'})

def complete(request, todo_id):
    todo = Todo.objects.get(id=todo_id)
    todo.completed = True
    todo.save()
    return redirect('/todo/')