from django.urls import path

from . import views

urlpatterns = [
    path("create-category/", views.create_category, name="create_category"),
    path("get-all-categories/", views.get_all_categories, name="get_categories"),
    path("delete-category/<int:category_id>", views.delete_category, name="delete_category"),
    path("update-category/<int:category_id>", views.update_category, name="update_category"),
]