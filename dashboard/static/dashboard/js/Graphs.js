
function barChartPlotter(e) {
    var ctx = e.drawingContext;
    var points = e.points;
    var y_bottom = e.dygraph.toDomYCoord(0);

    ctx.fillStyle = e.color;

    // Find the minimum separation between x-values.
    // This determines the bar width.
    var min_sep = Infinity;
    for (var i = 1; i < points.length; i++) {
        var sep = points[i].canvasx - points[i - 1].canvasx;
        if (sep < min_sep) min_sep = sep;
    }
    var bar_width = Math.floor(2.0 / 3 * min_sep);

    // Do the actual plotting.
    for (var i = 0; i < points.length; i++) {
        var p = points[i];
        var center_x = p.canvasx;

        ctx.fillRect(center_x - bar_width / 2, p.canvasy,
            bar_width, y_bottom - p.canvasy);

        ctx.strokeRect(center_x - bar_width / 2, p.canvasy,
            bar_width, y_bottom - p.canvasy);
    }
}

function get_data_from_influx(database,measurement,select_from_string,avrgInterval,timeInterval,labels){
    /*
    gets measurement data from the influxdb  
    send ajax request that will get handled by the view "query_data"
    */
    return $.ajax({
        type: 'POST',
        data: { 
                'query_dict': JSON.stringify({  'database':database,
                                                'measurement':measurement,
                                                'select_from_string':select_from_string,
                                                'avrgInterval':avrgInterval,
                                                'timeInterval':timeInterval,
                                                'labels':labels
                                            })
              },
        url: '/dashboard/query',
    })
}

function Graph(container_div,graph_id,datasource,optional_args) {

    var title = optional_args.title || "",
    xlabel = optional_args.xlabel || "Datum / Uhrzeit",
    ylabel = optional_args.ylabel || "",
    custom_colors = optional_args.custom_colors || false,
    value_factor = optional_args.value_factor || 1,
    precision = optional_args.precision || 5,
    stepPlot = optional_args.stepPlot || false,
    plotter = optional_args.plotter || false;



    this.container_div = container_div;
    this.dygraph = undefined;
	this.graph_id = graph_id;
    this.graphcolors = []; 
    this.custom_colors=custom_colors; 
	this.xlabel = xlabel;
	this.ylabel = ylabel;
    this.legend_labels = [this.xlabel];
    this.title=title;
	this.value_factor = value_factor;
	this.precision = precision;
    this.stepPlot=stepPlot;

    if (plotter){
        this.plotter = plotter;
    } else {
        var plotter = [];
        datasource.labels.forEach(function(){
            plotter.push(Dygraph.Plotters.linePlotter);
        })     
        this.plotter=plotter;         
    }
    

    this.datasource = datasource;

    this.interactions = Dygraph.defaultInteractionModel;

    this.interactions['mousedown'] = mousedownV1;
    this.interactions['mousemove'] = mousemoveV1;
    this.interactions['mouseup'] = mouseupV1;
    this.interactions['click'] = clickV1;
    this.interactions['dblclick'] = dblClickV1,
    
    this.valuelist = datasource.labels;
    this.datasource.values = this.valuelist[0];
    this.avrgIntervallist = this.datasource.avrgInterval;
    this.datasource.avrgInterval = this.avrgIntervallist[0];
    this.timeIntervallist = this.datasource.timeInterval;
    this.datasource.timeInterval=this.timeIntervallist[0];  

    
    this.make_container();
    this.plot();
    
}

Graph.prototype.colors_labels = function(){
    var standard_colors = ["#0000FF","#DC143C","#008000"];
    var self = this;
    this.graphcolors = [];  
    this.legend_labels = [this.xlabel];
    var current_values = this.datasource.values.split(",");
    current_values.forEach(function(value,i){          
        if (i > 3){
            self.graphcolors.push(getRandomColor());
        }
        else {
            self.graphcolors.push(standard_colors[i]);
        }
        self.legend_labels.push(value);   
    });
    if (this.custom_colors){
        self.graphcolors=self.custom_colors;
    }
    
}


Graph.prototype.crosshair = function(){
    var self = this;
    self.lines = [];
    for (var i = 0; i < self.graphcolors.length; i++) {
        var line = document.createElement("div");
        line.className = "crosshair yline";
        document.getElementById("dygraph"+self.graph_id).appendChild(line);
        self.lines.push(line);
    }
    var xline = document.createElement("div");
    xline.className = "crosshair xline";
    xline.style.top = "0px";
    document.getElementById("dygraph"+self.graph_id).appendChild(xline);
    self.xline = xline;
    
}

