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

def index(request):
    todos = Todo.objects.all()
    context = {
        'todos': todos,
    }
    return render(request, 'index.html', context)

@csrf_exempt
def getAllTasks(request):
    # Retrieve all tasks from the database
    tasks = Todo.objects.all()

    # Convert the tasks queryset to a list of dictionaries (JSON serializable format)
    tasks_data = [{'id': task.id,'title': task.title, 'description': task.description, 'completed': task.completed, 'category': task.category} for task in tasks]

    # Return the tasks data as JSON response
    return JsonResponse(tasks_data, safe=False)


@csrf_exempt
def add(request):
    try:
        title = request.POST['title']
        description = request.POST['description']
        todo = Todo.objects.create(title=title, description=description)
        return JsonResponse({'message': 'Task added successfully!'})
    except KeyError:
        # If 'title' or 'description' is not present in the request
        return JsonResponse({'error': 'Invalid data'}, status=400)
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