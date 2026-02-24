from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'role']

    def validate_role(self, value):
        if value == 'admin':
            raise serializers.ValidationError("Admin accounts cannot be registered publicly.")
        return value

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'student'),
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        if not user.is_active:
            raise serializers.ValidationError("Account is disabled.")
        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile display and editing."""

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'profile_image']
        read_only_fields = ['id', 'username', 'role']


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for admin viewing all users."""

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined', 'profile_image']
        read_only_fields = ['id', 'date_joined']
