$(document).ready(function() {
    window.graphs=[];
    window.myIntervalIDs={};
    
    window.graphs.push(
        new Graph(
        'p_raw_dg',
        window.graphs.length,
        { 
            'database':'raw_data',
            'measurement':'"clear7d"."inverters"',
            'select_from_string':'SELECT MEAN("p_ac_1"),MEAN("p_ac_2"),MEAN("p_ac_1")+MEAN("p_ac_2") FROM "raw_data"."clear7d"."inverters"',
            'avrgInterval':["15m","10m","1m","15s","5s","1s"],
            'timeInterval':["today","thisweek","last24h","last2d","last3d","alltime"],
            'labels':['Inv1,Inv2,Gesamt']
        },
        {
          'title':'Momentanleistung mit hoher Zeitauflösung - 7 Tage lang verfügbar',
        }
        )
    );
    
    window.graphs.push(
        new Graph(
        'p_longterm_dg',
        window.graphs.length,
        { 
            'database':'longterm_data',
            'measurement':'"autogen"."inverters"',
            'select_from_string':'SELECT MEAN("p_ac_1_mean"),MEAN("p_ac_2_mean"),MEAN("p_ac_1_mean")+MEAN("p_ac_2_mean") FROM "longterm_data".."inverters"',
            'avrgInterval':["15m","30m","1h","1d"],
            'timeInterval':["thisweek","today","last24h","last2d","last3d","last7d","last14d","alltime"],
            'labels':['Inv1,Inv2,Gesamt']
        },
        {
            'title':'Momentanleistung mit reduzierter Zeitauflösung - Minimum sind 15 Minuten',

        }
        )
    );

    window.graphs.push(
        new Graph(
        'e_longterm_dg',
        window.graphs.length,
        { 
            'database':'longterm_data',
            'measurement':'"autogen"."inverters"',
            'select_from_string':'SELECT INTEGRAL("p_ac_1_mean",1h),INTEGRAL("p_ac_2_mean",1h),INTEGRAL("p_ac_1_mean",1h)+INTEGRAL("p_ac_2_mean",1h) FROM "longterm_data".."inverters"',
            'avrgInterval':["15m","30m","1h","1d"],
            'timeInterval':["thisweek","today","last24h","last2d","last3d","last7d","last14d","alltime"],
            'labels':['Inv1,Inv2,Gesamt']
        },
        {
            'title':'Erzeugte Energiemenge je Zeitinterval - Minimum sind 15 Minuten',
            'stepPlot':true,
        }
        )
    );

    window.graphs.push(
        new Graph(
        'e_dayly_1_dg',
        window.graphs.length,
        { 
            'database':'longterm_data',
            'measurement':'"autogen"."inverters"',
            'select_from_string':'SELECT INTEGRAL("p_ac_1_mean",1h) FROM "longterm_data".."inverters"',
            'avrgInterval':["1d"],
            'timeInterval':["thisweek","today","last24h","last2d","last3d","last7d","last14d","alltime"],
            'labels':['Inv1']
        },
        {
            'title':'Tagesertrag von Inverter 1',
            'plotter':[barChartPlotter],
        }
        )
    );

    window.graphs.push(
        new Graph(
        'e_dayly_2_dg',
        window.graphs.length,
        { 
            'database':'longterm_data',
            'measurement':'"autogen"."inverters"',
            'select_from_string':'SELECT INTEGRAL("p_ac_2_mean",1h) FROM "longterm_data".."inverters"',
            'avrgInterval':["1d"],
            'timeInterval':["thisweek","today","last24h","last2d","last3d","last7d","last14d","alltime"],
            'labels':['Inv2']
        },
        {
            'title':'Tagesertrag von Inverter 2',
            'custom_colors':["#DC143C"],
            'plotter':[barChartPlotter],
        }
        )
    );

    window.graphs.push(
        new Graph(
        'e_dayly_ges_dg',
        window.graphs.length,
        { 
            'database':'longterm_data',
            'measurement':'"autogen"."inverters"',
            'select_from_string':'SELECT INTEGRAL("p_ac_1_mean",1h)+INTEGRAL("p_ac_2_mean",1h) FROM "longterm_data".."inverters"',
            'avrgInterval':["1d"],
            'timeInterval':["thisweek","today","last24h","last2d","last3d","last7d","last14d","alltime"],
            'labels':['Gesamt']
        },
        {
            'title':'Gesamtertrag beider Inverter',
            'custom_colors':["#008000"],
            'plotter':[barChartPlotter],
        }
        )
    );
});
