from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from .models import Category

@csrf_exempt
def create_category(request):
    print(request.POST)
    try:
        name = request.POST['name']
        category = Category(name=name)
        category.save()
        return JsonResponse({'message': 'Category created successfully'}, status=200)
    except:
        return JsonResponse({'message': 'Category could not be created'}, status=400)
    
@csrf_exempt
def get_all_categories(request):
    categories = Category.objects.all()
    formatted_categories = []
    for category in categories:
        formatted_category = {
            'id': category.id,
            'name': category.name,
        }
        formatted_categories.append(formatted_category)
    response_data = {
        'categories': formatted_categories
    }
    return JsonResponse(response_data, safe=False)

@csrf_exempt
def delete_category(request, category_id):
    try:
        category = Category.objects.get(id=category_id)
        category.delete()
        return JsonResponse({'message': 'Category deleted successfully'}, status=200)
    except:
        return JsonResponse({'message': 'Category could not be deleted'}, status=400)
    
@csrf_exempt
def update_category(request, category_id):
    try:
        category = Category.objects.get(id=category_id)
        name = request.POST['name']
        category.name = name
        category.save()
        return JsonResponse({'message': 'Category updated successfully'}, status=200)
    except:
        return JsonResponse({'message': 'Category could not be updated'}, status=400)