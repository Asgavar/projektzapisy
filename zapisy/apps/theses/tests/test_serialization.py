import random

from apps.users.models import BaseUser

from ..models import ThesisStatus
from .base import ThesesBaseTestCase
from .utils import random_definite_vote, exactly_one


class ThesesSerializationTestCase(ThesesBaseTestCase):
    """Basic tests to ensure thesis serialization works correctly"""
    def setUp(self):
        self.advisor = self.get_random_emp()
        self.thesis = self.make_thesis(advisor=self.advisor, status=ThesisStatus.BEING_EVALUATED)
        self.thesis.save()

    def get_serialized_thesis(self):
        return self.get_theses_with_data()[0]

    def test_basic_fields_serialized_correctly(self):
        self.login_as(self.get_random_student())
        thesis = self.get_serialized_thesis()
        self.assertEqual(thesis["title"], self.thesis.title)
        self.assertEqual(thesis["advisor"], self.advisor.pk)
        self.assertEqual(
            thesis["auxiliary_advisor"],
            self.thesis.auxiliary_advisor.pk if self.thesis.auxiliary_advisor else None
        )
        self.assertEqual(thesis["kind"], self.thesis.kind)
        self.assertEqual(thesis["status"], self.thesis.status)
        self.assertEqual(thesis["reserved"], self.thesis.reserved)
        self.assertEqual(thesis["description"], self.thesis.description)
        self.assertEqual(thesis["student"]["id"], self.thesis.student.pk)
        if self.thesis.student_2:
            self.assertEqual(thesis["student_2"]["id"], self.thesis.student_2.pk)
        else:
            self.assertIsNone(thesis["student_2"])

    def _get_thesis_with_votes(self, user: BaseUser):
        board_members = self.get_board_members(random.randint(2, 5))
        votes = tuple((member, random_definite_vote()) for member in board_members)
        self.thesis.process_new_votes(votes)
        self.login_as(user)
        thesis = self.get_serialized_thesis()
        return votes, thesis["votes"]

    def _test_vote_counts_for(self, user: BaseUser):
        votes, votes_dict = self._get_thesis_with_votes(user)
        self.assertEqual(votes_dict["accept_cnt"], self.thesis.get_approve_votes_cnt())
        self.assertEqual(votes_dict["reject_cnt"], self.thesis.get_reject_votes_cnt())
        self.assertEqual(votes_dict["accept_cnt"] + votes_dict["reject_cnt"], len(votes))
        # There should be no other keys in the votes dict
        self.assertEqual(len(set(votes_dict.keys())), 2)

    def test_vote_counts_for_student(self):
        self._test_vote_counts_for(self.get_random_student())

    def test_vote_counts_for_emp(self):
        self._test_vote_counts_for(self.get_random_emp())

    def _test_vote_details_for(self, user: BaseUser):
        votes, votes_dict = self._get_thesis_with_votes(user)
        self.assertEqual(len(set(votes_dict.keys())), len(votes))
        for voter_id, vote_value in votes_dict.items():
            self.assertTrue(
                exactly_one((m.pk == voter_id and v.value == vote_value for m, v in votes))
            )

    def test_vote_details_for_board_member(self):
        self._test_vote_details_for(self.get_random_board_member_not_admin())

    def test_vote_details_for_admin(self):
        self._test_vote_details_for(self.get_admin())
