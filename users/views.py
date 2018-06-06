from django.shortcuts import render, redirect
from django.urls import reverse
from django.contrib import auth
from django.contrib import messages
from .backends import EmailAuthBackend as email_auth
from django.contrib.auth.models import User
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect

# Create your views here.


def auth_view(request):
	username=request.POST['username']
	password=request.POST['password']
	user=email_auth.authenticate(request,username=username,password=password)
	#user = auth.authenticate(request,username=username,password=password,backend='django.contrib.auth.backends.ModelBackend')
	if user is not None:
		if user.is_active:
			auth.login(request,user)
			messages.success(request, "Willkommen {} - Du bist jetzt eingeloggt!".format(request.user.username))
			return render(request,"login_success.html",{})
		else:
			messages.error(request,"Hallo {} - Dein Account ist noch nicht freigeschalten! Dies muss vom Administrator durchgeführt werden, bevor du den PV Logger nutzen kannst!".format(user.username))
			return HttpResponseRedirect(reverse('users:login'))
	else:
		messages.error(request,"Ungültige Login Informationen! Bitte versuche es erneut".format(request.user.username))
		return HttpResponseRedirect(reverse('users:login'))

def login(request):
	username=request.user.username
	nexturl=request.GET.get("next",'')
	if username:
		messages.success(request, "Willkommen zurück {} - Du bist bereist eingeloggt!".format(request.user.username))
		return render(request,"login_success.html",{})
	else:
		context={}

	return render(request,"login.html",context)


def logout(request):
	if request.user.is_authenticated():
		auth.logout(request)
		messages.success(request, "Logout erfolgreich!")
		return render(request,"logout.html",{})
	else:
		messages.warning(request, "Du warst nicht eingeloggt!")
		return render(request,"logout.html",{})

def update_password(request):
	if request.method == 'POST':
		form = PasswordChangeForm(request.user, request.POST)
		if form.is_valid():
			user = form.save()
			update_session_auth_hash(request, user)  # Important!
			messages.success(request, 'Dein Passwort wurde abgeändert!')
			return redirect('users:login')
		else:
			messages.error(request, 'Bitte den unten aufgeführten Fehler beheben.')
	else:
		form = PasswordChangeForm(request.user)
	return render(request, 'changepw.html', {
		'change_pw_form': form
	})