# timer/models.py

from django.db import models
from django.contrib.auth.models import User


class Pomodoro(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, default=None)
    workMinutes = models.IntegerField(default=25)
    workSeconds = models.IntegerField(default=0)
    breakMinutes = models.IntegerField(default=5)
    breakSeconds = models.IntegerField(default=0)
    autoStart = models.BooleanField(default=True)

class Session(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    session_type = models.CharField(max_length=10)
    session_minutes = models.IntegerField(default=0)
    session_seconds = models.IntegerField(default=0)

class ShareCode(models.Model):
    code = models.CharField(max_length=6)
    user = models.ForeignKey(User, on_delete=models.CASCADE, default=None)
    expires = models.DateTimeField()

class Connection(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sender')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='receiver')
    shareCode = models.ForeignKey(ShareCode, on_delete=models.CASCADE, default=None)
    status = models.CharField(max_length=20, default=None)