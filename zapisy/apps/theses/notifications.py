"""
Implements theses email notifications
"""
from mailer import send_mail
from django.conf import settings

from .models import Thesis


ACCEPTED_SUBJECT = "[Zapisy – prace dyplomowe] Temat zaakceptowany"
ACCEPTED_BODY = "Temat pracy \"{}\" został zaakceptowany."

REJECTED_SUBJECT = "[Zapisy – prace dyplomowe] Temat zwrócony do poprawek"
ACCEPTED_BODY = "Temat pracy \"{}\" został zwrócony do poprawek. Podano następujący powód:\n\n{}"


def notify_thesis_accepted(thesis: Thesis):
    formatted_body = ACCEPTED_BODY.format(thesis.title)
    def send_success_to(email: str):
        send_mail(ACCEPTED_SUBJECT, formatted_body, settings.MASS_MAIL_FROM, [email])
    if thesis.advisor:
        send_success_to(thesis.advisor.user.email)
    if thesis.auxiliary_advisor:
        send_success_to(thesis.auxiliary_advisor.user.email)



    