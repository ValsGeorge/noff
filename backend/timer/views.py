# timer/views.py
from datetime import timedelta, timezone, datetime
import json
import random
import string
from django.http import JsonResponse
from .models import Pomodoro, ShareCode,  Connection, Session
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from django.db.models.functions import TruncDate
from django.db.models import Sum


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
    
# # Generate fake data for testing
# PS: the graph looks really cool ngl
# for i in range(1, 10):
#     user = User.objects.get(id=19)
#     start_time = timezone.now() - timedelta(days=timezone.now().day - random.randint(1, timezone.now().day), hours=random.randint(0, 23), minutes=random.randint(0, 59), seconds=random.randint(0, 59))
#     end_time = start_time + timedelta(minutes=random.randint(30, 50), seconds=random.randint(0, 59))
#     session_minutes = (end_time - start_time).seconds // 60
#     session_seconds = (end_time - start_time).seconds % 60
#     session = Session(user=user, session_type='study', start_time=start_time, end_time=end_time, session_minutes=session_minutes, session_seconds=session_seconds)
#     session.save()
#     start_time = end_time
#     end_time = start_time + timedelta(minutes=5)
#     session_minutes = (end_time - start_time).seconds // 60
#     session_seconds = (end_time - start_time).seconds % 60
#     session = Session(user=user, session_type='break', start_time=start_time, end_time=end_time, session_minutes=session_minutes, session_seconds=session_seconds)
#     session.save()

    

@csrf_exempt
def save_session(request):
    print(request.POST)
    data = json.loads(request.body)
    user_id = data['userID']
    session_type = data['sessionData']['sessionType']
    start_time_str = data['sessionData']['startTime']
    end_time_str = data['sessionData']['endTime']
    start_time = datetime.strptime(start_time_str, '%Y-%m-%dT%H:%M:%S.%fZ')
    end_time = datetime.strptime(end_time_str, '%Y-%m-%dT%H:%M:%S.%fZ')
    session_minutes = data['sessionData']['sessionMinutes']
    session_seconds = data['sessionData']['sessionSeconds']

    formatted_start_time = start_time.strftime('%Y-%m-%d %H:%M:%S')
    formatted_end_time = end_time.strftime('%Y-%m-%d %H:%M:%S')

    try:
        user = User.objects.get(id=user_id)
        
        session = Session(user=user, session_type=session_type, start_time=formatted_start_time, end_time=formatted_end_time, session_minutes=session_minutes, session_seconds=session_seconds)
        session.save()
        return JsonResponse({'message': 'success'})
    except User.DoesNotExist:
        return JsonResponse({'message': 'fail'})
    
@csrf_exempt
def get_session(request, user_id):
    try:
        session_data = Session.objects.annotate(
            session_date=TruncDate('start_time')
        ).values('session_type', 'session_date').annotate(
            total_minutes=Sum('session_minutes'),
            total_seconds=Sum('session_seconds')
        )

        study_sessions = {}
        break_sessions = {}

        for session in session_data:
            session_type = session['session_type']
            session_date = session['session_date']
            total_minutes = session['total_minutes']
            total_seconds = session['total_seconds']

            if session_type == 'study':
                if session_date in study_sessions:
                    study_sessions[session_date]['total_minutes'] += total_minutes
                    study_sessions[session_date]['total_seconds'] += total_seconds
                else:
                    study_sessions[session_date] = {
                        'total_minutes': total_minutes,
                        'total_seconds': total_seconds
                    }
            elif session_type == 'break':
                if session_date in break_sessions:
                    break_sessions[session_date]['total_minutes'] += total_minutes
                    break_sessions[session_date]['total_seconds'] += total_seconds
                else:
                    break_sessions[session_date] = {
                        'total_minutes': total_minutes,
                        'total_seconds': total_seconds
                    }

        study_list = [{'session_date': date, 'total_minutes': data['total_minutes'], 'total_seconds': data['total_seconds']} for date, data in study_sessions.items()]
        break_list = [{'session_date': date, 'total_minutes': data['total_minutes'], 'total_seconds': data['total_seconds']} for date, data in break_sessions.items()]

        for item in study_list:
            item['total_minutes'] += item['total_seconds'] // 60
            item['total_seconds'] = item['total_seconds'] % 60

        for item in break_list:
            item['total_minutes'] += item['total_seconds'] // 60
            item['total_seconds'] = item['total_seconds'] % 60

        return JsonResponse({'study': study_list, 'break': break_list}, safe=False)
    except Session.DoesNotExist:
        return JsonResponse({'message': 'No study sessions found'})

 

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
    if ShareCode.objects.filter(user=user_id).exists() and ShareCode.objects.filter(user=user_id).last().expires > timezone.now():
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
        user = User.objects.get(id=share_code.user_id)
        Connection.objects.create(sender=user, receiver=user, shareCode=share_code, status='accepted')
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
        # before everything, check if the connection already exists
        if Connection.objects.filter(shareCode=validated_share_code, receiver=receiver).exists():
            return JsonResponse({'message': 'fail - connection already exists'})
        sender = User.objects.get(id=validated_share_code.user_id)
        shareCode = ShareCode.objects.get(code=validated_share_code.code)
        # if he is in another connection, delete it, and if he is the host, delete the share code and every connection with that share code
        if Connection.objects.filter(receiver=receiver).exists():
            if Connection.objects.filter(receiver=receiver).last().sender.id == receiver.id:
                ShareCode.objects.filter(user=receiver).delete()
                Connection.objects.filter(shareCode=shareCode).delete()
            else:
                Connection.objects.filter(receiver=receiver).delete()
        connection = Connection.objects.create(sender=sender, receiver=receiver, shareCode=shareCode, status='accepted')
        connection.save()
        return JsonResponse({'message': 'success'})
    else:
        return JsonResponse({'message': 'fail - invalid share code'})


@csrf_exempt
def check_if_in_room(request, user_id):
    userID = user_id
    try:
        user = User.objects.get(id=userID)
        if Connection.objects.filter(receiver=user).exists():
            # get the pomodoro timer of the host in order to match the timer of ther user with the host's timer
            pomodoro_timer = Pomodoro.objects.get(user=Connection.objects.filter(receiver=user).last().sender)
            is_host = Connection.objects.filter(receiver=user).last().sender.id == user.id            
            return JsonResponse({'sucess': 'success', 'share_code': Connection.objects.filter(receiver=user).last().shareCode.code, 'is_host': is_host, 'pomodoro_timer': {'workMinutes': pomodoro_timer.workMinutes, 'workSeconds': pomodoro_timer.workSeconds, 'breakMinutes': pomodoro_timer.breakMinutes, 'breakSeconds': pomodoro_timer.breakSeconds}}, status=200)
        else:
            return JsonResponse({'error': 'User not found in any room'}, status=404)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User does not exist'}, status=404)
    

@csrf_exempt
def delete_connection(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        if Connection.objects.filter(receiver=user).exists():
            Connection.objects.filter(receiver=user).delete()
            # also check if the user is the host, in that case delete the share code and every connection with that share code
            if ShareCode.objects.filter(user=user).exists():
                ShareCode.objects.filter(user=user).delete()
                Connection.objects.filter(shareCode=ShareCode.objects.filter(user=user).last()).delete()
            return JsonResponse({'message': 'success'})
        else:
            return JsonResponse({'message': 'fail - user not in room'})
    except User.DoesNotExist:
        return JsonResponse({'message': 'fail - user does not exist'})