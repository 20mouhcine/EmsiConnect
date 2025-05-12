from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser


# Create your models here.
class Token(models.Model):
    id = models.AutoField(primary_key=True)
    token = models.CharField(max_length=255)
    created_at = models.DateTimeField()
    expires_at = models.DateTimeField()
    user_id = models.IntegerField()
    is_used = models.BooleanField(default=False)


class User(AbstractUser):
    role = models.CharField(max_length=10, default="etudiant")
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    
    username = models.CharField(max_length=50,unique=True)
    email = models.EmailField(unique=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self) -> str:
        return self.email

class Posts(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date_creation = models.DateTimeField(default=timezone.now)
    date_modification = models.DateTimeField(default=timezone.now)
    contenu_texte = models.CharField(max_length=200,default="empty")
    media = models.ImageField(null=True,upload_to='images/', blank=True)

    def __str__(self):
        return self.name

    def num_comments(self):
        return self.comments.count()

    def num_likes(self):
        return self.likes.count()
    def num_saves(self):
        return self.save.count()

class Commentaire(models.Model):
    post = models.ForeignKey(Posts, on_delete=models.CASCADE, related_name='comments', null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE,null=True)
    content = models.TextField()


    def __str__(self):  
        return f"Comment by {self.user.name} on {self.post.name}"




class Likes(models.Model):
    post = models.ForeignKey(Posts, on_delete=models.CASCADE, related_name='likes', null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    class Meta:
        # This ensures a user can only like a post once
        unique_together = ('post', 'user')
        verbose_name_plural = 'Likes'


    def __str__(self):
        return f"Like by {self.user.username} on {self.post.id}"
    

class SavedPost(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_posts')
    post = models.ForeignKey(Posts, on_delete=models.CASCADE, related_name='saved_by')
    date_saved = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')  # Each post can be saved only once by the same user
        ordering = ['-date_saved']  # Most recently saved first

    def __str__(self):
        return f"{self.user.email} saved post {self.post.id}"