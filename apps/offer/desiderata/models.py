# -*- coding: utf-8 -*-
from django.db import models
from apps.enrollment.courses.models import DAYS_OF_WEEK, Course, Semester


class Desiderata(models.Model):
    employee = models.ForeignKey('users.Employee', verbose_name='prowadzący')
    semester = models.ForeignKey(Semester, verbose_name='semestr')
    day = models.CharField(max_length=1, choices=DAYS_OF_WEEK, verbose_name='dzień tygodnia')
    hour = models.IntegerField(verbose_name='godzina')

    @staticmethod
    def get_desiderata(employee, semester):
        desideratas = Desiderata.objects.filter(semester=semester, employee=employee)
        result = {}
        for day in range(1, 8, 1):
            result[str(day)] = {}
            for hour in range(8, 22, 1):
                result[str(day)][hour] = None
        for desiderata in desideratas:
            result[desiderata.day][desiderata.hour] = desiderata
        return result

    @staticmethod
    def get_desiderata_to_formset(desideratas):
        result = []
        result_append = result.append
        for day in desideratas:
            for hour in desideratas[day]:
                value = not bool(desideratas[day][hour])
                result_append({'day':day, 'hour': hour, 'value': value})
        return result


class DesiderataOther(models.Model):
    employee = models.ForeignKey('users.Employee', verbose_name='prowadzący')
    semester = models.ForeignKey(Semester, verbose_name='semestr')
    comment = models.CharField(verbose_name='uwagi', max_length=200, default='')

    class Meta:
        unique_together = (("employee", "semester"),)

    @staticmethod
    def get_desiderata_other(employee, semester):
        try:
            desiderata = DesiderataOther.objects.get(semester=semester, employee=employee)
        except:
            desiderata = DesiderataOther.objects.create(semester=semester, employee=employee)
        return desiderata