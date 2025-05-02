from django.shortcuts import render

# Create your views here.
from django.shortcuts import render
from django.contrib.auth.hashers import make_password,check_password
from django.core.mail import send_mail
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User, Token,Posts
from .serializers import UserSerializer, TokenSerializer,PostsSerializer
from django.conf import settings
from datetime import datetime, timedelta
import hashlib
from rest_framework.decorators import api_view
import uuid
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser
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

