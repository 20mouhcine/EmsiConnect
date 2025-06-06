# Generated by Django 5.2 on 2025-05-13 11:20

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_savedpost'),
    ]

    operations = [
        migrations.CreateModel(
            name='Ressources',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date_creation', models.DateTimeField(default=django.utils.timezone.now)),
                ('media', models.FileField(blank=True, null=True, upload_to='ressources/')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
