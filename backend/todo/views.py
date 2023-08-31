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

@csrf_exempt
def getAllTasks(request, userID):
    # Get the user using the user id from the request
    print(userID)
    user = User.objects.get(id=userID)
    # Get all tasks that belong to the user
    tasks = Todo.objects.filter(user=user)

    # Convert the tasks queryset to a list of dictionaries (JSON serializable format)
    tasks_data = [{'id': task.id, 'order':task.positionID ,'title': task.title, 'description': task.description, 'completed': task.completed, 'category': task.category} for task in tasks]

    # Return the tasks data as JSON response
    return JsonResponse(tasks_data, safe=False)

@csrf_exempt
def add(request):
    print(request.POST)
    try:
        title = request.POST['title']
        description = request.POST['description']
        category = request.POST['category']
        user_id = request.POST['userID']
        positionID = request.POST['order']
        # find the user by id
        user = User.objects.get(id=user_id)
        # create a new task
        todo = Todo.objects.create(user=user, category=category, title=title, description=description, positionID=positionID)

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
        title = data.get('title', None)
        description = data.get('description', None)
        category = data.get('category', None)
        print(title)
        if title is not None:
            todo.title = title

        if description is not None:
            todo.description = description

        if category is not None:
            todo.category = category

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