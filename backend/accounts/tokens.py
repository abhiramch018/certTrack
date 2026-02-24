"""
Token models for email verification and password reset.
"""

import uuid
from datetime import timedelta
from django.db import models
from django.utils import timezone
from django.conf import settings


class EmailVerificationToken(models.Model):
    """One-time token sent on registration to verify email address."""

    user   = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='email_verification_token'
    )
    token  = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    EXPIRY_HOURS = 24

    def is_valid(self):
        """Token is valid for 24 hours."""
        return timezone.now() < self.created_at + timedelta(hours=self.EXPIRY_HOURS)

    def __str__(self):
        return f"EmailVerificationToken({self.user.username})"


class PasswordResetToken(models.Model):
    """One-time token for resetting password (valid 1 hour, single use)."""

    user  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='password_reset_tokens'
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    used  = models.BooleanField(default=False)

    EXPIRY_HOURS = 1

    def is_valid(self):
        """Token is valid for 1 hour and must not have been used."""
        return (
            not self.used and
            timezone.now() < self.created_at + timedelta(hours=self.EXPIRY_HOURS)
        )

    def __str__(self):
        return f"PasswordResetToken({self.user.username}, used={self.used})"
