from django.urls import path
from . import views
from rest_framework_simplejwt.views import  TokenRefreshView

urlpatterns = [
    # Your existing URL patterns
    path('register/', views.RegistrationView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('checkuser/', views.checkUserView.as_view(), name='check_user'),
    path('forgot-password/', views.ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', views.ResetPasswordView.as_view(), name='reset_password'),
    path('token/', views.MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('users/', views.UsersListAPIView.as_view(), name='users_list'),
    path('users/<int:pk>/', views.UsersDetailAPIView.as_view(), name='user_detail'),
    path('users/<int:pk>/update/', views.UserUpdateAPIView.as_view(), name='user_update'),
    path('posts/', views.PostsListAPIView.as_view(), name='posts_list'),
    path('posts/create/', views.PostsCreateAPIView.as_view(), name='posts_create'),
    path('posts/<int:pk>/delete/', views.PostsDetailAPIView.as_view(), name='posts_delete'),
    path('posts/<int:pk>/', views.PostsDetailAPIView.as_view(), name='post_detail'),
    path('posts/<int:pk>/like/', views.LikePostAPIView.as_view(), name='like_post'), 
    path('posts/<int:pk>/like-status/', views.LikeStatusAPIView.as_view(), name='post_like_status'),
    path('posts/<int:pk>/comments/', views.CommentListAPIView.as_view(), name='comments_list'),
    path('posts/<int:pk>/comments/<int:comment_id>/', views.CommentListAPIView.as_view(), name='comment-detail'),
    path('posts/<int:pk>/comments/create/', views.CommentListAPIView.as_view(), name='comments_create'),
    path('post/user/<int:user_id>/', views.UserPostsView.as_view(), name='user-posts'),
    path('posts/<int:pk>/save/', views.SavePostAPIView.as_view(), name='save-post'),
    path('saved-posts/', views.SavedPostsListAPIView.as_view(), name='saved-posts-list'),
    path('posts/<int:pk>/save-status/', views.SaveStatusAPIView.as_view(), name='save-status'),
]