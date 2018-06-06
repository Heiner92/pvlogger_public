from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
import datetime
import influxdb
import json
import pandas as pd

# Create your views here.
CLIENT = influxdb.InfluxDBClient('localhost','8086','root','root')

def parse_timeInterval(timeInterval, database, measurement):
    influxdb_time_format = '%Y-%m-%dT%H:%M:%SZ'
    if timeInterval == 'last24h':
        return 'time > now() - 24h'
    elif timeInterval == 'last2d':
        return 'time > now() - 48h'
    elif timeInterval == 'last3d':
        return 'time > now() - 72h'
    elif timeInterval == 'last7d':
        return 'time > now() - 168h'
    elif timeInterval == 'last14d':
        return 'time > now() - 336h'
    elif timeInterval == 'today':
        first_timestamp_today = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        start_of_today = first_timestamp_today.strftime(influxdb_time_format)
        return "time >= '"+start_of_today+"' and time < '"+start_of_today+"' + 24h" # explicit timestamp in influxdb queries have to be single-quoted
    elif timeInterval == 'thisweek':
        first_timestamp_today = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        first_timestamp_thisweek = first_timestamp_today - datetime.timedelta(days=first_timestamp_today.weekday())
        start_of_thisweek = first_timestamp_thisweek.strftime(influxdb_time_format)
        return "time >= '"+start_of_thisweek+"' and time < '"+start_of_thisweek+"' + 7d"
    elif timeInterval == 'alltime':
        CLIENT.switch_database(database)
        if database == 'longterm_data':
            result = CLIENT.query('SELECT FIRST("p_ac_1_mean") FROM ' + measurement, epoch='ms')
            first_ts = list(result.get_points())[0]['time']
            result = CLIENT.query('SELECT LAST("p_ac_1_mean") FROM '+measurement, epoch='ms')
            last_ts = list(result.get_points())[0]['time']
        elif database == 'raw_data':
            result = CLIENT.query('SELECT FIRST("p_ac_1") FROM ' + measurement, epoch='ms')
            first_ts = list(result.get_points())[0]['time']
            result = CLIENT.query('SELECT LAST("p_ac_1") FROM '+measurement, epoch='ms')
            last_ts = list(result.get_points())[0]['time']
        return "time >= "+str(first_ts)+"ms and time < "+str(last_ts)+"ms"
    elif isinstance(timeInterval, list) and len(timeInterval) == 2:
        return "time >= "+str(int(timeInterval[0]))+"ms and time < "+str(int(timeInterval[1]))+"ms"
    else:
        parsed_timeInterval = timeInterval
    return parsed_timeInterval

@login_required
def query(request):
    if request.method=="POST":
        query_dict = json.loads(request.POST.get('query_dict',{}))

        # Preprocess the request
        if 'database' not in query_dict or 'avrgInterval' not in query_dict or 'select_from_string' not in query_dict or 'timeInterval' not in query_dict or 'measurement' not in query_dict:
            return JsonResponse({'data':[], 'labels':[]})

        select_from_string = query_dict['select_from_string']
        where_string = 'WHERE '+parse_timeInterval(query_dict['timeInterval'], query_dict['database'], query_dict['measurement'])
        groupby_string = ' GROUP BY time('+query_dict['avrgInterval']+') FILL(linear)'
        query_string = ' '.join([select_from_string, where_string, groupby_string])
        try:
            CLIENT.switch_database(query_dict['database'])
            query_result = CLIENT.query(query_string, epoch='ms')  # ms plays nicely with Dygraphs
        except influxdb.exceptions.InfluxDBClientError:
            raise
        # Parse Result:
        try:
            data = query_result.raw['series'][0]['values']
        except:
            data = []

        labels = ['time']
        labels.extend(query_dict['labels'])

        return JsonResponse({'data':data, 'labels':labels})
@login_required
def index(request):
    return render(request,'graphs.html')
