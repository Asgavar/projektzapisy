# Generated by Django 2.0.8 on 2019-02-06 22:50

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('vote', '0003_auto_20190206_2240'),
    ]

    operations = [
        migrations.AlterField(
            model_name='systemstate',
            name='summer_correction_beg',
            field=models.DateField(default=datetime.date(2019, 1, 1), verbose_name='Początek korekty letniej'),
        ),
        migrations.AlterField(
            model_name='systemstate',
            name='summer_correction_end',
            field=models.DateField(default=datetime.date(2019, 7, 31), verbose_name='Koniec korekty letniej'),
        ),
        migrations.AlterField(
            model_name='systemstate',
            name='vote_beg',
            field=models.DateField(default=datetime.date(2019, 6, 10), verbose_name='Początek głosowania'),
        ),
        migrations.AlterField(
            model_name='systemstate',
            name='vote_end',
            field=models.DateField(default=datetime.date(2019, 7, 10), verbose_name='Koniec głosowania'),
        ),
        migrations.AlterField(
            model_name='systemstate',
            name='winter_correction_beg',
            field=models.DateField(default=datetime.date(2019, 1, 1), verbose_name='Początek korekty zimowej'),
        ),
        migrations.AlterField(
            model_name='systemstate',
            name='winter_correction_end',
            field=models.DateField(default=datetime.date(2019, 7, 31), verbose_name='Koniec korekty zimowej'),
        ),
        migrations.AlterField(
            model_name='systemstate',
            name='year',
            field=models.CharField(default='0', max_length=7, verbose_name='rok akademicki'),
        ),
    ]