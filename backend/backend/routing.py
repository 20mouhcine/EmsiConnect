# api/routing.py
from django.urls import re_path
from api import consumers

websocket_urlpatterns = [
    re_path(r'ws/api/(?P<other_user_id>\d+)/$', consumers.ChatConsumer.as_asgi()),
]