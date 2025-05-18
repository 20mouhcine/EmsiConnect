# Create a test file: test_channels.py
import os
import django
from django.conf import settings

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Test if channels is properly installed
try:
    import channels
    print("✅ Channels installed:", channels.__version__)
    
    from channels.layers import InMemoryChannelLayer
    print("✅ InMemoryChannelLayer imported successfully")
    
    from api.consumers import ChatConsumer
    print("✅ ChatConsumer imported successfully")
    
    from backend.backend.routing import websocket_urlpatterns
    print("✅ WebSocket URL patterns imported successfully")
    print("URL patterns:", websocket_urlpatterns)
    
    print("\n🎉 All imports successful! Your setup should work.")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()