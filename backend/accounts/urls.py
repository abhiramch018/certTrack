from django.urls import path
from . import views

urlpatterns = [
    path('register/',               views.RegisterView.as_view(),          name='register'),
    path('login/',                  views.LoginView.as_view(),             name='login'),
    path('profile/',                views.ProfileView.as_view(),           name='profile'),
    path('users/',                  views.AdminUserListView.as_view(),     name='admin-users'),
    path('users/<int:pk>/',         views.AdminUserListView.as_view(),     name='admin-user-delete'),

    # Email verification
    path('verify-email/<str:token>/',   views.VerifyEmailView.as_view(),   name='verify-email'),
    path('resend-verification/',        views.ResendVerificationView.as_view(), name='resend-verification'),

    # Password reset
    path('forgot-password/',            views.ForgotPasswordView.as_view(),    name='forgot-password'),
    path('reset-password/<str:token>/', views.ResetPasswordView.as_view(),     name='reset-password'),
]
