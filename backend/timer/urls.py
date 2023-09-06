from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("get-preset/<int:user_id>", views.get_preset, name="get_preset"),
    path("save-preset/", views.save_preset, name="save_preset"),
    path("save-timer/", views.save_timer, name="save_pimer"),
    path("get-timer/<int:user_id>", views.get_timer, name="getTimer"),
    path("generate-share-code/", views.generate_share_code, name="generate_share_code"),
    path("connect-with-code/", views.connect_with_code, name="connect_with_code"),
    path("check-if-in-room/<int:user_id>", views.check_if_in_room, name="check_if_in_room"),
    path("delete-connection/<int:user_id>", views.delete_connection, name="delete_connection"),
]
