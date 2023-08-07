from django.db import models
from django.contrib.auth.hashers import make_password

class Account(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(max_length=50, unique=True)
    password = models.CharField(max_length=128)
    is_active = models.BooleanField(default=False)

    def __str__(self):
        return self.username
    
    class Meta:
        db_table = 'user'
        verbose_name = 'Account'
        verbose_name_plural = 'Accounts'

    def set_password(self, password):
        self.password = make_password(password)

    def check_password(self, password):
        return password == self.password