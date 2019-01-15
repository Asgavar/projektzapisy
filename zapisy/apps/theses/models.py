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
    MASTERS = 0
    ENGINEERS = 1
    BACHELORS = 2
    BACHELORS_ENGINEERS = 3
    ISIM = 4


THESIS_KIND_CHOICES = (
    (ThesisKind.MASTERS.value, "mgr"),
    (ThesisKind.ENGINEERS.value, "inż"),
    (ThesisKind.BACHELORS.value, "lic"),
    (ThesisKind.BACHELORS_ENGINEERS.value, "lic+inż"),
    (ThesisKind.ISIM.value, "isim"),
)


class ThesisStatus(Enum):
    BEING_EVALUATED = 1
    RETURNED_FOR_CORRECTIONS = 2
    ACCEPTED = 3
    IN_PROGRESS = 4
    DEFENDED = 5
    DEFAULT = BEING_EVALUATED


THESIS_STATUS_CHOICES = (
    (ThesisStatus.BEING_EVALUATED.value, "poddana pod głosowanie"),
    (ThesisStatus.RETURNED_FOR_CORRECTIONS.value, "zwrócona do poprawek"),
    (ThesisStatus.ACCEPTED.value, "zaakceptowana"),
    (ThesisStatus.IN_PROGRESS.value, "w realizacji"),
    (ThesisStatus.DEFENDED.value, "obroniona"),
)


class ThesisVote(Enum):
    NONE = 1
    REJECTED = 2
    ACCEPTED = 3


THESIS_VOTE_CHOICES = (
    (ThesisVote.NONE.value, "brak głosu"),
    (ThesisVote.REJECTED.value, "odrzucona"),
    (ThesisVote.ACCEPTED.value, "zaakceptowana"),
)


VotesInfo = Tuple[Employee, ThesisVote]


"""If a thesis is in one of those statuses, a vote will not reject/accept it"""
STATUSES_UNCHANGEABLE_BY_VOTE = (ThesisStatus.IN_PROGRESS, ThesisStatus.DEFENDED)
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

    def process_new_votes(
        self, votes: VotesInfo, changing_user: Employee, should_update_status: True
    ):
        """Whenever one or more votes for a thesis change, this function
        should be called to process & save them

        Arguments:

        changing_user -- The user who's causing the change of votes;
        if they're not changing their own vote, thesis status will not be updated
        (based on the assumption that they're simply adjusting the votes of some
        other voters and don't actually want it to count)

        should_update_status -- Whether the status should be updated based on vote
        counts (only if the condition above holds)
        """
        had_vote_as_self = False
        for voter, vote in votes:
            try:
                if voter == changing_user:
                    had_vote_as_self = True
                existing_vote = self.votes.get(voter=voter)
                existing_vote.value = vote.value
                existing_vote.save()
            except ThesisVoteBinding.DoesNotExist:
                ThesisVoteBinding.objects.create(thesis=self, voter=voter, value=vote.value)
        if had_vote_as_self and should_update_status:
            self.check_for_vote_status_change()

    def check_for_vote_status_change(self):
        """If we have enough approving votes, accept this thesis - unless there's a rejecting
        vote, then we return it for corrections
        Don't change the status if it's in progress/defended
        """
        if ThesisStatus(self.status) in STATUSES_UNCHANGEABLE_BY_VOTE:
            return
        if self.get_reject_votes_cnt():
            self.status = ThesisStatus.RETURNED_FOR_CORRECTIONS.value
        elif self.get_approve_votes_cnt() >= get_num_required_votes():
            self.status = ThesisStatus.ACCEPTED.value
        self.save()

    def get_approve_votes_cnt(self):
        return self.votes.filter(value=ThesisVote.ACCEPTED.value).count()

    def get_reject_votes_cnt(self):
        return self.votes.filter(value=ThesisVote.REJECTED.value).count()

    def is_archived(self):
        return self.status == ThesisStatus.DEFENDED.value

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
    return qs.exclude(
        status__in=STATUS_VALUES_UNCHANGEABLE_BY_VOTE
    ).annotate(definite_votes=RawSQL(
        """
        select count(*) from theses_thesisvotebinding where
        thesis_id=theses_thesis.id and voter_id=%s and value<>%s
        """,
        (emp.pk, ThesisVote.NONE.value)
    )).filter(definite_votes=0)


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
