# api/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        
        if user and not isinstance(user, AnonymousUser):
            print(f"User authenticated: {user.username} (ID: {user.id})")
            self.other_user_id = self.scope['url_route']['kwargs']['other_user_id']
            
            await self.accept()
            
            self.room_group_name = f'chat_{self.other_user_id}'
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
        else:
            print("User not authenticated, closing connection")
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'user': self.scope['user'].username
            }
        )

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'user': event['user']
        }))