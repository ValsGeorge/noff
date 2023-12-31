from django.urls import path

from . import views

urlpatterns = [
    path("create-category/", views.create_category, name="create_category"),
    path("get-all-categories/<int:user_id>", views.get_all_categories, name="get_categories"),
    path("delete-category/<int:category_id>", views.delete_category, name="delete_category"),
    path("update-category/", views.update_category, name="update_category"),
    path("update-category-orders/", views.update_category_orders, name="update_category_orders"),
]