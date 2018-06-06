from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.models import User

GUESTBOOK_ENTRY_MAX_LENGTH = getattr(settings,'GUESTBOOK_ENTRY_MAX_LENGTH', 3000)
class Entry(models.Model):
    class Meta:
        ordering = ['-submit_date']

    submit_date = models.DateTimeField(default=timezone.now)
    user = models.ForeignKey(User,on_delete=models.CASCADE)
    text = models.TextField(max_length=GUESTBOOK_ENTRY_MAX_LENGTH)
    
    def __unicode__(self):
        return("{} am {}:".format(self.user.username, self.submit_date))
    	
    def save(self, force_insert=False, force_update=False):
        if self.submit_date is None:
            self.submit_date = timezone.now()
        super(Entry, self).save(force_insert, force_update)
