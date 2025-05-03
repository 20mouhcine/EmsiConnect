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
    path('posts/', views.PostsListAPIView.as_view(), name='posts_list'),
    path('posts/create/', views.PostsCreateAPIView.as_view(), name='posts_create'),
    path('posts/<int:pk>/', views.PostsDetailAPIView.as_view(), name='post_detail'),
    path('posts/<int:pk>/like/', views.LikePostAPIView.as_view(), name='like_post'), 
    path('posts/<int:pk>/like-status/', views.LikeStatusAPIView.as_view(), name='post_like_status'),
    
    # Add this new URL pattern for the like feature
]