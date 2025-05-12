
# Create your views here.
from django.contrib.auth.hashers import make_password,check_password
from django.core.mail import send_mail
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User, Token, Posts, Likes, Commentaire,SavedPost
from .serializers import UserSerializer, TokenSerializer,PostsSerializer, MyTokenObtainPairSerializer,CommentsSerializer,SavedPostSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings
from django.shortcuts import get_object_or_404
from datetime import  timedelta
import hashlib
import uuid
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone

SALT = "8b4f6b2cc1868d75ef79e5cfb8779c11b6a374bf0fce05b485581bf4e1e25b96c8c2855015de8449"
URL = "http://localhost:5173"


def mail_template(content,button_url, button_text):
    return f"""<!DOCTYPE html>
            <html>
            <body style="text-align: center; font-family: "Verdana", serif; color: #000;">
                <div style="max-width: 600px; margin: 10px; background-color: #fafafa; padding: 25px; border-radius: 20px;">
                <p style="text-align: left;">{content}</p>
                <a href="{button_url}" target="_blank">
                    <button style="background-color: #444394; border: 0; width: 200px; height: 30px; border-radius: 6px; color: #fff;">{button_text}</button>
                </a>
                <p style="text-align: left;">
                    If you are unable to click the above button, copy paste the below URL into your address bar
                </p>
                <a href="{button_url}" target="_blank">
                    <p style="margin: 0px; text-align: left; font-size: 10px; text-decoration: none;">{button_url}</p>
                </a>
                </div>
            </body>
            </html>"""

class ResetPasswordView(APIView):
    def post(self, request, format=None):
        user_id = request.data.get("id")
        token = request.data.get("token")
        password = request.data.get("password")

        token_obj = Token.objects.filter(user_id=user_id, token=token).order_by('-created_at').first()
        
        # First check if token exists
        if token_obj is None:
            return Response(
                {
                    "success": False,
                    "message": "Invalid Password Reset Link!",
                },
                status=status.HTTP_200_OK,
            )
        # Then check if token is already used
        elif token_obj.is_used:
            return Response(
                {
                    "success": False,
                    "message": "This reset link has already been used!",
                },
                status=status.HTTP_200_OK,
            )
        # Then check expiration
        elif token_obj.expires_at < timezone.now():
            return Response(
                {
                    "success": False,
                    "message": "Password Reset Link has expired!",
                },
                status=status.HTTP_200_OK,
            )
        # If all checks pass, proceed with password reset
        else:
            token_obj.is_used = True
            hashed_password = make_password(password, salt=SALT)
            ret_code = User.objects.filter(id=user_id).update(password=hashed_password)
            if ret_code:
                token_obj.save()
                return Response(
                    {
                        "success": True,
                        "message": "Password has been reset successfully!",
                    },
                    status=status.HTTP_200_OK,
                )


class ForgotPasswordView(APIView):
    def post(self, request):
        email = request.data["email"]
        user = User.objects.get(email=email)
        created_at = timezone.now()
        expires_at = created_at + timedelta(hours=1)
        salt = uuid.uuid4().hex
        token = hashlib.sha512((str(user.id)+user.password + created_at.isoformat() + salt).encode('utf-8')).hexdigest()
        token_obj = {
            "token":token,
            "created_at": created_at,
            "expires_at": expires_at,
            "user_id": user.id,                    
        }
        serializer = TokenSerializer(data=token_obj)
        if serializer.is_valid():
            serializer.save()
            subject = "Forgort Password Link"
            content = mail_template("We have received a request to reset your password. Please reset your password using the link below.",
                f"{URL}/resetPassword?id={user.id}&token={token}",
                "Reset Password",)
            send_mail(subject,message=content, from_email=settings.EMAIL_HOST_USER, recipient_list=[email], html_message=content)
            return Response(
                {
                    "success": True,
                    "message": "A password reset link has been sent to your email.",
                },
                status=status.HTTP_200_OK,
            )
        else:
            error_msg = ""
            for key in serializer.errors:
                error_msg += f"{key}: {serializer.errors[key][0]}"
            return Response(
                {
                    "success": False,
                    "message": error_msg,
                },
                status=status.HTTP_200_OK,
            )
        


