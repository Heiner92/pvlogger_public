# InfluxDB installieren
#######################
wget https://dl.influxdata.com/influxdb/releases/influxdb_1.5.3_armhf.deb
sudo dpkg -i influxdb_1.5.3_armhf.deb
sudo systemctl enable influxdb
sudo systemctl start influxdb
sudo systemctl status influxdb
# sollte keine Fehler anzeigen


# berryconda installieren
#########################
wget https://github.com/jjhelmus/berryconda/releases/download/v2.0.0/Berryconda3-2.0.0-Linux-armv7l.sh
chmod +x Berryconda3-2.0.0-Linux-armv7l.sh
./Berryconda3-2.0.0-Linux-armv7l.sh

# zum ende der installation wird gefragt ob der pfad exportiert werden soll. hier ja angeben!

pip install Django==1.11.2 
pip install nginx 
pip install uwsgi
pip install pandas
pip install numpy
pip install django-widget-tweaks 
pip install python-django
pip install django-admin

pip install influxdb 
# falls das nicht klappen sollte:
/home/pi/berryconda3/bin/python -m pip install influxdb

# nginx einrichten
###########################
sudo apt-get update
sudo apt-get install nginx
# Den Ordner pvlogger (Hauptverzeichnis) nach /home/pi kopieren 
# Aus dem Ordner "deployment" die Datei "pvlogger" nach /etc/nginx/sites-available/ kopieren (erfordet sudo)
# Link erstellen
sudo ln -s /etc/nginx/sites-available/pvlogger /etc/nginx/sites-enabled/pvlogger

sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl status nginx

# uWSGI service einrichten
##########################

# Aus dem Ordner "deployment" die Datei "pvlogger.service" nach /etc/systemd/system/ kopieren (erfordert sudo)
sudo systemctl enable pvlogger
sudo systemctl start pvlogger
sudo systemctl status pvlogger
