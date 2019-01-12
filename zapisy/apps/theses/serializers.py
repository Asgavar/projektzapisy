"""Defines all (de)serialization logic related
to objects used in the theses system, that is:
* packing/unpacking logic
* validation
* fine-grained permissions checks
* performing modifications/adding new objects
"""
from typing import Dict, Any, List, Optional

from rest_framework import serializers, exceptions
from django.core.exceptions import ObjectDoesNotExist, ImproperlyConfigured

from apps.users.models import Employee, Student, BaseUser
from .models import Thesis, ThesisStatus, ThesisVote, MAX_THESIS_TITLE_LEN, VotesInfo
from .users import wrap_user, get_user_type, is_theses_board_member
from .permissions import (
    can_set_status, can_set_advisor,
    can_cast_vote_as_user, can_change_status, can_change_title
)
from .drf_errors import ThesisNameConflict

GenericDict = Dict[str, Any]


class ThesesPersonSerializer(serializers.Serializer):
    """Used to serialize user profiles as needed by various parts of the system;
    we don't want to use the user serializer from apps.api.rest
    because it serializes a lot of unnecessary data
    """
    default_error_messages = serializers.PrimaryKeyRelatedField.default_error_messages

    def __init__(self, *args, **kwargs):
        self.queryset = kwargs.pop("queryset", None)
        super().__init__(*args, **kwargs)

    def to_representation(self, instance: BaseUser):
        result = {
            "id": instance.pk,
            "name": instance.get_full_name(),
        }
        if isinstance(instance, Employee):
            result["username"] = instance.user.username
        return result

    def to_internal_value(self, data):
        if not self.queryset:
            raise ImproperlyConfigured(
                "PersonSerializerForThesis cannot deserialize without a queryset provided"
            )
        try:
            return self.queryset.get(pk=data)
        except ObjectDoesNotExist:
            self.fail('does_not_exist', pk_value=data)
        except (TypeError, ValueError):
            self.fail('incorrect_type', data_type=type(data).__name__)

    def run_validators(self, value):
        """DRF 3.8.2 to 3.9.0 have a bug that prevents returning non-dict types
        from to_internal_value, see
        https://github.com/encode/django-rest-framework/issues/6053
        this is fixed in 3.9.1 but as of writing this that version is not yet
        available; this workaround should be removed when upgrading
        """
        super(serializers.Serializer, self).run_validators(value)


def serialize_thesis_votes(thesis: Thesis, is_staff: bool) -> Dict[int, int]:
    """Serializes the votes into a dict if the user has permission to see them,
    or just the accept/reject vote counts otherwise
    """
    if is_staff:
        return {
            vote.voter.pk: vote.value
            for vote in thesis.votes.all()
            if vote.value != ThesisVote.none.value
        }
    return {
        "accept_cnt": thesis.votes.filter(value=ThesisVote.accepted.value).count(),
        "reject_cnt": thesis.votes.filter(value=ThesisVote.rejected.value).count(),
    }


def convert_votes(votes) -> VotesInfo:
    """Validate & convert the votes dict for a thesis"""
    if not isinstance(votes, dict):
        raise serializers.ValidationError("\"votes\" must be a dict")
    result = []
    for key, value in votes.items():
        try:
            vote = ThesisVote(value)
        except ValueError:
            raise serializers.ValidationError(f'invalid thesis vote value {value}')
        try:
            voter_id = int(key)
            voter = Employee.objects.get(pk=voter_id)
        except (ValueError, Employee.DoesNotExist):
            raise serializers.ValidationError(f'bad voter id {key}')
        if not is_theses_board_member(voter):
            raise serializers.ValidationError(f'voter {voter} is not a member of the theses board')
        result.append((voter, vote))
    return result


def validate_new_title_for_instance(title: str, instance: Optional[Thesis]):
    """
    Validate that the supplied title is valid for the supplied instance,
    or for a new thesis if not supplied"""
    # I don't like this very much since there's a race condition here,
    # but it seems Django doesn't think you should worry about it;
    # they have very similar logic with their validate_unique method:
    # https://docs.djangoproject.com/en/2.1/ref/models/instances/#django.db.models.Model.validate_unique
    # (they first perform this validation, and later hit the DB with the update)
    # and SO seems to agree: https://stackoverflow.com/q/25702813
    qs = Thesis.objects.filter(title=title.strip())
    if instance:
        qs = qs.exclude(pk=instance.pk)
    if qs.count():
        raise ThesisNameConflict()


def check_votes_permissions(user: BaseUser, votes: List):
    """Check that the specified user is permitted to modify the votes as specified"""
    for voter, _ in votes:
        if not can_cast_vote_as_user(user, voter):
            raise exceptions.PermissionDenied(f'user {user} cannot change the vote of {voter}')


def check_advisor_permissions(user: BaseUser, advisor: Employee):
    """Check that the current user is permitted to set the specified advisor"""
    if not can_set_advisor(user, advisor):
        raise exceptions.PermissionDenied(f'This type of user cannot set advisor to {advisor}')


