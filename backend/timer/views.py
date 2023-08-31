# timer/views.py
from datetime import timedelta, timezone
import random
import string
from django.http import JsonResponse
from .models import Pomodoro, ShareCode, Timer, Connection
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

def index(request):
    return JsonResponse({'message': 'Hello, world!'})

@csrf_exempt
def get_preset(request, user_id):
    try:
        user = User.objects.get(pk=user_id)
        timer = Pomodoro.objects.get(user=user)
        context = {
            'user_id': user_id,
            'workMinutes': timer.workMinutes,
            'workSeconds': timer.workSeconds,
            'breakMinutes': timer.breakMinutes,
            'breakSeconds': timer.breakSeconds,
            'autoStart': timer.autoStart}
        
        return JsonResponse(context, safe=False)
        
    except Pomodoro.DoesNotExist:
        context = {
            'user_id': -1,
            'workMinutes': 25,
            'workSeconds': 0,
            'breakMinutes': 5,
            'breakSeconds': 0,
            'autoStart': True}
        return JsonResponse(context, safe=False)


@csrf_exempt
def save_preset(request):
    user_id = request.POST.get('userId')
    print(request.POST)
    workMinutes = request.POST.get('workMinutes')
    workSeconds = request.POST.get('workSeconds')
    breakMinutes = request.POST.get('breakMinutes')
    breakSeconds = request.POST.get('breakSeconds')
    autoStart = request.POST.get('autoStart')

    try:
        user = User.objects.get(id=user_id)
        try:
            timer = Pomodoro.objects.get(user=user)
        except Pomodoro.DoesNotExist:
            timer = Pomodoro(user=user)
        timer.workMinutes = workMinutes
        timer.workSeconds = workSeconds
        timer.breakMinutes = breakMinutes
        timer.breakSeconds = breakSeconds
        if autoStart == 'true':
            autoStart = True
        else:
            autoStart = False
        timer.autoStart = autoStart
        timer.save()
        return JsonResponse({'message': 'success'})
    except Pomodoro.DoesNotExist:
        return JsonResponse({'message': 'fail'})
    

@csrf_exempt
def save_timer(request):
    print(request.POST)
    user_id = request.POST.get('userId')
    workMinutes = request.POST.get('workMinutes')
    workSeconds = request.POST.get('workSeconds')
    breakMinutes = request.POST.get('breakMinutes')
    breakSeconds = request.POST.get('breakSeconds')
    # add every record to database
    try:
        user = User.objects.get(id=user_id)
        timer = Timer(user=user, workMinutes=workMinutes, workSeconds=workSeconds, breakMinutes=breakMinutes, breakSeconds=breakSeconds)
        timer.save()
        return JsonResponse({'message': 'success'})
    except Timer.DoesNotExist:
        return JsonResponse({'message': 'fail'})
    

@csrf_exempt
def get_timer(request, user_id):
    try:
        user_timers = Timer.objects.filter(user=user_id)
        timer_data = []

        for timer in user_timers:
            timer_data.append({
                'user': timer.user_id,
                'workMinutes': timer.workMinutes,
                'workSeconds': timer.workSeconds,
                'breakMinutes': timer.breakMinutes,
                'breakSeconds': timer.breakSeconds,
            })

        return JsonResponse(timer_data, safe=False)
    except Timer.DoesNotExist:
        return JsonResponse({'message': 'fail'})
    

def generate_unique_share_code():
    # Generate a unique share code
    code_length = 8
    characters = string.ascii_uppercase + string.digits
    code = ''.join(random.choice(characters) for _ in range(code_length))
    return code

def generate_expiration_time():
    # Generate an expiration time (e.g., 24 hours from now)
    return timezone.now() + timedelta(days=1)

def generate_code(user_id):
    if ShareCode.objects.filter(user=user_id).exists():
        share_code = ShareCode.objects.filter(user=user_id).last()
        return share_code
    code = generate_unique_share_code()
    expiration_time = generate_expiration_time()
    user = User.objects.get(id=user_id)
    share_code = ShareCode.objects.create(code=code, user=user, expires=expiration_time)
    return share_code

def validate_share_code(code):
    try:
        share_code = ShareCode.objects.get(code=code)
        return share_code
    except ShareCode.DoesNotExist:
        return None
    

@csrf_exempt
def generate_share_code(request):
    print(request.POST)
    if request.method == 'POST':
        user_id = request.POST.get('userID')
        
        try:
            user_id = int(user_id)  # Convert user_id to an integer
        except ValueError:
            return JsonResponse({'error': 'Invalid user ID'})

        share_code = generate_code(user_id)
        return JsonResponse({'share_code': share_code.code})
    
    return JsonResponse({'error': 'Invalid request method'})

    


@csrf_exempt
def connect_with_code(request):
    share_code = request.POST.get('share_code')
    receiver_id = request.POST.get('userID')
    print(request.POST)
    print(share_code)
    try:
        receiver = User.objects.get(id=receiver_id)
    except User.DoesNotExist:
        return JsonResponse({'message': 'fail'})

    validated_share_code = validate_share_code(share_code)
    print(validated_share_code)
    if validated_share_code:
        sender = User.objects.get(id=validated_share_code.user_id)
        # shareCode must be a ShareCode object
        shareCode = ShareCode.objects.get(code=validated_share_code.code)
        connection = Connection.objects.create(sender=sender, receiver=receiver, shareCode=shareCode, status='accepted')
        connection.save()
        return JsonResponse({'message': 'success'})
    else:
        return JsonResponse({'message': 'fail'})
