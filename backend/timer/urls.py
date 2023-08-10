from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("getPreset/<int:user_id>", views.getPreset, name="getPreset"),
    path("savePreset/", views.savePreset, name="savePreset"),
]
