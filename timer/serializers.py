from rest_framework import serializers
from .models import pomodoro

class pomodoro(serializers.Serializer):
    class Meta:
        model = pomodoro
        fields = ('user_id', 'workMinutes', 'workSeconds', 'breakMinutes', 'breakSeconds', 'autoStart')