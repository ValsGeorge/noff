from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Pomodoro(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, default=None)
    workMinutes = models.IntegerField(default=25)
    workSeconds = models.IntegerField(default=0)
    breakMinutes = models.IntegerField(default=5)
    breakSeconds = models.IntegerField(default=0)
    autoStart = models.BooleanField(default=True)