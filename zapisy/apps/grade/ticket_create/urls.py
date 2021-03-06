from django.conf.urls import url
from . import views

urlpatterns = [
    # feature do dodania w przyszłości
    url(r'^ajax_keys_progress$', views.ajax_keys_progress, name='grade-ticket-keys-progress'),
    url(r'^ajax_keys_generate$', views.ajax_keys_generate, name='grade-ticket-keys-generator'),
    url(r'^client_connection$', views.client_connection, name='grade-ticket-client-connection'),
    url(r'^ajax_tickets1$', views.ajax_get_rsa_keys_step1, name='grade-ticket-ajax-ticets1'),
    url(r'^ajax_tickets2$', views.ajax_get_rsa_keys_step2, name='grade-ticket-ajax-ticets2'),
    url(r'^keys_list$', views.keys_list, name='grade-ticket-keys-list'),
    url(r'^keys_generate$', views.keys_generate, name='grade-ticket-keys-generate'),

    # feature do poprawienia w przyszłości
    url(r'^connections_choice$', views.connections_choice, name='grade-ticket-connections-choice')
]
