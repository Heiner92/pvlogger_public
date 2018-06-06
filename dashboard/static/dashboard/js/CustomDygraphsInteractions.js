var lastClickedGraph = null;

function mousedownV1(event, g, context) {
	/*
	handles a click event on a dygraph canvas
	*/

	context.initializeMouseDown(event, g, context);
	if (event.altKey || event.shiftKey) {
	Dygraph.startPan(event, g, context);
	} else {
	Dygraph.startZoom(event, g, context);
	}
}

function mousemoveV1(event, g, context) {
	/*
	handles a mouse move event on a dygraph canvas
	*/

	if (context.isPanning) {
	Dygraph.movePan(event, g, context);
	// set updateOptions of graph to new axis ranges
	zoom(g, 0);
	} else if (context.isZooming) {
	Dygraph.moveZoom(event, g, context);
	}
}

function mouseupV1(event, g, context) {
	/*
	handles the end of a click event on a dygraph canvas
	*/

	if (context.isPanning) {
	Dygraph.endPan(event, g, context);
	context.isPanning = false;
	// set updateOptions of graph to new axis ranges
	zoom(g, 0);
	} else if (context.isZooming) {
	Dygraph.endZoom(event, g, context);
	context.isZooming=false;
	// set updateOptions of graph to new axis ranges
	zoom(g, 0);
	}
}

function clickV1(event, g, context) {
	/*
	handles a click event on a dygraph canvas
	*/
	lastClickedGraph = g;
	event.preventDefault();
	event.stopPropagation();
}

function dblClickV1(event, g, context) {
	/*
	handles a double click on a dygraph canvas
	restores the zoom and pan status of the graph to its initial values
	*/
	restorePositioning(g);
	// set updateOptions of graph to new axis ranges
	zoom(g, 0);
}

function scrollV1(event, g, context) {
	/*
	handles a wheel event on a dygraph canvas 
	zooms in and out and respects the current cursor position
	*/

	// percentage it should zoom 
	// e.g. -0.03 === 3% zoom out
	var percentage = event.deltaY/-30;

	// offset of the mouse event on the dygraph canvas
	event.offsetX = event.layerX;
	event.offsetY = event.layerY;

	// calculate to percentages from bottom left of dygraph canvas
	var percentages = offsetToPercentage(g, event.offsetX, event.offsetY);
	var xPct = percentages[0];
	var yPct = percentages[1];

	// zoom with calculated percentage to calculated point
	zoom(g, percentage, xPct, yPct);
	event.preventDefault();
	event.stopPropagation();
}



function offsetToPercentage(g, offsetX, offsetY) {
	/*
	Take the offset of a mouse event on the dygraph canvas and
	convert it to a pair of percentages from the bottom left. 
	(Not top left, bottom is where the lower value is.)
	*/

	// This is calculating the pixel offset of the leftmost date.
	var xOffset = g.toDomCoords(g.xAxisRange()[0], null)[0];
	var yar0 = g.yAxisRange(0);

	// This is calculating the pixel of the higest value. (Top pixel)
	var yOffset = g.toDomCoords(null, yar0[1])[1];

	// x y w and h are relative to the corner of the drawing area,
	// so that the upper corner of the drawing area is (0, 0).
	var x = offsetX - xOffset;
	var y = offsetY - yOffset;

	// This is computing the rightmost pixel, effectively defining the
	// width.
	var w = g.toDomCoords(g.xAxisRange()[1], null)[0] - xOffset;

	// This is computing the lowest pixel, effectively defining the height.
	var h = g.toDomCoords(null, yar0[0])[1] - yOffset;

	// Percentage from the left.
	var xPct = w == 0 ? 0 : (x / w);
	// Percentage from the top.
	var yPct = h == 0 ? 0 : (y / h);

	// The (1-) part below changes it from "% distance down from the top"
	// to "% distance up from the bottom".
	return [xPct, (1-yPct)];
}


 
function zoom(g, zoomInPercentage, xBias, yBias) {
	/*
	Adjusts [x, y] toward each other by zoomInPercentage%
	Split it so the left/bottom axis gets xBias/yBias of that change and
	tight/top gets (1-xBias)/(1-yBias) of that change.

	If a bias is missing it splits it down the middle.

	zoom(g,0) doesn't change any zoom levels but updates the updateOptions
	--> doesn't change zoom level on graph update
	*/

	xBias = xBias || 0.5;
	yBias = yBias || 0.5;
	function adjustAxis(axis, zoomInPercentage, bias) {
	var delta = axis[1] - axis[0];
	var increment = delta * zoomInPercentage;
	var foo = [increment * bias, increment * (1-bias)];
	return [ axis[0] + foo[0], axis[1] - foo[1] ];
	}
	var yAxes = g.yAxisRanges();
	var newYAxes = [];
	var minval = undefined,
	maxval = undefined;
	for (var i = 0; i < yAxes.length; i++) {

	newYAxes[i] = adjustAxis(yAxes[i], zoomInPercentage, yBias);
	if (minval == undefined || minval > newYAxes[i][0]){
	    minval = newYAxes[i][0]; 
	}
	if (maxval == undefined || maxval > newYAxes[i][1]){
	    maxval = newYAxes[i][1]; 
	}
	}

	var xAxis = g.xAxisRange();
	newXAxis = adjustAxis(xAxis, zoomInPercentage, xBias);


	g.updateOptions({
	dateWindow: newXAxis,
	valueRange: [minval,maxval]
	});
}

function restorePositioning(g) {
	/*
	resets the graph to its original zoom and pan status
	*/
	g.updateOptions({
		dateWindow: null,
		valueRange: null
	});
}
