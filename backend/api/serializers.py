from rest_framework import serializers
from .models import User, Token,Posts, Commentaire, Likes,SavedPost,Ressources,Groupe,Message,Conversation,Reports
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role','bio','profile_picture','email_is_verified']

    def create(self, validated_data):
        user = User(
            email=validated_data['email'],
            username=validated_data['username'],  
            role=validated_data.get('role', 'etudiant'),  
            profile_picture=validated_data.get('profile_picture', None),
        )
        user.set_password(validated_data['password'])  
        user.save()
        return user
        
    def update(self, instance, validated_data):

        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        
        
        if 'bio' in validated_data:
            instance.bio = validated_data.get('bio')
        
        if 'profile_picture' in validated_data:
            instance.profile_picture = validated_data.get('profile_picture')
        
        instance.save()
        return instance
    

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        # Ajout des infos utilisateur à la réponse
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'role': self.user.role,
            'profile_picture': self.user.profile_picture.url if self.user.profile_picture else None,
            'bio': self.user.bio,
        }

        return data


class TokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Token
        fields = ['id', 'token', 'created_at', 'expires_at', 'user_id', 'is_used']

class CommentsSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Commentaire
        fields = ['id','user', 'content','post']

class LikesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Likes
        fields = ['user','post']

        
class PostsSerializer(serializers.ModelSerializer):
    num_comments = serializers.SerializerMethodField()
    num_likes = serializers.SerializerMethodField()
    media = serializers.FileField(required=False, allow_null=True)
    save_count = serializers.SerializerMethodField()

    user = UserSerializer(read_only=True) 

    class Meta:
        model = Posts
        fields = ['id', 'user', 'date_creation', 'date_modification','groupe', 'contenu_texte', 'media', 'num_comments', 'num_likes','save_count']
        read_only_fields = ['id', 'date_creation', 'date_modification', 'user']

    def get_num_comments(self, obj):
        return obj.comments.count()

    def get_num_likes(self, obj):
        return obj.likes.count()
    
    def get_save_count(self, obj):
        return obj.saved_by.count()
    
class SavedPostSerializer(serializers.ModelSerializer):
    post = PostsSerializer(read_only=True)
    
    class Meta:
        model = SavedPost
        fields = ['id', 'user', 'post', 'date_saved']
        read_only_fields = ['user', 'date_saved']

class RessourceSerializer(serializers.ModelSerializer):
    media = serializers.FileField(required=False, allow_null=True)
    user = UserSerializer(read_only=True)
    class Meta:
        model = Ressources
        fields = ['id','user','date_creation','media','title']

class GroupeSerializer(serializers.ModelSerializer):
    admin_username = serializers.ReadOnlyField(source='admin.username')
    members = UserSerializer(source='users', many=True, read_only=True)

    class Meta:
        model = Groupe
        fields = ['id', 'admin', 'nom', 'bio', 'admin_username', 'users','members', 'profile_picture']
        read_only_fields = ['admin']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'content', 'timestamp', 'read']
        read_only_fields = ['id', 'sender', 'timestamp', 'read']


class ConversationSerializer(serializers.ModelSerializer):
    initiator = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'initiator', 'receiver', 'start_timestamp', 'last_message', 'unread_count']
        read_only_fields = ['start_timestamp']
    
    def get_last_message(self, obj):
        last_message = obj.messages.order_by('-timestamp').first()
        if last_message:
            return MessageSerializer(last_message).data
        return None
    
    def get_unread_count(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if not user:
            return 0
        return obj.messages.filter(read=False).exclude(sender=user).count()
    

class ReportsCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reports
        fields = ["id", "user_reported", "post_reported", "cause"]

class ReportsListSerializer(serializers.ModelSerializer):
    post_reported = PostsSerializer(read_only=True)
    user_reported = UserSerializer(read_only=True)
    reports_count = serializers.SerializerMethodField()

    class Meta:
        model = Reports
        fields = ["id", "user_reported", "post_reported", "cause", "reports_count"]

    def get_reports_count(self, obj):
        return Reports.objects.filter(post_reported=obj.post_reported).count()
