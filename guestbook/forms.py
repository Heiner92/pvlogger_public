
from django import forms
from django.conf import settings
from django.contrib.auth.models import User

GUESTBOOK_ENTRY_MAX_LENGTH = getattr(settings,'GUESTBOOK_ENTRY_MAX_LENGTH', 3000)

class EntryForm(forms.Form):
    text = forms.CharField(label='Dein Gästebucheintrag:', widget=forms.Textarea,max_length=GUESTBOOK_ENTRY_MAX_LENGTH)  