Graph.prototype.plot = function(){
    /*
    draws the graph inside the the precreated containers
        1. add spinner (waiting symbol)
        2. fetch data asyncronously from influxDB
        3. create new Dygraph
    */

    var self = this;

    // add spinner container (waiting symbol)
    this.waiting();

    // get data
    get_data_from_influx( 
                self.datasource.database,
                self.datasource.measurement,
                self.datasource.select_from_string,
                self.datasource.avrgInterval,
                self.datasource.timeInterval,
                self.datasource.labels
    ).done(function(graphdata){ // when data is successfully fetched make plot
        // remove waiting symbol
        $("#graph_loader"+self.graph_id).empty();
 
        var xLabelHeight = 20,
        rightGap = 20,
        yaxislabelwidth = 70,
        gapx = 0,
        padding=12,
        gapy = 40;

        self.dygraph = new Dygraph(
          document.getElementById("dygraph"+self.graph_id),
          graphdata["data"],
          { 
            //title: graph.title,
            ylabel: self.ylabel,
            axes: {
                    x: {  drawGrid: true,
                          valueFormatter: function(d) { var date = new Date(d);return date.toLocaleDateString()+' '+date.toLocaleTimeString(); },
                          axisLabelFormatter: function(d, gran, opts) { return Dygraph.dateAxisLabelFormatter(new Date(d), gran, opts); },
                          ticker: Dygraph.dateTicker,//function(min, max, pixels, opts, dygraph, vals) { return Dygraph.getDateAxis(min, max, 12, opts, dygraph); },
                        },
                    y: {
                          valueFormatter: function(d) { return (d*self.value_factor).toPrecision(self.precision); },
                          axisLabelFormatter: function(d, gran, opts) { return (d*self.value_factor).toPrecision(self.precision); },
                          axisLabelWidth: yaxislabelwidth,
                          drawGrid: true,
                        },
            },
            highlightCallback: function(e, x, pts) {

                for (var i = 0; i < pts.length; i++) {
                    var x = pts[0].canvasx;
                    var y = pts[i].canvasy,
                    offsettop = document.getElementById("dygraph"+self.graph_id).offsetTop,
                    w = document.getElementById("dygraph"+self.graph_id).firstElementChild.firstElementChild.clientWidth,
                    h = document.getElementById("dygraph"+self.graph_id).firstElementChild.firstElementChild.clientHeight;
                    self.lines[i].style.top = y + offsettop + "px";
                    self.lines[i].style.left = yaxislabelwidth + gapx + padding + "px";
                    self.lines[i].style.width = x - yaxislabelwidth - padding/2 + "px";

                    if (i === 0) {

                        
                        self.xline.style.left = x + document.getElementById("dygraph"+self.graph_id).offsetLeft+ "px";
                        self.xline.style.height = h - xLabelHeight - gapy - 2*padding+ "px";
                        self.xline.style.top = offsettop + "px";
                        if (x) {
                            self.xline.style.visibility = "visible";
                        } else {
                            self.xline.style.visibility = "hidden";
                        }
                    }

                    if (y >= 0) {
                        self.lines[i].style.visibility = "visible";
                    } else {
                        self.lines[i].style.visibility = "hidden";
                    }
                }
                
            },
            unhighlightCallback: function(e) {
                for (var i = 0; i < self.graphcolors.length; i++) {
                    self.lines[i].style.visibility = "hidden";    
                }
                self.xline.style.visibility = "hidden";
            },
            xlabel: self.xlabel,
            xLabelHeight: xLabelHeight,
            drawPoints: false,
            showRoller: false,
            digitsAfterDecimal: 4,
            showLabelsOnHighlight: true,
            showRangeSelector: true,
            labels: self.legend_labels,
            colors: self.graphcolors,
            labelsDiv: "dygraph_legend_"+self.graph_id,
            labelsSeparateLines:false,//true,
            legend: 'always',
            rightGap: rightGap,
            interactionModel:self.interactions,
            stepPlot:self.stepPlot,
            plotter: self.plotter
            
          }
        );
        self.update();
        // add lines for crosshair overlay
        //self.crosshair();
    });   
}

Graph.prototype.unplot = function(){
    $("#dygraph"+this.graph_id).empty();
    // stop updating the closed graph
    clearInterval(this.IntervalID);
}


Graph.prototype.destroy = function(e){
    // get dygraph container of clicked close button (==> parent of parent) and remove everything inside
    $(e.currentTarget.parentElement.parentElement).html("").remove();
    // stop updating the closed graph
    clearInterval(this.IntervalID);
}

