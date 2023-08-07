from django.db import models

# Create your models here.

class Todo (models.Model):
    category = models.CharField(max_length=100, default="todo")
    title = models.CharField(max_length=100)
    description = models.TextField()
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
