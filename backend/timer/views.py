from django.core import serializers
from django.http import JsonResponse
from .models import Pomodoro
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User

def index(request):
    return JsonResponse({'message': 'Hello, world!'})

@csrf_exempt
def getPreset(request, user_id):
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
def savePreset(request):
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