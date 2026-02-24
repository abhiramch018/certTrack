"""
Management command to send email alerts for certificates expiring within 30 days.

Usage:
    python manage.py send_expiry_alerts              # Send actual emails
    python manage.py send_expiry_alerts --dry-run     # Preview without sending
"""

from datetime import date, timedelta
from django.core.management.base import BaseCommand
from certificates.models import Certificate
from accounts.emails import send_expiry_alert_email


class Command(BaseCommand):
    help = 'Send email alerts for certificates expiring within 30 days'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview alerts without sending emails',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        today = date.today()
        threshold = today + timedelta(days=30)

        expiring = Certificate.objects.filter(
            expiry_date__isnull=False,
            expiry_date__gte=today,
            expiry_date__lte=threshold,
            status='accepted',          # Only alert on accepted certs
        ).select_related('student')

        if not expiring.exists():
            self.stdout.write(self.style.SUCCESS('✅ No certificates expiring within 30 days.'))
            return

        # Group by student
        student_certs = {}
        for cert in expiring:
            student_certs.setdefault(cert.student, []).append(cert)

        self.stdout.write(f'\n📋 Found {expiring.count()} certificate(s) expiring within 30 days:\n')

        emails_sent = 0
        for student, certs in student_certs.items():
            self.stdout.write(f'  👤 {student.get_full_name() or student.username} ({student.email})')
            for c in certs:
                days_left = (c.expiry_date - today).days
                icon = '🔴' if days_left <= 7 else ('🟡' if days_left <= 15 else '🟢')
                self.stdout.write(f'     {icon} {c.title} — expires {c.expiry_date} ({days_left} day(s) left)')

            if dry_run:
                self.stdout.write(self.style.WARNING('     ⏭️  Skipped (dry run)\n'))
                continue

            if not student.email:
                self.stdout.write(self.style.WARNING('     ⚠️  No email address — skipped\n'))
                continue

            try:
                send_expiry_alert_email(student, certs)
                emails_sent += 1
                self.stdout.write(self.style.SUCCESS(f'     ✅ Email sent!\n'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'     ❌ Failed: {e}\n'))

        if dry_run:
            self.stdout.write(self.style.WARNING(f'\n🔍 Dry run complete. No emails sent.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'\n✅ Done! {emails_sent} email(s) sent.'))
