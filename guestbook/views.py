from django.shortcuts import render
from django.urls import reverse
from django.http import HttpResponseRedirect
from django.views.generic.list import ListView
from django.contrib import messages
from django.contrib.auth.decorators import login_required

from .models import Entry
from .forms import EntryForm

from django.utils import timezone


class EntryListView(ListView):
    model = Entry

    def get_context_data(self, **kwargs):
        context = super(EntryListView, self).get_context_data(**kwargs)
        context['form'] = EntryForm()
        return context

@login_required
def post_entry(request):
	if request.method == 'POST':
		form=EntryForm(request.POST)
		if form.is_valid():
			entry_text=form.cleaned_data["text"]
			entry=Entry(user=request.user,text=entry_text)
			entry.submit_date=timezone.now()
			entry.save()
			messages.success(request, 'Dein Eintrag wurde gespeichert.')
			#redirect to previous page
			return HttpResponseRedirect(reverse("guestbook:entries-list"))
	
		else:
			#redirect to previous page
			messages.error(request, 'Bitte behebe den unten aufgeführten Fehler.')
			return HttpResponseRedirect(reverse("guestbook:entries-list"))
	else:	
		'''redirect to previous page'''
		messages.error(request, 'Incorrect Form Submission!')
		return HttpResponseRedirect(reverse("guestbook:entries-list"))




















