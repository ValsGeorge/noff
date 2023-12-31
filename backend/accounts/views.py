import base64
import json
from django.utils import timezone  # Import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.sites.shortcuts import get_current_site
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from .token import generate_token
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from timer.models import Pomodoro

@api_view(['POST'])
def register(request):
    if request.method == 'POST':
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        errors = {}

        if username is None or email is None or password is None:
            errors['error'] = 'Please provide all required fields\n'

        if User.objects.filter(username=username).exists():
            errors['username'] = 'Username already exists\n'

        if User.objects.filter(email=email).exists():
            errors['email'] = 'Email already exists\n'
        
        if password_check(password) != '':
            errors['password'] = password_check(password)
        
        if len(username) < 4:
            errors['username'] = 'Username must be at least 4 characters long\n'
        
        if len(username) > 20:
            errors['username'] = 'Username must be at most 20 characters long\n'
        
        if not validate_email(email):
            errors['email'] = 'Invalid email\n'

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = User(username=username, email=email)
        user.set_password(password)
        user.is_active = False
        user.save()

        # Welcome email
        subject = "Welcome to the Todo app"
        message = "Hello " + username + "!\n\n"
        message += "Welcome to the license app!\n\n"
        message += "You can now log in to the app and manage your licenses.\n\n"
        message += "Best regards,\n"
        message += "\tTODO app team"
        from_email = settings.EMAIL_HOST_USER
        to_email = [email]
        send_mail(subject, message, from_email, to_email, fail_silently=True)

        # Email verification email
        current_site = get_current_site(request)
        email_subject = "Please verify your email address"
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = generate_token.make_token(user)
        email_message = f"Hello {user.first_name},\n\n"
        email_message += f"Welcome to the Todo app!\n\n"
        email_message += "You can now log in to the app and manage your licenses.\n\n"
        email_message += f"Please click the following link to verify your email address:\n"
        email_message += f"{settings.FRONTEND_BASE_URL}/activate/{uid}/{token}/"
        email_message += "\n\nBest regards,\n"
        email_message += "\tTODO app team"

        send_mail(email_subject, email_message, settings.EMAIL_HOST_USER, [
                  user.email], fail_silently=True)

        return Response({'success': 'Account created successfully'}, status=status.HTTP_201_CREATED)
    return Response({'error': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def login(request):
    if request.method == 'POST':
        username = request.data.get('username')
        password = request.data.get('password')

        if username is None or password is None:
            return Response({'error': 'Please provide all required fields'}, status=status.HTTP_400_BAD_REQUEST)


        user = authenticate(username=username, password=password)
        if user is not None:
            token, _ = Token.objects.get_or_create(user=user)
            user.last_login = timezone.now()
            user.save()
            return Response({
                'success': 'Logged in successfully',
                'token': f'{token.key}',  # Convert the token object to a string
                'username': username,
                'id': user.id
            }, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def activate_account(request, uidb64, token):
    try:
        uid = urlsafe_base64_decode(uidb64)
        user = User.objects.get(pk=uid)
        if generate_token.check_token(user, token):
            user.is_active = True
            user.save()
            # add pomodoro timer settings for the user
            Pomodoro.objects.create(user=user, workMinutes=25, workSeconds=0, breakMinutes=5, breakSeconds=0)
            return Response({'success': 'Your account has been activated. You can now log in.'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Activation link is invalid or has expired1.'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': 'Activation link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_user_details(request):
    user = request.user

    user_details = {
        'username': user.username,
        'id': user.id,
        'email': user.email,
    }

    return Response(user_details)

@api_view(['PUT'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def update_username(request):
    if request.method == 'PUT':
        data = json.loads(request.body)
        username = data.get('username')
        user = request.user
        user.username = username
        user.save()
        return Response({'success': 'Username updated successfully'}, status=status.HTTP_200_OK)
    return Response({'error': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def update_email(request):
    if request.method == 'PUT':
        data = json.loads(request.body)
        email = data.get('email')
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
        old_email = request.user.email
        uid = urlsafe_base64_encode(force_bytes(request.user.pk))
        token = generate_token.make_token(request.user)
        encoded_email = base64.urlsafe_b64encode(email.encode()).decode()
        email_subject = "Please verify your email address"
        email_content = f"Hello {request.user.first_name},\n\n"
        email_content += f"In order to change your email address, please click the following link to verify your email address:\n"
        email_content += f"{settings.FRONTEND_BASE_URL}/confirm-email/{uid}/{token}/?email={encoded_email}"

        send_mail(email_subject, email_content, settings.EMAIL_HOST_USER, [
                  old_email], fail_silently=True)
        
        return Response({'success': 'Email updated successfully'}, status=status.HTTP_200_OK)
    return Response({'error': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def confirm_email(request, uidb64, token):
    try:
        encoded_email = request.GET.get('email')
        new_email = base64.urlsafe_b64decode(encoded_email.encode()).decode()
        uid = urlsafe_base64_decode(uidb64)
        user = User.objects.get(pk=uid)
        if generate_token.check_token(user, token):
            user.email = new_email            
            user.save()
            return Response({'success': 'Your email has been updated successfully'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Activation link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': 'Activation link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def update_password(request):
    if request.method == 'PUT':
        data = json.loads(request.body)
        old_password = data.get('oldPassword')
        password = data.get('password')
        confirm_password = data.get('confirmPassword')
        if old_password is None or password is None or confirm_password is None:
            return Response({'error': 'Please provide all required fields'}, status=status.HTTP_400_BAD_REQUEST)
        if password == old_password:
            return Response({'error': 'New password cannot be the same as the old password'}, status=status.HTTP_400_BAD_REQUEST)
        if password != confirm_password:
            return Response({'error': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)
        if password_check(password) != '':
            return Response({'error': password_check(password)}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = authenticate(username=request.user.username, password=old_password)
        except:
            return Response({'error': 'Invalid old password'}, status=status.HTTP_400_BAD_REQUEST)
        if user is None:
            return Response({'error': 'Invalid old password'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(password)
        user.save()
        return Response({'success': 'Password updated successfully'}, status=status.HTTP_200_OK)
    return Response({'error': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)

def password_check(password):
    message = ''
    if len(password) < 8:
        message += 'Password must be at least 8 characters long.\n'
    if not any(char.isdigit() for char in password):
        message += 'Password must contain at least one digit.\n'
    if not any(char.isupper() for char in password):
        message += 'Password must contain at least one uppercase letter.\n'
    if not any(char.islower() for char in password):
        message += 'Password must contain at least one lowercase letter.\n'
    return message

def validate_email(email):
    from django.core.validators import validate_email
    from django.core.exceptions import ValidationError
    try:
        validate_email(email)
        return True
    except ValidationError:
        return False