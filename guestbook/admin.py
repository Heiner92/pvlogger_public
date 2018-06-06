from django.contrib import admin
from .models import Entry
# Register your models here.
class EntryAdmin(admin.ModelAdmin):
    list_display = ('user', 'submit_date',)
    search_fields=['user']
    ordering = ('-submit_date',)
    
admin.site.register(Entry, EntryAdmin)