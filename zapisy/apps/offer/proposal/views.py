# -*- coding: utf-8 -*-

"""
    Proposal views
"""
from django.contrib                 import messages
from django.contrib.auth.decorators import login_required, permission_required
from django.core.exceptions import ObjectDoesNotExist
from django.http                    import Http404
from django.shortcuts               import redirect
from django.template.response import TemplateResponse
from django.views.decorators.http   import require_POST
from apps.enrollment.courses.models.course import CourseEntity
from apps.enrollment.courses.models.course_type import Type

from apps.offer.proposal.forms import ProposalForm
from apps.offer.proposal.exceptions      import  NotOwnerException


import logging
from apps.offer.proposal.utils import proposal_for_offer, employee_proposal
from apps.users.decorators import employee_required
from apps.users.models import Employee

logger = logging.getLogger("")


def main(request):
    return TemplateResponse(request, 'offer/main.html', {} )

def offer(request, slug=None):
    """
    if slug is None, this view shows offer main page,
    else show proposal page
    """
    proposal   = proposal_for_offer(slug)
    proposals  = CourseEntity.get_proposals()
    types_list = Type.get_all_for_jsfilter()
    teachers   = Employee.get_actives()

    return TemplateResponse(request, 'offer/offer.html', locals())




@login_required
@employee_required
def proposal(request, slug=None):
    """
      List of user proposal
    """
    try:
        proposals = CourseEntity.get_employee_proposals(request.user)
        proposal  = employee_proposal(request.user, slug)
    except NotOwnerException:
        return redirect('offer-page', slug=slug)
    except Http404:
        raise Http404

    return TemplateResponse(request, 'offer/proposal/proposal.html', locals())


@login_required
@employee_required
def proposal_edit(request, slug=None):

    owner = None
    proposal = None
    proposals = CourseEntity.get_employee_proposals(request.user)

    if slug:
        try:
            proposal = CourseEntity.get_employee_proposal(request.user, slug)
            owner = proposal.owner
        except NotOwnerException:
            raise Http404
        except ObjectDoesNotExist:
            raise Http404

    if request.method == 'POST':
        form = ProposalForm(data=request.POST, instance=proposal)
        if form.is_valid():
            proposal = form.save(commit=False)
            if not owner:
                proposal.owner = request.user.employee
            proposal.save()
            messages.success(request, u'Propozycja zapisana')
            form.save_m2m()
            return redirect('my-proposal-show', slug=proposal.slug)
    else:
        form = ProposalForm(instance=proposal)
    return TemplateResponse(request, 'offer/proposal/form.html', locals())