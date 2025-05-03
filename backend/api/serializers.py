from rest_framework import serializers
from .models import User, Token,Posts, Commentaire, Likes
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role', 'profile_picture']

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
        }

        return data


class TokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Token
        fields = ['id', 'token', 'created_at', 'expires_at', 'user_id', 'is_used']

class CommentaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commentaire
        fields = ['user', 'content']

class LikesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Likes
        fields = ['user','post']

        
class PostsSerializer(serializers.ModelSerializer):
    num_comments = serializers.SerializerMethodField()
    num_likes = serializers.SerializerMethodField()
    user = UserSerializer(read_only=True) 

    
    class Meta:
        model = Posts
        fields = ['id', 'user', 'date_creation', 'date_modification', 'contenu_texte', 'media', 'num_comments', 'num_likes']
        read_only_fields = ['id', 'date_creation', 'date_modification', 'user']

    def get_num_comments(self, obj):
        return obj.comments.count()

    def get_num_likes(self, obj):
        return obj.likes.count()