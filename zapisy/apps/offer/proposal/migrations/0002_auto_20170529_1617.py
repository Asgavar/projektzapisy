# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('proposal', '0001_initial'),
        ('courses', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='syllabus',
            name='entity',
            field=models.OneToOneField(related_name='syllabus', verbose_name=b'podstawa przedmiotu', to='courses.CourseEntity'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='syllabus',
            name='learning_methods',
            field=models.ManyToManyField(to='proposal.LearningMethod', null=True, verbose_name='Metody kszta\u0142cenia', blank=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='studentwork',
            name='syllabus',
            field=models.ForeignKey(to='proposal.Syllabus'),
            preserve_default=True,
        ),
    ]