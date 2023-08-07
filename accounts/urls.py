from django.urls import path

from . import views

urlpatterns = [
    path("register/", views.register, name="register"),
    path("login/", views.login, name="login"),
    path('activate/<str:uidb64>/<str:token>/', views.activate_account, name='activate_account'),
]
