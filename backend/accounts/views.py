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
from timer.models import Timer

@api_view(['POST'])
def register(request):
    if request.method == 'POST':
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if username is None or email is None or password is None:
            return Response({'error': 'Please provide all required fields'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

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
            Timer.objects.create(user=user, workMinutes=25, workSeconds=0, breakMinutes=5, breakSeconds=0)
            return Response({'success': 'Your account has been activated. You can now log in.'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Activation link is invalid or has expired1.'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print("Exception", e)
        return Response({'error': 'Activation link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_user_details(request):
    print(request.user)
    user = request.user
    print(user)

    # Customize the user details you want to return
    user_details = {
        'username': user.username,
        'id': user.id,
    }

    return Response(user_details)