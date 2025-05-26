
# Create your views here.
from django.contrib.auth.hashers import make_password,check_password
from django.core.mail import send_mail
from rest_framework import status, permissions,viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User, Token, Posts, Likes, Commentaire,SavedPost,Ressources,Groupe,Message,Conversation,Reports
from .serializers import UserSerializer,PostsSerializer,TokenSerializer, MyTokenObtainPairSerializer,CommentsSerializer,SavedPostSerializer,RessourceSerializer,GroupeSerializer,MessageSerializer,ConversationSerializer,ReportsListSerializer,ReportsCreateSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.http import Http404
from datetime import  timedelta
from rest_framework.decorators import action
import hashlib
from django.db.models import Q
import uuid
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

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
        
        if token_obj is None:
            return Response(
                {
                    "success": False,
                    "message": "Invalid Password Reset Link!",
                },
                status=status.HTTP_200_OK,
            )
        elif token_obj.is_used:
            return Response(
                {
                    "success": False,
                    "message": "This reset link has already been used!",
                },
                status=status.HTTP_200_OK,
            )
        elif token_obj.expires_at < timezone.now():
            return Response(
                {
                    "success": False,
                    "message": "Password Reset Link has expired!",
                },
                status=status.HTTP_200_OK,
            )
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
            
            if check_password(password, user.password):
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)

                return Response(
                    {
                        "success": True,
                        "message": "Login successful!",
                        "access_token": access_token,
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
                    "exists": True
                },
                status=status.HTTP_200_OK,
            )
        except User.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "User does not exist",
                    "exists": False 
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
    
    
class UserDeleteAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self,pk):
        return get_object_or_404(User,pk=pk)
    
    def delete(self,request,pk):
        print("pk = ",pk)
        user = self.get_object(pk=pk)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    
class UserUpdateAPIView(UsersDetailAPIView):
    pass




class PostsCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser] 

    def post(self, request):
        data = request.data.copy()
        data['user'] = request.user.id

        serializer = PostsSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user)  
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class PostsListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        posts = Posts.objects.all().order_by('-date_creation')  
        serializer = PostsSerializer(posts, many=True)
        return Response(serializer.data)


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
        post = get_object_or_404(Posts, pk=pk)
        serializer = PostsSerializer(post)
        return Response(serializer.data)
    
    def post(self, request, pk):
        post = get_object_or_404(Posts, pk=pk)
        user = request.user

        if Likes.objects.filter(post=post, user=user).exists():
            return Response({"message": "You have already liked this post."}, status=status.HTTP_400_BAD_REQUEST)

        Likes.objects.create(post=post, user=user)
        
        return Response({
            "message": "Post liked successfully!",
            "num_likes": post.num_likes()
        }, status=status.HTTP_200_OK)
    
    def delete(self, request, pk):
        post = get_object_or_404(Posts, pk=pk)
        user = request.user

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
        
        comment = post.comments.create(user=user, content=content)
        serializer = CommentsSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def put(self, request, pk, comment_id):
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
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, user_id):

        try:
            user = get_object_or_404(User, id=user_id)
            
            posts = Posts.objects.filter(user=user).order_by('-date_creation')
            
            posts_serializer = PostsSerializer(posts, many=True, context={'request': request})
            
            user_serializer = UserSerializer(user)
            
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
        
        if SavedPost.objects.filter(post=post, user=user).exists():
            return Response({"message": "You have already saved this post"}, status=status.HTTP_400_BAD_REQUEST)
        
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


class RessourceAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser] 
    def get_object(self, pk, user):
        try:
            return Ressources.objects.get(pk=pk)
        except Ressources.DoesNotExist:
            raise Http404
    def get(self, request):
        ressources = Ressources.objects.all()
        serializer = RessourceSerializer(ressources, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = RessourceSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def put(self, request, pk):
        ressource = self.get_object(pk, request.user)
        serializer = RessourceSerializer(ressource, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save() 
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        ressource = self.get_object(pk, request.user)
        ressource.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_posts(request):
    query = request.query_params.get('query', '')
    if not query:
        return Response([])
    
    posts = Posts.objects.filter(
        Q(contenu_texte__icontains=query) | 
        Q(user__username__icontains=query) 
    ).select_related('user').order_by('-date_creation')[:10]
    serializer = PostsSerializer(posts, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_users(request):
    query = request.query_params.get('query', '')
    if not query:
        return Response([])
    
    users = User.objects.filter(
        Q(username__icontains=query)
    )[:10]
    
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

# @api_view(['GET'])
# @permission_classes([permissions.IsAuthenticated])
# def search_groups(request):
#     query = request.query_params.get('query', '')
#     if not query:
#         return Response([])
    
#     # Search in group name and description
#     groups = Group.objects.filter(
#         Q(name__icontains=query) | 
#         Q(description__icontains=query)
#     )[:10]  # Limit to 10 results
    
#     serializer = GroupSerializer(groups, many=True)
#     return Response(serializer.data)


class GroupAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk=None):
        if pk:
            # Get a specific group
            groupe = get_object_or_404(Groupe, pk=pk)
            
            # Check if user is a member or admin
            if request.user == groupe.admin or request.user in groupe.users.all():
                serializer = GroupeSerializer(groupe)
                return Response(serializer.data)
            
            
                
            return Response(
                {"detail": "You don't have permission to view this group."},
                status=status.HTTP_403_FORBIDDEN
            )
        else:
            filter_type = request.query_params.get('filter', 'all')
            
            if filter_type == 'admin':
                groups = Groupe.objects.filter(admin=request.user)
            elif filter_type == 'member':
                # Groups where user is a member
                groups = request.user.member_groups.all()
            else:
                # All groups user has access to (either admin or member)
                admin_groups = Groupe.objects.filter(admin=request.user)
                member_groups = request.user.member_groups.all()
                groups = (admin_groups | member_groups).distinct()
            
            serializer = GroupeSerializer(groups, many=True)
            return Response(serializer.data)
    
    def post(self, request):
        data = request.data.copy()
        
        serializer = GroupeSerializer(data=data, context={'request': request})
        
        if serializer.is_valid():
            groupe = serializer.save(admin=request.user)
            
            # Add current user as a member if not already included
            if 'users' not in data or request.user.id not in data['users']:
                groupe.users.add(request.user)
            
            # Return the updated group with full member information
            updated_serializer = GroupeSerializer(groupe)
            return Response(updated_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk):
        groupe = get_object_or_404(Groupe, pk=pk)
        
        if request.user != groupe.admin:
            return Response(
                {"detail": "Only the group admin can update this group."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = GroupeSerializer(groupe, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        groupe = get_object_or_404(Groupe, pk=pk)
        if groupe.users.count == 1:
            groupe.delete()
        
        if request.user != groupe.admin:
            return Response(
                {"detail": "Only the group admin can delete this group."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        groupe.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class GroupDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Groupe, pk=pk)
    
    def get(self, request, pk):
        group = self.get_object(pk)
        
        posts = Posts.objects.filter(groupe=group).order_by("-date_creation")
        
        if request.user == group.admin or request.user in group.users.all():
            serializer = PostsSerializer(posts,many=True)
            return Response(serializer.data)
        
        return Response(
            {"detail": "You don't have permission to view this group."},
            status=status.HTTP_403_FORBIDDEN
        )

        
class GroupPostCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get_object(self,pk):
        return get_object_or_404(Groupe,pk=pk)

    def post(self, request, pk):
        """Create a new post in the group"""
        group = self.get_object(pk)
        
        if not (request.user == group.admin or request.user in group.users.all()):
            return Response(
                {"detail": "You must be a member to post in this group."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        contenu_texte = request.data.get('contenu_texte', '').strip()
        media = request.FILES.get('media')
        
        if not contenu_texte and not media:
            return Response(
                {"detail": "Post must have content or media."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                # Create the post data with correct field names
                post_data = {
                    'contenu_texte': contenu_texte,
                    'groupe': group.id
                }
                
                # Add media if provided
                if media:
                    post_data['media'] = media
                
                post_serializer = PostsSerializer(data=post_data)
                if post_serializer.is_valid():
                    # Pass the user directly to save method
                    post = post_serializer.save(user=request.user)
                    
                    response_serializer = PostsSerializer(post)
                    return Response(
                        response_serializer.data,
                        status=status.HTTP_201_CREATED
                    )
                else:
                    return Response(
                        post_serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
        except Exception as e:
            return Response(
                {"detail": f"Error creating post: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )       
    
class GroupMemberAPIView(APIView):
    """
    API view for managing group members
    """
    permission_classes = [IsAuthenticated]
    def get_group(self, pk):
        return get_object_or_404(Groupe, pk=pk)
        
    
    def post(self, request, pk):
        group = self.get_group(pk)
        user = request.user
        
        # Check if the user is already a member
        if user in group.users.all():
            return Response({"detail": "You're already a member of this group."}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
       
        
        # Add user to the group
        group.users.add(user)
        return Response({"detail": "Successfully joined the group."})
        
    def delete(self, request, pk):
        """
        Leave a group
        """
        group = self.get_group(pk)
        user = request.user
        
        # Check if the user is a member
        if user not in group.users.all():
            return Response({"detail": "You're not a member of this group."}, 
                            status=status.HTTP_400_BAD_REQUEST)
                            
        # Admin cannot leave without appointing new admin
        if user == group.admin:
            return Response(
                {"detail": "As the admin, you need to transfer ownership before leaving."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove user from the group
        group.users.remove(user)
        return Response({"detail": "Successfully left the group."})
    


class GroupAddMembersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        group = get_object_or_404(Groupe, pk=pk)

        # Seul l'admin peut ajouter des membres
        if request.user != group.admin:
            return Response(
                {"detail": "Only the group admin can add members."},
                status=status.HTTP_403_FORBIDDEN
            )

        user_ids = request.data.get('user_ids', [])
        if not isinstance(user_ids, list) or not user_ids:
            return Response(
                {"detail": "A list of user IDs is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        added = []
        already_members = []
        invalid_ids = []

        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                if user in group.users.all():
                    already_members.append(user_id)
                else:
                    group.users.add(user)
                    added.append(user_id)
            except User.DoesNotExist:
                invalid_ids.append(user_id)

        return Response({
            "added": added,
            "already_members": already_members,
            "invalid_ids": invalid_ids,
        }, status=status.HTTP_200_OK)

class GroupRemoveMemberAPIView(APIView):

    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        group = get_object_or_404(Groupe, pk=pk)
        
        if request.user != group.admin:
            return Response(
                {"detail": "Only the group admin can remove members."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {"detail": "User ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_to_remove = User.objects.get(id=user_id)
            
            if user_to_remove not in group.users.all():
                return Response(
                    {"detail": "This user is not a member of the group."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if user_to_remove == group.admin:
                return Response(
                    {"detail": "Cannot remove the group admin."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            group.users.remove(user_to_remove)
            
            return Response({
                "detail": "Member removed successfully.",
                "user_id": user_id
            })
            
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    def list(self, request, *args, **kwargs):

        queryset = self.get_queryset()
        
        # Optional filtering
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(initiator__username__icontains=search) |
                Q(receiver__username__icontains=search) |
                Q(initiator__first_name__icontains=search) |
                Q(receiver__first_name__icontains=search)
            )
        
        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def get_queryset(self):
        return Conversation.objects.filter(
            Q(initiator=self.request.user) | Q(receiver=self.request.user)
        )
    
    def create(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if conversation already exists
        existing_conversation = Conversation.objects.filter(
            (Q(initiator=request.user) & Q(receiver_id=user_id)) |
            (Q(initiator_id=user_id) & Q(receiver=request.user))
        ).first()
        
        if existing_conversation:
            serializer = self.get_serializer(existing_conversation)
            return Response(serializer.data)
        
        # Create new conversation
        conversation = Conversation(
            initiator=request.user,
            receiver_id=user_id
        )
        conversation.save()
        
        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        since_id = request.query_params.get('since_id', 0)
        
        messages = Message.objects.filter(
            conversation=conversation,
            id__gt=since_id
        ).order_by('timestamp')
        
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        conversation = self.get_object()
        message_ids = request.data.get('message_ids', [])
        
        if not message_ids:
            return Response({"error": "message_ids are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Only mark messages as read if they were sent to the current user
        messages = Message.objects.filter(
            id__in=message_ids,
            conversation=conversation,
            sender__not=request.user
        )
        
        updated_count = messages.update(read=True)
        return Response({"updated": updated_count})


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self, pk=None):
        # Fix: Add default parameter and proper error handling
        if pk is None:
            pk = self.kwargs.get('pk')
        
        # Get the conversation first to ensure user has access
        conversation_pk = self.kwargs.get('conversation_pk')
        if conversation_pk:
            conversation = get_object_or_404(
                Conversation, 
                Q(initiator=self.request.user) | Q(receiver=self.request.user),
                pk=conversation_pk
            )
            # Get message that belongs to this conversation
            return get_object_or_404(Message, pk=pk, conversation=conversation)
        else:
            # Fallback: get message and check if user has access to its conversation
            message = get_object_or_404(Message, pk=pk)
            conversation = message.conversation
            if conversation.initiator != self.request.user and conversation.receiver != self.request.user:
                raise PermissionDenied("You don't have access to this message")
            return message
    
    def list(self, request, conversation_pk=None):
        conversation = get_object_or_404(
            Conversation, 
            Q(initiator=request.user) | Q(receiver=request.user),
            pk=conversation_pk
        )
        
        since_id = request.query_params.get('since_id', 0)
        messages = Message.objects.filter(
            conversation=conversation,
            id__gt=since_id
        ).order_by('timestamp')
        
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)
    
    def create(self, request, conversation_pk=None):
        conversation = get_object_or_404(
            Conversation, 
            Q(initiator=request.user) | Q(receiver=request.user),
            pk=conversation_pk
        )
        
        # Create new message
        message = Message(
            conversation=conversation,
            sender=request.user,
            content=request.data.get('content', '')
        )
        message.save()
        
        serializer = self.get_serializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, pk=None, conversation_pk=None):
        # Fix: Use destroy method instead of delete, and add proper validation
        message = self.get_object(pk)
        
        # Security check: only allow deletion of own messages
        if message.sender != request.user:
            return Response(
                {"error": "You can only delete your own messages"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        message.delete()
        return Response(
            {"message": "Message deleted successfully"}, 
            status=status.HTTP_200_OK
        )
    

class ReportsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reports = Reports.objects.all()
        unique_reports = []
        seen_ids = set()

        for report in reports:
            if report.post_reported.id not in seen_ids:
                unique_reports.append(report)
                seen_ids.add(report.post_reported.id)
        serializer = ReportsListSerializer(unique_reports, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = ReportsCreateSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            print(f"Errors: {serializer.errors}")
        
        if serializer.is_valid():
            report = serializer.save()
            response_serializer = ReportsListSerializer(report)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)