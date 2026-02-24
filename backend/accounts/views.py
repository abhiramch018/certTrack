from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import CustomUser
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, AdminUserSerializer
from .tokens import EmailVerificationToken, PasswordResetToken
from .emails import send_verification_email, send_password_reset_email, send_welcome_email


# ──────────────────────────── Registration ────────────────────────────

class RegisterView(APIView):
    """Register a new student or faculty user and send verification email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.email_verified = False
            user.save(update_fields=['email_verified'])

            # Create and email verification token
            ev_token = EmailVerificationToken.objects.create(user=user)
            send_verification_email(user, str(ev_token.token))

            return Response({
                'message': (
                    f'Registration successful! A verification email has been sent to {user.email}. '
                    'Please verify your email before logging in.'
                ),
                'email': user.email,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ──────────────────────────── Email Verification ────────────────────────────

class VerifyEmailView(APIView):
    """Verify email address via token link."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        try:
            ev = EmailVerificationToken.objects.select_related('user').get(token=token)
        except (EmailVerificationToken.DoesNotExist, ValueError):
            return Response(
                {'error': 'Invalid or expired verification link.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not ev.is_valid():
            ev.delete()
            return Response(
                {'error': 'Verification link has expired. Please register again or request a new link.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = ev.user
        if user.email_verified:
            return Response({'message': 'Email already verified. You can log in.'})

        user.email_verified = True
        user.save(update_fields=['email_verified'])
        ev.delete()

        send_welcome_email(user)

        # Return token so frontend can auto-login
        auth_token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'message': 'Email verified successfully! You are now logged in.',
            'token': auth_token.key,
            'user': UserSerializer(user).data,
        })


class ResendVerificationView(APIView):
    """Resend verification email for unverified accounts."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            # Don't reveal if email exists
            return Response({'message': 'If this email is registered and unverified, a new link has been sent.'})

        if user.email_verified:
            return Response({'message': 'This email is already verified. Please log in.'})

        # Delete old token and create new one
        EmailVerificationToken.objects.filter(user=user).delete()
        ev_token = EmailVerificationToken.objects.create(user=user)
        send_verification_email(user, str(ev_token.token))

        return Response({'message': 'A new verification email has been sent.'})


# ──────────────────────────── Login ────────────────────────────

class LoginView(APIView):
    """Login and receive an auth token. Requires verified email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']

            # Block login for unverified emails
            if not user.email_verified:
                return Response({
                    'error': 'email_not_verified',
                    'message': (
                        f'Please verify your email address ({user.email}) before logging in. '
                        'Check your inbox for the verification link.'
                    ),
                    'email': user.email,
                }, status=status.HTTP_403_FORBIDDEN)

            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data,
                'message': 'Login successful.'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ──────────────────────────── Forgot / Reset Password ────────────────────────────

class ForgotPasswordView(APIView):
    """Send a password reset email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Always return success to prevent user enumeration
        try:
            user = CustomUser.objects.get(email=email)
            # Invalidate old tokens
            PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
            reset_token = PasswordResetToken.objects.create(user=user)
            send_password_reset_email(user, str(reset_token.token))
        except CustomUser.DoesNotExist:
            pass  # Silent — don't reveal if email exists

        return Response({
            'message': 'If an account with that email exists, a password reset link has been sent.'
        })


class ResetPasswordView(APIView):
    """Reset password using a valid token."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, token):
        password  = request.data.get('password', '')
        password2 = request.data.get('password2', '')

        if not password or not password2:
            return Response({'error': 'Both password fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if password != password2:
            return Response({'error': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reset = PasswordResetToken.objects.select_related('user').get(token=token)
        except (PasswordResetToken.DoesNotExist, ValueError):
            return Response({'error': 'Invalid or expired reset link.'}, status=status.HTTP_400_BAD_REQUEST)

        if not reset.is_valid():
            return Response(
                {'error': 'This reset link has expired. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = reset.user
        try:
            validate_password(password, user)
        except ValidationError as e:
            return Response({'error': ' '.join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(password)
        user.save()

        # Mark token used and invalidate all other tokens for this user
        reset.used = True
        reset.save(update_fields=['used'])
        PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
        # Invalidate existing auth tokens so old sessions can't be reused
        Token.objects.filter(user=user).delete()

        return Response({'message': 'Password reset successfully. You can now log in with your new password.'})


# ──────────────────────────── Profile ────────────────────────────

class ProfileView(APIView):
    """View and update the current user's profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ──────────────────────────── Admin Users ────────────────────────────

class AdminUserListView(APIView):
    """Admin-only: List all users or delete a user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        users = CustomUser.objects.all().order_by('-date_joined')
        return Response(AdminUserSerializer(users, many=True).data)

    def delete(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = CustomUser.objects.get(pk=pk)
            user.delete()
            return Response({'message': 'User deleted.'}, status=status.HTTP_204_NO_CONTENT)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
