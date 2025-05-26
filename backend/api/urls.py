from django.urls import path,include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from . import views
from rest_framework_simplejwt.views import  TokenRefreshView

router = DefaultRouter()
router.register(r'conversation', views.ConversationViewSet, basename='conversation')

conversation_router = routers.NestedSimpleRouter(router, r'conversation', lookup='conversation')
conversation_router.register(r'messages', views.MessageViewSet, basename='conversation-messages')

urlpatterns = [
    # Your existing URL patterns
    path('register/', views.RegistrationView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('checkuser/', views.checkUserView.as_view(), name='check_user'),
       path('token/', views.MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('users/', views.UsersListAPIView.as_view(), name='users_list'),
    path('users/<int:pk>/', views.UsersDetailAPIView.as_view(), name='user_detail'),
    path('users/<int:pk>/delete/', views.UserDeleteAPIView.as_view(), name='user_delete'),
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
    path('ressources/', views.RessourceAPIView.as_view(), name='ressources-list'),
    path('ressources/<int:pk>/', views.RessourceAPIView.as_view(), name='ressources-delete'),
    path('posts/search/', views.search_posts, name='search_posts'),
    path('users/search/', views.search_users, name='search_users'),



        path('groups/', views.GroupAPIView.as_view(), name='group-list'),
        path('groups/search/', views.GroupAPIView.as_view(), name='group-search'),
        path('groups/<int:pk>/', views.GroupAPIView.as_view(), name='group-detail'),
        path('groups/<int:pk>/add-members/', views.GroupAddMembersAPIView.as_view(), name='group-add-members'),
        path('groups/<int:pk>/posts/', views.GroupDetailAPIView.as_view(), name='group-posts'),
        path('groups/<int:pk>/posts/add', views.GroupPostCreateAPIView.as_view(), name='group-posts-add'),
        path('groups/<int:pk>/members/', views.GroupMemberAPIView.as_view(), name='group-members'),    
        path('groups/<int:pk>/remove-member/',views.GroupRemoveMemberAPIView.as_view(), name='group-remove-member'),


        path('reports/',views.ReportsAPIView.as_view(),name='reports'),


 path('conversation/<int:conversation_pk>/messages/', 
         views.MessageViewSet.as_view({
             'get': 'list', 
             'post': 'create'
         }), 
         name='conversation-messages'),
         path('conversations/',views.ConversationViewSet.as_view({'get':'list'}),name='conversations-list'),
    
    # Individual message operations (delete)
    path('conversation/<int:conversation_pk>/messages/<int:pk>/', 
         views.MessageViewSet.as_view({
             'delete': 'destroy'  # Fix: Use 'destroy' instead of 'delete'
         }), 
         name='conversation-message-detail'),
    
    # Conversation read status
    path('conversation/<int:conversation_pk>/read/', 
         views.ConversationViewSet.as_view({'post': 'read'}), 
         name='conversation-read'),
     path('api/', include(router.urls)),
    path('api/', include(conversation_router.urls)),
]
