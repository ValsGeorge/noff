from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from .models import Category
from .models import User
import json

@csrf_exempt
def create_category(request):
    try:
        data = json.loads(request.body)
        category_name = data['name']
        user_id = data['userID']
        user = User.objects.get(id=user_id)

        category = Category(name=category_name, user=user)
        category.save()
        return JsonResponse({'message': 'Category created successfully'}, status=200)
    except:
        return JsonResponse({'message': 'Category could not be created'}, status=400)


@csrf_exempt
def get_all_categories(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        categories = Category.objects.filter(user=user).order_by('position')
        formatted_categories = []
        for category in categories:
            formatted_category = {
                'id': category.id,
                'name': category.name,
                'order': category.position,
            }
            formatted_categories.append(formatted_category)
        response_data = {
            'categories': formatted_categories
        }
        return JsonResponse(response_data, safe=False)
    except:
        return JsonResponse({'message': 'Categories could not be retrieved'}, status=400)

@csrf_exempt
def delete_category(request, category_id):
    try:
        category = Category.objects.get(id=category_id)
        category.delete()
        return JsonResponse({'message': 'Category deleted successfully'}, status=200)
    except:
        return JsonResponse({'message': 'Category could not be deleted'}, status=400)
    
@csrf_exempt
def update_category(request):
    try:
        data = json.loads(request.body)
        category_id = data['id']
        category_name = data['name']
        user_id = data['userID']

        category = Category.objects.get(id=category_id)
        category.name = category_name

        user = User.objects.get(id=user_id)
        category.user = user
        category.save()
        return JsonResponse({'message': 'Category updated successfully'}, status=200)
    except:
        return JsonResponse({'message': 'Category could not be updated'}, status=400)
    
@csrf_exempt
def update_category_orders(request):
    try:
        orders = json.loads(request.body)
        for order in orders:
            category = Category.objects.get(id=order['id'])
            category.position = order['order']
            category.save()
        return JsonResponse({'message': 'Category orders updated successfully'}, status=200)
    except:
        return JsonResponse({'message': 'Category orders could not be updated'}, status=400)