class RegistrationView(APIView):
    def post(self, request, format=None):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "success": True,
                    "message": "User has been created successfully!",
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(
            {
                "success": False,
                "message": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class LoginView(APIView):
    def post(self, request, format=None):
        email = request.data.get("email")
        password = request.data.get("password")
        
        try:
            user = User.objects.get(email=email)
            
            # If using Django's built-in password hashing
            if check_password(password, user.password):
                # Create a refresh token and an access token
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)

                return Response(
                    {
                        "success": True,
                        "message": "Login successful!",
                        "access_token": access_token,  # Send the access token in the response
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {
                        "success": False,
                        "message": "Invalid credentials!",
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        except User.DoesNotExist:
            # You might want to use the same error message to not reveal if the email exists
            return Response(
                {
                    "success": False,
                    "message": "Invalid credentials!",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
        


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class checkUserView(APIView):
    def post(self, request, format=None):
        email = request.data["email"]
        try:
            user = User.objects.get(email=email)
            return Response(
                {
                    "success": True,
                    "message": "User exists",
                    "exists": True  # Add this for frontend clarity
                },
                status=status.HTTP_200_OK,
            )
        except User.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "User does not exist",
                    "exists": False  # Add this for frontend clarity
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        

class UsersListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self,request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    
class UsersDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, pk):
        return get_object_or_404(User, pk=pk)

    def get(self, request, pk):
        user = self.get_object(pk)
        serializer = UserSerializer(user)
        return Response(serializer.data)

    def patch(self, request, pk):
        user = self.get_object(pk)
        
        # Add permission check to ensure users can only modify their own profiles
        if request.user.id != user.id and not request.user.is_staff:
            return Response(
                {"detail": "You don't have permission to update this profile."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
class UserUpdateAPIView(UsersDetailAPIView):
    """
    This view is identical to UsersDetailAPIView but provides a separate endpoint
    for profile updates at /users/{pk}/update/
    """
    pass




class PostsCreateAPIView(APIView):
    # Add permission class to require authentication
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser] 

    def post(self, request):
        # Add the user from the request
        data = request.data.copy()
        data['user'] = request.user.id

        serializer = PostsSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user)  # Explicitly set the user
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        # Return the specific validation errors for debugging
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class PostsListAPIView(APIView):
    # Add permission class to require authentication
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        posts = Posts.objects.all().order_by('-date_creation')  # Most recent first
        serializer = PostsSerializer(posts, many=True)
        return Response(serializer.data)
# Retrieve, update or delete a post
class PostsDetailAPIView(APIView):
    def get_object(self, pk):
        return get_object_or_404(Posts, pk=pk)

    def get(self, request, pk):
        post = self.get_object(pk)
        serializer = PostsSerializer(post)
        return Response(serializer.data)

    def put(self, request, pk):
        post = self.get_object(pk)
        serializer = PostsSerializer(post, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        post = self.get_object(pk)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    


class LikePostAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        """Get post details with like information"""
        post = get_object_or_404(Posts, pk=pk)
        serializer = PostsSerializer(post)
        return Response(serializer.data)
    
    def post(self, request, pk):
        """Add a like to the post"""
        post = get_object_or_404(Posts, pk=pk)
        user = request.user

        # Check if the user has already liked the post
        if Likes.objects.filter(post=post, user=user).exists():
            return Response({"message": "You have already liked this post."}, status=status.HTTP_400_BAD_REQUEST)

        # Create the like
        Likes.objects.create(post=post, user=user)
        
        # Return the updated like count
        return Response({
            "message": "Post liked successfully!",
            "num_likes": post.num_likes()
        }, status=status.HTTP_200_OK)
    
    def delete(self, request, pk):
        """Remove a like from the post"""
        post = get_object_or_404(Posts, pk=pk)
        user = request.user

        # Try to find and delete the like
        try:
            like = Likes.objects.get(post=post, user=user)
            like.delete()
            return Response({
                "message": "Post unliked successfully!",
                "num_likes": post.num_likes()
            }, status=status.HTTP_200_OK)
        except Likes.DoesNotExist:
            return Response({"message": "You haven't liked this post yet."}, status=status.HTTP_400_BAD_REQUEST)
        
class LikeStatusAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        """Get the like status for the current user and total like count"""
        post = get_object_or_404(Posts, pk=pk)
        user = request.user
        
        # Check if user has liked the post
        user_has_liked = Likes.objects.filter(post=post, user=user).exists()
        
        # Return the like status and count using the model method
        return Response({
            "user_has_liked": user_has_liked,
            "num_likes": post.num_likes()
        }, status=status.HTTP_200_OK)
    

class CommentListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        """Get all comments for a specific post"""
        post = get_object_or_404(Posts, pk=pk)
        comments = post.comments.all()
        serializer = CommentsSerializer(comments, many=True)
        return Response(serializer.data)
    
    def post(self, request, pk):
        post = get_object_or_404(Posts, pk=pk)
        user = request.user
        content = request.data.get("content")

        if not content:
            return Response({"message": "Content is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the comment
        comment = post.comments.create(user=user, content=content)
        serializer = CommentsSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def put(self, request, pk, comment_id):
        """Update a comment"""
        post = get_object_or_404(Posts, pk=pk)
        user = request.user
        content = request.data.get("content")
        
        if not content:
            return Response({"message": "Content is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            comment = Commentaire.objects.get(post=post, user=user, id=comment_id)
            comment.content = content
            comment.save()
            serializer = CommentsSerializer(comment)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Commentaire.DoesNotExist:
            return Response(
                {"message": "Comment not found or you don't have permission to update it."}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def delete(self,request,pk,comment_id):
        post = get_object_or_404(Posts,pk=pk)
        user = request.user
        commentaire = get_object_or_404(Commentaire,pk=comment_id,post=post)

        try:
            comment = Commentaire.objects.get(post=post,user=user,id=commentaire.id)
            comment.delete()
            return Response({"message":"Comment deleted successfully!"},status=status.HTTP_200_OK)
        except Commentaire.DoesNotExist:
            return Response({"message":"Comment not found!"},status=status.HTTP_404_NOT_FOUND)
        

class UserPostsView(APIView):
    """
    API view to retrieve all posts from a specific user
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, user_id):

        try:
            # Get the user by ID
            user = get_object_or_404(User, id=user_id)
            
            # Get all posts by this user, ordered by creation date (newest first)
            posts = Posts.objects.filter(user=user).order_by('-date_creation')
            
            # Serialize the posts
            posts_serializer = PostsSerializer(posts, many=True, context={'request': request})
            
            # Serialize the user
            user_serializer = UserSerializer(user)
            
            # Return both user data and posts
            response_data = {
                'user': user_serializer.data,
                'posts': posts_serializer.data
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch user posts: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class SavePostAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        """Save a post for the current user"""
        post = get_object_or_404(Posts, pk=pk)
        user = request.user
        
        # Check if the user has already saved this post
        if SavedPost.objects.filter(post=post, user=user).exists():
            return Response({"message": "You have already saved this post"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the saved post record
        SavedPost.objects.create(post=post, user=user)
        
        return Response({
            "message": "Post saved successfully!",
        }, status=status.HTTP_201_CREATED)
    
    def delete(self, request, pk):
        """Unsave a post for the current user"""
        post = get_object_or_404(Posts, pk=pk)
        user = request.user
        
        try:
            saved_post = SavedPost.objects.get(post=post, user=user)
            saved_post.delete()
            return Response({
                "message": "Post unsaved successfully!"
            }, status=status.HTTP_200_OK)
        except SavedPost.DoesNotExist:
            return Response({"message": "You haven't saved this post"}, status=status.HTTP_400_BAD_REQUEST)


class SavedPostsListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get all posts saved by the current user"""
        user = request.user
        saved_posts = SavedPost.objects.filter(user=user)

        serializer = SavedPostSerializer(saved_posts, many=True)
        return Response(serializer.data)



class SaveStatusAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        """Check if the current user has saved a specific post"""
        post = get_object_or_404(Posts, pk=pk)
        user = request.user
        
        user_has_saved = SavedPost.objects.filter(post=post, user=user).exists()
        
        return Response({
            "user_has_saved": user_has_saved
        }, status=status.HTTP_200_OK)
