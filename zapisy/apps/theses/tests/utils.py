import random
import sys
from typing import List, Any

from faker import Faker

from apps.users.models import Employee, Student
from apps.users.tests.factories import EmployeeFactory, StudentFactory
from ..models import ThesisKind, ThesisStatus, ThesisVote


fake = Faker()


def random_bool():
    return bool(random.getrandbits(1))


def random_title():
    """Return a unique random title"""
    return f'{fake.name()}_{random.randrange(sys.maxsize)}'


def random_advisor(emps):
    return random.choice(emps)


def random_kind():
    return random.choice(list(ThesisKind))


def random_status():
    return random.choice([status for status in ThesisStatus])


def random_current_status():
    """Return a random "current", i.e. not defended status"""
    return random.choice([status for status in ThesisStatus if status != ThesisStatus.DEFENDED])


def random_available_status():
    """Return a random status where the thesis will be considered "available"
    for students
    """
    return random.choice([
        ThesisStatus.ACCEPTED,
        ThesisStatus.BEING_EVALUATED,
        ThesisStatus.RETURNED_FOR_CORRECTIONS
    ])


def random_reserved():
    return random_bool()


def random_description():
    return fake.text()


def random_student(studs):
    return random.choice(studs)


def random_vote():
    return random.choice(list(ThesisVote))


def random_definite_vote():
    """Return a random thesis vote other than none"""
    return random.choice([
        ThesisVote.ACCEPTED,
        ThesisVote.REJECTED,
    ])


def make_employee_with_name(name: str) -> Employee:
    return EmployeeFactory(user__first_name=name, user__last_name="")


def make_student_with_name(name: str) -> Student:
    return StudentFactory(user__first_name=name, user__last_name="")


def exactly_one(l: List[Any]) -> bool:
    """Check that exactly one element in the list is truthy"""
    return sum(bool(e) for e in l) == 1
