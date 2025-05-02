from rest_framework import serializers
from .models import User, Token,Posts, Commentaire, Likes
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role', 'profile_picture']

    def create(self, validated_data):
        # Utilise set_password pour hacher le mot de passe
        user = User(
            email=validated_data['email'],
            username=validated_data['username'],  # username is the same as email
            role=validated_data.get('role', 'etudiant'),  # default role is 'etudiant'
            profile_picture=validated_data.get('profile_picture', None),
        )
        user.set_password(validated_data['password'])  # hachage du mot de passe
        user.save()
        return user

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
        fields = ['user']

        
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