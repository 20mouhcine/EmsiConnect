from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
import os

# Create your models here.
class Token(models.Model):
    id = models.AutoField(primary_key=True)
    token = models.CharField(max_length=255)
    created_at = models.DateTimeField()
    expires_at = models.DateTimeField()
    user_id = models.IntegerField(null=True)
    is_used = models.BooleanField(default=False)



class User(AbstractUser):
    role = models.CharField(max_length=10, default="etudiant")
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    email_is_verified = models.BooleanField(default=False)
    
    username = models.CharField(max_length=50,unique=True)
    email = models.EmailField(unique=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self) -> str:
        return self.email
    
class VerificationToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=128)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)


def validate_file_extension(value):
    allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov', '.avi']
    ext = os.path.splitext(value.name)[1].lower()  
    if ext not in allowed_extensions:
        raise ValidationError('Unsupported file format. Allowed formats: images (jpg, jpeg, png, gif) and videos (mp4, mov, avi).')
    

class Groupe(models.Model):
    admin = models.ForeignKey(User, on_delete=models.CASCADE,null=True, related_name='administered_groups')
    nom = models.CharField(max_length=50, null=True)
    users = models.ManyToManyField('User',related_name='member_groups')
    profile_picture = models.ImageField(null=True,upload_to='groups/', blank=True)

    bio = models.CharField(max_length=500, null=True)
    def delete(self, *args, **kwargs):
        self.users.clear()
        super().delete(*args, **kwargs)


class Posts(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date_creation = models.DateTimeField(default=timezone.now)
    date_modification = models.DateTimeField(default=timezone.now)
    contenu_texte = models.CharField(max_length=200,default="empty")
    media = models.FileField(
            null=True,
            upload_to='uploads/', 
            blank=True,
            validators=[validate_file_extension]
        )
    groupe = models.ForeignKey(Groupe, on_delete=models.CASCADE, null=True)


    def num_comments(self):
        return self.comments.count()

    def num_likes(self):
        return self.likes.count()
    def num_saves(self):
        return self.saved_by.count()

class Commentaire(models.Model):
    post = models.ForeignKey(Posts, on_delete=models.CASCADE, related_name='comments', null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE,null=True)
    content = models.TextField()

class Likes(models.Model):
    post = models.ForeignKey(Posts, on_delete=models.CASCADE, related_name='likes', null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    class Meta:
        # This ensures a user can only like a post once
        unique_together = ('post', 'user')
        verbose_name_plural = 'Likes'

    
class SavedPost(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_posts')
    post = models.ForeignKey(Posts, on_delete=models.CASCADE, related_name='saved_by')
    date_saved = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')
        ordering = ['-date_saved']  


class Ressources(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date_creation = models.DateTimeField(default=timezone.now)
    title = models.CharField(max_length=100,null=True)
    media = models.FileField(null=True,upload_to='ressources/', blank=True)



    
class Conversation(models.Model):
    initiator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='initiated_conversations')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_conversations')
    start_timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('initiator', 'receiver')
    
    def __str__(self):
        return f"Conversation between {self.initiator.username} and {self.receiver.username}"
    
class GroupeConversation(models.Model):
    name = models.CharField(max_length=255, blank=True) 
    participants = models.ManyToManyField(User, related_name="conversations")
    is_group = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class GroupMessage(models.Model):
    group = models.ForeignKey(GroupeConversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    read_by = models.ManyToManyField(User, related_name="read_group_messages", blank=True)


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.sender.username}: {self.content[:20]}"
    
    class Meta:
        ordering = ['timestamp']

class Reports(models.Model):
    user_reported = models.ForeignKey(User, on_delete=models.CASCADE)
    post_reported = models.ForeignKey(Posts,on_delete=models.CASCADE)
    choices = [
        ("false_news", "Désinformation ou fausses nouvelles"),
        ("spam", "Spam ou arnaques"),
        ("identity_theft", "Usurpation d'identité ou faux comptes")
    ]
    cause = models.CharField(max_length=255, choices=choices, default="false_news")