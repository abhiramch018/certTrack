from django.db import models
from django.conf import settings


class Certificate(models.Model):
    """Certificate uploaded by a student for faculty verification."""

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='certificates'
    )
    faculty = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_certificates'
    )
    title = models.CharField(max_length=255)
    organization = models.CharField(max_length=255)
    issue_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    file = models.FileField(upload_to='certificates/')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    remarks = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'certificates'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} — {self.student.username} ({self.status})"