Graph.prototype.update = function(){
    /*
    update the given liveplot every ?X? seconds
    */
    var self = this;
    // Graphen dynamisch updaten
    this.IntervalID = setInterval(function() {
        if (document.hidden) {
        }
        else{
            get_data_from_influx( 
                self.datasource.database,
                self.datasource.measurement,
                self.datasource.select_from_string,
                self.datasource.avrgInterval,
                self.datasource.timeInterval,
                self.datasource.labels
            ).done(function(graphdata){
                self.dygraph.updateOptions( { 'file': graphdata['data'] } );
            });
        }
    }, 10000);  // alle 5 Sekunden
    
}

Graph.prototype.waiting = function(){
    /* adds a spinner container to the given graph (by graph_id)
    (Waiting symbol while data is fetched from influx)
    */
    jQuery('<div/>', {
        id: "graph_loader"+this.graph_id,
        class: 'loader',
    })
    .appendTo("#dygraph"+this.graph_id);
    jQuery('<div/>', {
        class: 'loader__figure',
    })
    .appendTo("#graph_loader"+this.graph_id);
    jQuery('<p/>', {
        class: 'loader__label',
    })
    .html("Hole Daten aus der DB").appendTo('#graph_loader'+this.graph_id);
}

Graph.prototype.make_container = function(){
    /*
    dynamically creates all containers needed in order to display a dygraph
    */

    // first set labels and colors of graph
    this.colors_labels();

    var self = this;
    // add container for this dygraph plot
    jQuery('<div/>', {
        id: "dygraph_container"+this.graph_id,
        class: 'dygraph_container',
        style: 'height:100%;',
    })
    .prependTo('#'+this.container_div);

    // add div for title of plot
    jQuery('<div/>', {
        id: "dygraph_titlediv"+this.graph_id,
        class: "title",
    })
    .appendTo('#dygraph_container'+this.graph_id);  
    jQuery('<span/>', {
        class: "dygraph_title",  
    })
    .text(self.title)
    .appendTo('#dygraph_titlediv'+this.graph_id);  
    
    
    /*    
    // add close symbol for this plot 
    jQuery('<span/>', {
        class: "dygraph_title", 
        style: "float: right;cursor: pointer;"
    })
    .html("&times")
    // when closed
    .on("click", function(e){
        self.destroy(e);        
    })
    .appendTo('#dygraph_titlediv'+this.graph_id); 
    */

    // add select box for choosing avrg interval
    jQuery('<select/>', {
        class: "alignright",
        id: 'select_box_avrgInterval'+this.graph_id,    
    })
    .on("change", function(e){
        // remove old plot
        self.unplot();
        // change which data to fetch from influx
        self.datasource.avrgInterval=e.currentTarget.value;
        self.value_factor=1;
        // adjust coloring of plot
        self.colors_labels();
        // make new plot
        self.plot();
    })
    .appendTo('#dygraph_titlediv'+this.graph_id);
        // add options for select input
        this.avrgIntervallist.forEach(function(val){
            jQuery('<option/>', {
                value: val,
            })
            .html(val)
            .appendTo('#select_box_avrgInterval'+self.graph_id);    
        });
        
    // add select box for choosing time interval
    jQuery('<select/>', {
        class: "alignright",
        id: 'select_box_timeInterval'+this.graph_id,    
    })
    .on("change", function(e){
        // remove old plot
        self.unplot();
        // change which data to fetch from influx
        self.datasource.timeInterval=e.currentTarget.value;
        self.value_factor=1;
        // adjust coloring of plot
        self.colors_labels();
        // make new plot
        self.plot();
    })
    .appendTo('#dygraph_titlediv'+this.graph_id);
        // add options for select input
        this.timeIntervallist.forEach(function(val){
            jQuery('<option/>', {
                value: val,
            })
            .html(val)
            .appendTo('#select_box_timeInterval'+self.graph_id);    
        });
        
    // add legend container 
    jQuery('<div/>', {
        id: "dygraph_legend_"+this.graph_id,
        class: 'dygraph_legend',
        style: "width:100%;height:30px;display:block;text-align:center;",
        }).appendTo('#dygraph_container'+this.graph_id);
    // add main container for plot
    jQuery('<div/>', {
        id: "dygraph"+this.graph_id,
        class: 'dygraph',
        style: "width:100%;height:80%",
    })
    .appendTo('#dygraph_container'+this.graph_id);

    // add space below graph
    jQuery('<div/>', {
        style: "width:100%; height:0px;",

    })
    .appendTo('#'+this.container_div);

}