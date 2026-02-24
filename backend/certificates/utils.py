from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Q
from accounts.models import CustomUser
from .models import Certificate


def assign_faculty():
    """
    Faculty rotation logic:
    - Each faculty can handle a max of 5 pending certificate assignments.
    - Returns the first available faculty, or None if all are full.
    """
    faculty_members = CustomUser.objects.filter(role='faculty', is_active=True).annotate(
        pending_count=Count(
            'assigned_certificates',
            filter=Q(assigned_certificates__status='pending')
        )
    ).order_by('pending_count')

    for faculty in faculty_members:
        if faculty.pending_count < 5:
            return faculty

    return None


def get_expiring_certificates(student):
    """
    Returns certificates for a student that expire within 30 days.
    """
    today = timezone.now().date()
    threshold = today + timedelta(days=30)
    return Certificate.objects.filter(
        student=student,
        expiry_date__isnull=False,
        expiry_date__gte=today,
        expiry_date__lte=threshold,
    )


def calculate_performance(student):
    """
    Performance Score = (Accepted * 10) - (Rejected * 2)
    """
    certs = Certificate.objects.filter(student=student)
    accepted = certs.filter(status='accepted').count()
    rejected = certs.filter(status='rejected').count()
    pending = certs.filter(status='pending').count()
    total = certs.count()
    score = (accepted * 10) - (rejected * 2)

    return {
        'score': score,
        'total': total,
        'accepted': accepted,
        'rejected': rejected,
        'pending': pending,
    }
