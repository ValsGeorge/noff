from datetime import timezone
import datetime
import json
from django.shortcuts import render
from django.http import HttpResponse
from django.shortcuts import render, redirect
import pytz
from .models import Todo
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth.models import User

def index(request):
    todos = Todo.objects.all()
    context = {
        'todos': todos,
    }
    return render(request, 'index.html', context)

from datetime import datetime

from datetime import datetime

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
            'category': task.category,
            'title': task.title,
            'description': task.description,
            'completed': task.completed,
            'created_at': task.created_at,
            'updated_at': task.updated_at,
            'due_date': task.due_date
        }
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
    print(request.POST)
    try:
        title = request.POST['title']
        description = request.POST['description']
        category = request.POST['category']
        user_id = request.POST['userID']
        positionID = request.POST['order']
        user = User.objects.get(id=user_id)
        due_date = request.POST['due_date']

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
        print(data)
        for task in data:
            # match the task id with the database
            todo = Todo.objects.get(id=task['id'])
            print("todo", todo)
            # update the positionID
            todo.positionID = task['order']
            print("positionID", todo.positionID)
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
        return JsonResponse({'error': 'Task not found'}, status=404)
    if request.method == 'PUT':
        data = json.loads(request.body)
        print(data)
        title = data.get('title')
        description = data.get('description')
        category = data.get('category')
        due_date = data.get('due_date')

        todo.title = title if title is not None else todo.title
        todo.description = description if description is not None else todo.description
        todo.category = category if category is not None else todo.category
        todo.due_date = due_date if due_date is not None else todo.due_date

        # todo.updated_at = datetime.now(pytz.timezone('Europe/Berlin'))
        todo.save()

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