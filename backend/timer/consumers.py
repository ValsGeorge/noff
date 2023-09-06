# timer/consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer


class TimerConsumer(AsyncWebsocketConsumer):
    users_received_reset = set()
    async def connect(self):        
        await self.accept()

        self.share_code = self.scope['url_route']['kwargs']['share_code']
        self.share_group_name = f'timer_{self.share_code}'
        print('______________________________TimerConsumer connect\n', self.share_group_name)
        # Join share group
        await self.channel_layer.group_add(
            self.share_group_name,
            self.channel_name
        )
        

        self.send(text_data=json.dumps({
            'message': 'Connected to timer websocket'
        }))

    async def disconnect(self, close_code):
        print('______________________________TimerConsumer disconnect\n', close_code)
        await self.channel_layer.group_discard(
            self.share_group_name,
            self.channel_name
        )
        # delete the connection from the database
        # Connection.objects.filter(channel_name=self.channel_name).delete()

    async def receive(self, text_data):
        data = json.loads(text_data)
        
        if data['action'] == 'start':
            # Broadcast the "start" action to all users in the group
            await self.channel_layer.group_send(
                self.share_group_name,
                {
                    'type': 'start_timer',  # Use the type "start_timer"
                }
            )

        elif data['action'] == 'pause':
            # Broadcast the "stop" action to all users in the group
            await self.channel_layer.group_send(
                self.share_group_name,
                {
                    'type': 'pause_timer', # Use the type "pause_timer"
                }
            )

        elif data['action'] == 'reset':
            if self.channel_name not in self.users_received_reset:
                await self.channel_layer.group_send(
                    self.share_group_name,
                    {
                        'type': 'reset_timer', # Use the type "reset_timer"
                    }
                )
                self.users_received_reset.add(self.channel_name)
        elif data['action'] == 'update':
            # Broadcast the "update" action to all users in the group
            await self.channel_layer.group_send(
                self.share_group_name,
                {
                    'type': 'update',
                }
            )
        elif data['action'] == 'set_timer':
            # Broadcast the "set_timer" action to all users in the group
            await self.channel_layer.group_send(
                self.share_group_name,
                {
                    'type': 'set_timer',
                    'workMinutes': data['settings']['workMinutes'],
                    'workSeconds': data['settings']['workSeconds'],
                    'breakMinutes': data['settings']['breakMinutes'],
                    'breakSeconds': data['settings']['breakSeconds'],
                }
            )
        else:
            pass


    async def start_timer(self, event):
        await self.send(text_data=json.dumps({
            'action': 'start'
        }))

    async def pause_timer(self, event):
        await self.send(text_data=json.dumps({
            'action': 'pause'
        }))

    async def reset_timer(self, event):
        await self.send(text_data=json.dumps({
            'action': 'reset'
        }))

    async def update(self, event):
        await self.send(text_data=json.dumps({
            'action': 'set_timer'
        }))

    async def set_timer(self, event):
        await self.send(text_data=json.dumps({
            'action': 'update',
            'workMinutes': event['workMinutes'],
            'workSeconds': event['workSeconds'],
            'breakMinutes': event['breakMinutes'],
            'breakSeconds': event['breakSeconds'],
        }))