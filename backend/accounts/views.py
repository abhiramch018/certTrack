from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from .models import CustomUser
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, AdminUserSerializer


# ──────────────────────────── Registration ────────────────────────────

class RegisterView(APIView):
    """Register a new student or faculty user."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Auto-verify so the user can login immediately
            user.email_verified = True
            user.save(update_fields=['email_verified'])

            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'message': 'Registration successful! You can now log in.',
                'token': token.key,
                'user': UserSerializer(user).data,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ──────────────────────────── Login ────────────────────────────

class LoginView(APIView):
    """Login and receive an auth token."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data,
                'message': 'Login successful.'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
