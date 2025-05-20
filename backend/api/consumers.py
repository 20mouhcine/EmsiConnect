# consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import Conversation, Message
from .serializers import MessageSerializer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.user = self.scope['user']
        
        if isinstance(self.user, AnonymousUser):
            await self.close()
            return
        
        if not await self.is_participant():
            await self.close()
            return
        
        self.room_group_name = f'chat_{self.conversation_id}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'chat_message':
            await self.handle_chat_message(data)
        elif message_type == 'read_receipt':
            await self.handle_read_receipt(data)

    async def handle_chat_message(self, data):
        content = data.get('content')
        if not content:
            return
        
        message = await self.create_message(content)
        serializer = MessageSerializer(message)
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': serializer.data
            }
        )

    async def handle_read_receipt(self, data):
        message_id = data.get('message_id')
        if not message_id:
            return
        
        await self.mark_message_as_read(message_id)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'read_receipt',
                'message_id': message_id
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def read_receipt(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def is_participant(self):
        return Conversation.objects.filter(
            id=self.conversation_id,
            participants=self.user
        ).exists()

    @database_sync_to_async
    def create_message(self, content):
        conversation = Conversation.objects.get(id=self.conversation_id)
        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content
        )
        return message

    @database_sync_to_async
    def mark_message_as_read(self, message_id):
        Message.objects.filter(
            id=message_id,
            conversation_id=self.conversation_id
        ).exclude(sender=self.user).update(read=True)