# -*- coding: utf-8 -*-
# Generated by Django 1.11.9 on 2018-11-06 23:18
from __future__ import unicode_literals

from django.db import migrations


def make_many_owners(apps, schema_editor):
    CourseEntity = apps.get_model('courses', 'CourseEntity')

    for course_entity in CourseEntity.objects.all():
        if course_entity.owner:
            course_entity.owners.add(course_entity.owner)


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0010_courseentity_owners'),
    ]

    operations = [
        migrations.RunPython(make_many_owners),
    ]