"""
Email sending utilities for CertTrack authentication and alerts.
"""

from django.core.mail import send_mail
from django.conf import settings


FRONTEND_URL = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')


def send_verification_email(user, token):
    """Send an account verification email after registration."""
    verify_link = f"{FRONTEND_URL}/verify-email/{token}"
    subject = "✅ Verify your CertTrack account"
    message = f"""Hello {user.get_full_name() or user.username},

Welcome to CertTrack! Please verify your email address to activate your account.

Click the link below to verify:
{verify_link}

This link expires in 24 hours.

If you did not register on CertTrack, please ignore this email.

— CertTrack Team
"""
    _send(subject, message, user.email)


def send_password_reset_email(user, token):
    """Send a password reset email."""
    reset_link = f"{FRONTEND_URL}/reset-password/{token}"
    subject = "🔐 CertTrack — Password Reset Request"
    message = f"""Hello {user.get_full_name() or user.username},

We received a request to reset your CertTrack password.

Click the link below to choose a new password:
{reset_link}

This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.

— CertTrack Team
"""
    _send(subject, message, user.email)


def send_welcome_email(user):
    """Send a welcome email after successful email verification."""
    subject = "🎉 Welcome to CertTrack!"
    message = f"""Hello {user.get_full_name() or user.username},

Your email has been verified successfully! You can now log in and start tracking your certifications.

Visit: {FRONTEND_URL}/login

— CertTrack Team
"""
    _send(subject, message, user.email)


def send_expiry_alert_email(user, certs):
    """Send expiry alert email for a list of expiring certificates."""
    from datetime import date
    today = date.today()

    cert_lines = []
    for c in certs:
        days_left = (c.expiry_date - today).days
        if days_left <= 7:
            icon = "🔴"
        elif days_left <= 15:
            icon = "🟡"
        else:
            icon = "🟢"
        cert_lines.append(
            f"  {icon} {c.title} ({c.organization})\n"
            f"     Expires: {c.expiry_date} — {days_left} day(s) left"
        )

    subject = f"⚠️ CertTrack: {len(certs)} Certificate(s) Expiring Soon!"
    message = (
        f"Hello {user.get_full_name() or user.username},\n\n"
        f"The following certificate(s) are expiring within 30 days:\n\n"
        + "\n\n".join(cert_lines) +
        f"\n\nPlease renew them before expiry to maintain your certification record.\n\n"
        f"Login to view details: {FRONTEND_URL}/login\n\n"
        f"🔴 ≤7 days  🟡 ≤15 days  🟢 ≤30 days\n\n"
        f"— CertTrack Platform"
    )
    _send(subject, message, user.email)


def _send(subject, message, to_email):
    """Internal helper — silently skips if no email configured."""
    if not to_email:
        return
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL or 'noreply@certtrack.app',
            [to_email],
            fail_silently=False,
        )
    except Exception as e:
        # Log but don't crash the request
        import logging
        logging.getLogger(__name__).warning(f"Email send failed to {to_email}: {e}")
