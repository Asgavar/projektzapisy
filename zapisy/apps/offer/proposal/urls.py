from django.conf.urls.defaults import *

urlpatterns = patterns( 'apps.offer.proposal.views',
    url(r'^$', 'offer', name='offer-main'),
    url(r'^/teacher$', 'proposal', name='my-proposal'),
    url(r'^/teacher/(?P<slug>[\w\-_]+)$', 'proposal', name='my-proposal-show'),
    url( '^/add$', 'proposal_edit', name='proposal-form' ),
    url('^/(?P<slug>[\w\-_]+)/edit',                       'proposal_edit',                    name='proposal-edit'),
    url('^/(?P<slug>[\w\-_]+)',                       'offer',                    name='offer-page'),


)