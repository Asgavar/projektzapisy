from enum import Enum
from typing import Tuple

from django.db import models
from django.db.models.expressions import RawSQL

from apps.users.models import Employee, Student, BaseUser
from .validators import validate_num_required_votes
from .system_settings import get_num_required_votes
from .users import is_admin

MAX_THESIS_TITLE_LEN = 300


class ThesisKind(Enum):
    masters = 0
    engineers = 1
    bachelors = 2
    bachelors_engineers = 3
    isim = 4


THESIS_KIND_CHOICES = (
    (ThesisKind.masters.value, "mgr"),
    (ThesisKind.engineers.value, "inż"),
    (ThesisKind.bachelors.value, "lic"),
    (ThesisKind.bachelors_engineers.value, "lic+inż"),
    (ThesisKind.isim.value, "isim"),
)


class ThesisStatus(Enum):
    being_evaluated = 1
    returned_for_corrections = 2
    accepted = 3
    in_progress = 4
    defended = 5
    default = being_evaluated


THESIS_STATUS_CHOICES = (
    (ThesisStatus.being_evaluated.value, "poddana pod głosowanie"),
    (ThesisStatus.returned_for_corrections.value, "zwrócona do poprawek"),
    (ThesisStatus.accepted.value, "zaakceptowana"),
    (ThesisStatus.in_progress.value, "w realizacji"),
    (ThesisStatus.defended.value, "obroniona"),
)


class ThesisVote(Enum):
    none = 1
    rejected = 2
    accepted = 3


THESIS_VOTE_CHOICES = (
    (ThesisVote.none.value, "brak głosu"),
    (ThesisVote.rejected.value, "odrzucona"),
    (ThesisVote.accepted.value, "zaakceptowana"),
)


VotesInfo = Tuple[Employee, ThesisVote]


"""If a thesis is in one of those statuses, a vote will not reject/accept it"""
STATUSES_UNCHANGEABLE_BY_VOTE = (ThesisStatus.in_progress, ThesisStatus.defended)
STATUS_VALUES_UNCHANGEABLE_BY_VOTE = [s.value for s in STATUSES_UNCHANGEABLE_BY_VOTE]


class Thesis(models.Model):
    title = models.CharField(max_length=MAX_THESIS_TITLE_LEN, unique=True)
    advisor = models.ForeignKey(
        Employee, on_delete=models.PROTECT, blank=True, null=True, related_name="thesis_advisor",
    )
    auxiliary_advisor = models.ForeignKey(
        Employee, on_delete=models.PROTECT, blank=True,
        null=True, related_name="thesis_auxiliary_advisor",
    )
    kind = models.SmallIntegerField(choices=THESIS_KIND_CHOICES)
    status = models.SmallIntegerField(choices=THESIS_STATUS_CHOICES)
    reserved = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    student = models.ForeignKey(
        Student, on_delete=models.PROTECT, blank=True, null=True, related_name="thesis_student",
    )
    student_2 = models.ForeignKey(
        Student, on_delete=models.PROTECT, blank=True, null=True, related_name="thesis_student_2",
    )
    added_date = models.DateTimeField(auto_now_add=True)
    modified_date = models.DateTimeField(auto_now=True)

    def on_title_changed_by(self, user: BaseUser):
        if self.advisor == user and not is_admin(user):
            self.votes.all().delete()

    def process_new_votes(self, votes: VotesInfo):
        """Whenever one or more votes for a thesis change, this function
        should be called to process & save them
        """
        for voter, vote in votes:
            try:
                existing_vote = self.votes.get(voter=voter)
                existing_vote.value = vote.value
                existing_vote.save()
            except ThesisVoteBinding.DoesNotExist:
                ThesisVoteBinding.objects.create(thesis=self, voter=voter, value=vote.value)
        self.check_for_vote_status_change()

    def check_for_vote_status_change(self):
        """If we have enough approving votes, accept this thesis - unless there's a rejecting
        vote, then we return it for corrections
        Don't change the status if it's in progress/defended
        """
        if ThesisStatus(self.status) in STATUSES_UNCHANGEABLE_BY_VOTE:
            return
        if self.get_reject_votes_cnt():
            self.status = ThesisStatus.returned_for_corrections.value
        elif self.get_approve_votes_cnt() >= get_num_required_votes():
            self.status = ThesisStatus.accepted.value
        self.save()

    def get_approve_votes_cnt(self):
        return self.votes.filter(value=ThesisVote.accepted.value).count()

    def get_reject_votes_cnt(self):
        return self.votes.filter(value=ThesisVote.rejected.value).count()

    def is_archived(self):
        return self.status == ThesisStatus.defended.value

    def __str__(self) -> str:
        return self.title

    def clean(self):
        """Ensure that the title never contains superfluous whitespace"""
        self.title = self.title.strip()

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "praca dyplomowa"
        verbose_name_plural = "prace dyplomowe"


def vote_to_string(vote_value: int) -> str:
    for value, vote_string in THESIS_VOTE_CHOICES:
        if value == vote_value:
            return vote_string
    return ""


class ThesisVoteBinding(models.Model):
    thesis = models.ForeignKey(Thesis, on_delete=models.CASCADE, related_name="votes")
    # should be a member of the theses board group
    voter = models.ForeignKey(Employee, on_delete=models.PROTECT, related_name="thesis_votes")
    value = models.SmallIntegerField(choices=THESIS_VOTE_CHOICES)

    def __str__(self) -> str:
        return f'Głos {self.voter} na {self.thesis} - {vote_to_string(self.value)}'


def filter_ungraded_for_emp(qs, emp: Employee):
    """
    Filter the given queryset to only contain
    all _ungraded_ theses for a given board member.
    A thesis is _ungraded_ if the voter has not cast a vote at all
    or manually set it to none (not possible from the client UI currently)
    """
    # Uses custom SQL - I couldn't get querysets to do what I wanted them to;
    # doing .exclude(votes__value__ne=none, votes__voter=emp) doesn't do what you want,
    # it ands two selects together rather than and two conditions in one select
    return qs \
        .exclude(status__in=STATUS_VALUES_UNCHANGEABLE_BY_VOTE) \
        .annotate(definite_votes=RawSQL(
            """
            select count(*) from theses_thesisvotebinding where
            thesis_id=theses_thesis.id and voter_id=%s and value<>%s
            """,
            (emp.pk, ThesisVote.none.value)
        )) \
        .filter(definite_votes=0)


def get_num_ungraded_for_emp(emp: Employee) -> int:
    """Get the number of ungraded theses for the given employee"""
    ungraded_qs = filter_ungraded_for_emp(Thesis.objects, emp)
    return ungraded_qs.count()


class ThesesSystemSettings(models.Model):
    num_required_votes = models.SmallIntegerField(
        verbose_name="Liczba głosów wymaganych do zaakceptowania",
        validators=[validate_num_required_votes]
    )

    def __str__(self):
        return "Ustawienia systemu"

    class Meta:
        verbose_name = "ustawienia systemu prac dyplomowych"
        verbose_name_plural = "ustawienia systemu prac dyplomowych"
