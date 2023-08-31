from django.db import models
from django.contrib.auth.models import User
# Create your models here.

class Todo (models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    positionID = models.IntegerField(default=0)
    category = models.CharField(max_length=100, default="todo")
    title = models.CharField(max_length=100)
    description = models.TextField()
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
