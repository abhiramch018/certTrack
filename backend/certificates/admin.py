from django.contrib import admin
from .models import Certificate


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['title', 'student', 'faculty', 'status', 'organization', 'created_at']
    list_filter = ['status', 'organization']
    search_fields = ['title', 'student__username', 'faculty__username']
