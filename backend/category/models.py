from django.db import models
from django.contrib.auth.models import User

class Category (models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    position = models.IntegerField(default=9999)
    user = models.ForeignKey(User, on_delete=models.CASCADE, default=-1)