from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('add/', views.add, name='add'),
    path('getAllTasks/<int:userID>/', views.getAllTasks, name='getAllTasks'),
    path('deleteTask/<int:todo_id>/', views.delete, name='delete'),
    path('complete/<int:todo_id>/', views.complete, name='complete'),
    path('updateTask/<int:todo_id>', views.update, name='update'),
    path('updateTaskOrders/', views.updateTaskOrders, name='updateTaskOrders'),
]