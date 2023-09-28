from django.db import models

class Category (models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    position = models.IntegerField(default=0)