class ThesisSerializer(serializers.ModelSerializer):
    advisor = serializers.PrimaryKeyRelatedField(
        allow_null=True, required=False, queryset=Employee.objects.all()
    )
    auxiliary_advisor = serializers.PrimaryKeyRelatedField(
        allow_null=True, required=False, queryset=Employee.objects.all()
    )
    student = ThesesPersonSerializer(
        allow_null=True, required=False, queryset=Student.objects.all()
    )
    student_2 = ThesesPersonSerializer(
        allow_null=True, required=False, queryset=Student.objects.all()
    )
    added_date = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%S%z", required=False)
    modified_date = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%S%z", required=False)
    votes = serializers.SerializerMethodField()

    def to_internal_value(self, data):
        result = super().to_internal_value(data)
        if "votes" in data:
            result["votes"] = convert_votes(data["votes"])
        return result

    # We need to define this field here manually to disable DRF's unique validator which
    # isn't flexible enough to override the error code it returns (throws a 400, we want 409)
    # See https://stackoverflow.com/q/33475334
    # and https://github.com/encode/django-rest-framework/issues/6124
    # Instead of using DRF's validation we override field-level validation below
    # and manually check for uniqueness
    title = serializers.CharField(max_length=MAX_THESIS_TITLE_LEN)

    def validate_title(self, new_title: str):
        validate_new_title_for_instance(new_title, self.instance)
        return new_title

    def create(self, validated_data: GenericDict):
        """If the checks above succeed, DRF will call this method
        in response to a POST request with the dictionary we returned
        from validate_add_thesis
        """
        # First check that the user is permitted to set these values
        request = self.context["request"]
        user = wrap_user(request.user)
        check_advisor_permissions(user, validated_data["advisor"])
        status = validated_data["status"]
        if not can_set_status(user, ThesisStatus(status)):
            raise exceptions.PermissionDenied(f'This type of user cannot set status to {status}')
        if "votes" in validated_data:
            check_votes_permissions(user, validated_data["votes"])

        new_instance = Thesis.objects.create(
            title=validated_data.get("title"),
            kind=validated_data.get("kind"),
            status=validated_data.get("status"),
            reserved=validated_data.get("reserved"),
            description=validated_data.get("description"),
            advisor=validated_data.get("advisor"),
            auxiliary_advisor=validated_data.get("auxiliary_advisor"),
            student=validated_data.get("student"),
            student_2=validated_data.get("student_2"),
        )
        if "votes" in validated_data:
            new_instance.process_new_votes(validated_data["votes"])
        return new_instance

    def update(self, instance: Thesis, validated_data: GenericDict):
        """Called in response to a successfully validated PATCH request"""
        request = self.context["request"]
        user = wrap_user(request.user)
        if "advisor" in validated_data:
            check_advisor_permissions(user, validated_data["advisor"])
        if "status" in validated_data and not can_change_status(user):
            raise exceptions.PermissionDenied("This type of user cannot modify the status")
        if "title" in validated_data and not can_change_title(user, self.instance):
            raise exceptions.PermissionDenied("This type of user cannot change the title")
        if "votes" in validated_data:
            check_votes_permissions(user, validated_data["votes"])

        instance.title = validated_data.get("title", instance.title)
        instance.kind = validated_data.get("kind", instance.kind)
        instance.reserved = validated_data.get("reserved", instance.reserved)
        instance.description = validated_data.get("description", instance.description)
        instance.status = validated_data.get("status", instance.status)
        instance.advisor = validated_data.get("advisor", instance.advisor)
        instance.auxiliary_advisor = validated_data.get(
            "auxiliary_advisor", instance.auxiliary_advisor
        )
        instance.student = validated_data.get("student", instance.student)
        instance.student_2 = validated_data.get("student_2", instance.student_2)
        instance.save()
        if "votes" in validated_data:
            instance.process_new_votes(validated_data["votes"])
        return instance

    def get_votes(self, instance):
        if not self.context or "is_staff" not in self.context:
            # should not happen
            return {}
        return serialize_thesis_votes(instance, self.context["is_staff"])

    class Meta:
        model = Thesis
        read_only_fields = ("id",)
        fields = (
            "id", "title", "advisor", "auxiliary_advisor",
            "kind", "reserved", "description", "status",
            "student", "student_2", "added_date", "modified_date",
            "votes",
        )


class CurrentUserSerializer(serializers.ModelSerializer):
    """Serialize the currently logged in user; this also needs to send the user type,
    so it's a separate serializer"""
    def to_representation(self, instance: BaseUser):
        return {
            "person": ThesesPersonSerializer(instance).data,
            "type": get_user_type(instance).value
        }


class ThesesBoardMemberSerializer(serializers.ModelSerializer):
    def to_representation(self, instance: Employee):
        return instance.pk
