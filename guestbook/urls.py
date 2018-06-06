
from django.conf.urls import url,include
from . import views


urlpatterns = [
	url(r'^$', views.EntryListView.as_view(), name='entries-list'),
    #url(r'^$', views.last_page, name='guestbook-page-last'),
    #url(r'^page(?P<page>[0-9]+)/$', views.page , name='guestbook-page'),
    url(r'^post/', views.post_entry, name='entry-post'),
	]