from django.urls import path

from . import views

urlpatterns = [
    path("register/", views.register, name="register"),
    path("login/", views.login, name="login"),
    path('activate/<str:uidb64>/<str:token>/', views.activate_account, name='activate_account'),
    path("get-user-details/", views.get_user_details, name="get_user_details"),
    path("update-username/", views.update_username, name="update_username"),
    path("update-email/", views.update_email, name="update_email"),
    path("update-password/", views.update_password, name="update_password"),
    path("confirm-email/<str:uidb64>/<str:token>/", views.confirm_email, name="confirm_email"),
]
