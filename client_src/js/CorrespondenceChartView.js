(function(exports){

// Node.js: Load required libraries
if ( typeof require !== 'undefined' ) {
	Backbone = require('backbone');
}

var CorrespondenceChartView = Backbone.View.extend();

CorrespondenceChartView.prototype.LEFT_PADDING = 180;
CorrespondenceChartView.prototype.TOP_PADDING = 120;
CorrespondenceChartView.prototype.RIGHT_PADDING = 120;
CorrespondenceChartView.prototype.BOTTOM_PADDING = 120;
CorrespondenceChartView.prototype.MIN_PADDING = 10;

CorrespondenceChartView.prototype.CELL_SIZE_PX = 18;
CorrespondenceChartView.prototype.CELL_MAX_RADIUS_PX = 10;

CorrespondenceChartView.prototype.LABEL_FONT = "Verdana";
CorrespondenceChartView.prototype.LABEL_HEIGHT_PT = 7;
CorrespondenceChartView.prototype.LABEL_COLOR = "#999";

CorrespondenceChartView.prototype.HISTOGRAM_BLUE = 0;
CorrespondenceChartView.prototype.HISTOGRAM_ORANGE = 1;
CorrespondenceChartView.prototype.HISTOGRAM_WIDTH = 12;
CorrespondenceChartView.prototype.HISTOGRAM_MIN_LENGTH = 15;
CorrespondenceChartView.prototype.HISTOGRAM_MAX_LENGTH = 95;
CorrespondenceChartView.prototype.HISTOGRAM_COLORS = {};
CorrespondenceChartView.prototype.HISTOGRAM_COLORS[ CorrespondenceChartView.prototype.HISTOGRAM_BLUE] = [ "#1f77b4", "#aec7e8", "#ccc" ];
CorrespondenceChartView.prototype.HISTOGRAM_COLORS[ CorrespondenceChartView.prototype.HISTOGRAM_ORANGE ] = [ "#ff7f0e", "#ffbb78", "#ccc" ];
CorrespondenceChartView.prototype.RED = "#d62728";

CorrespondenceChartView.prototype.GRIDLINE_COLOR = "#bbb";

CorrespondenceChartView.prototype.ANIMATION_DURATION = 500;

CorrespondenceChartView.prototype.initialize = function()
{
	this.trigger( "initializing" );
	this.__showChartLayer = true;
	this.__showLeftLayer = true;
	this.__showTopLayer = true;
	this.__showRightLayer = true;
	this.__showBottomLayer = true;
	this.__initHtmlElements();
	this.__initSvgElements();
	
	this.render = _.debounce( this.__renderImmediately, 25 );
	this.listenTo( this.model, "change", this.render );
	this.trigger( "initialized" );
};
CorrespondenceChartView.prototype.__renderImmediately = function()
{
	this.trigger( "rendering" );
	this.__updateSvgElements();
	this.trigger( "rendered" );
};

CorrespondenceChartView.prototype.__initHtmlElements = function()
{
	// Locate parent HTML element
	this.__containerElement = d3.select( this.el )
		.style( "display", "inline-block" )
};

CorrespondenceChartView.prototype.__initSvgElements = function()
{
	this.__updateSvgCommonVariables();
	
	this.__initAllLayers();
	this.__updateAllLayers();
	
	this.__updateChartBackgroundLayer();
	this.__updateChartContentLayer();
	this.__updateChartForegroundLayer();
	this.__updateLeftLayer();
	this.__updateTopLayer();
	this.__updateRightLayer();
	this.__updateBottomLayer();
};

CorrespondenceChartView.prototype.__updateSvgElements = function()
{
	this.__updateSvgCommonVariables();
	
	this.__updateAllLayers();
	
	this.__updateChartBackgroundLayer();
	this.__updateChartContentLayer();
	this.__updateChartForegroundLayer();
	this.__updateLeftLayer();
	this.__updateTopLayer();
	this.__updateRightLayer();
	this.__updateBottomLayer();
};

CorrespondenceChartView.prototype.__updateSvgCommonVariables = function()
{
	var rowDims = this.model.get( "rowDims" );
	var columnDims = this.model.get( "columnDims" );
	this.chartWidth = this.CELL_SIZE_PX * columnDims;
	this.chartHeight = this.CELL_SIZE_PX * rowDims;
	
	this.centerWidth = this.__showChartLayer ? this.chartWidth : 0;
	this.centerHeight = this.__showChartLayer ? this.chartHeight : 0;  
	this.leftWidth = this.__showLeftLayer ? this.LEFT_PADDING : this.MIN_PADDING;
	this.leftHeight = this.__showLeftLayer ? this.chartHeight : 0;
	this.topWidth = this.__showTopLayer ? this.chartWidth : 0;
	this.topHeight = this.__showTopLayer ? this.TOP_PADDING : this.MIN_PADDING;
	this.rightWidth = this.__showRightLayer ? this.RIGHT_PADDING : this.MIN_PADDING;
	this.rightHeight = this.__showRightLayer ? this.chartHeight : 0;
	this.bottomWidth = this.__showBottomLayer ? this.chartWidth : 0;
	this.bottomHeight = this.__showBottomLayer ? this.BOTTOM_PADDING : this.MIN_PADDING;
	this.svgWidth = this.leftWidth + _.max( [ this.topWidth, this.centerWidth, this.bottomWidth ] ) + this.rightWidth;
	this.svgHeight = this.topHeight + _.max( [ this.leftHeight, this.centerHeight, this.rightHeight ] ) + this.bottomHeight;
	
	this.__xChart = d3.scale.linear().domain( [ 0, columnDims ] ).range( [ 0, this.chartWidth ] );
	this.__yChart = d3.scale.linear().domain( [ 0, rowDims ] ).range( [ 0, this.chartHeight ] );
	this.__rChart = d3.scale.sqrt().domain( [ 0, 1.0 ] ).range( [ 0, this.CELL_MAX_RADIUS_PX ] );

	this.__lStats = d3.scale.linear().domain( [ 0, 1.0 ] ).range( [ this.HISTOGRAM_MIN_LENGTH, this.HISTOGRAM_MAX_LENGTH ] );
};
CorrespondenceChartView.prototype.__initAllLayers = function()
{
	this.__containerElement
		.style( "width", this.svgWidth + "px" )
		.style( "height", this.svgHeight + "px" )
		.style( "user-select", "none" )
		.style( "-moz-user-select", "none" )
		.style( "-webkit-user-select", "none" )
		.style( "-ms-user-select", "none" );
		
	this.__svg = this.__containerElement.append( "svg:svg" )
		.style( "width", this.svgWidth + "px" )
		.style( "height", this.svgHeight + "px" );

	this.__backgroundLayer = this.__svg.append( "svg:g" ).attr( "class", "backgroundLayer" )
		.attr( "transform", "translate(" + this.leftWidth + "," + this.topHeight + ")" )
		.attr( "width", this.centerWidth )
		.attr( "height", this.centerHeight );
	this.__contentLayer = this.__svg.append( "svg:g" ).attr( "class", "contentLayer" )
		.attr( "transform", "translate(" + this.leftWidth + "," + this.topHeight + ")" )
		.attr( "width", this.centerWidth )
		.attr( "height", this.centerHeight );
	this.__foregroundLayer = this.__svg.append( "svg:g" ).attr( "class", "foregroundLayer" )
		.attr( "transform", "translate(" + this.leftWidth + "," + this.topHeight + ")" )
		.attr( "width", this.centerWidth )
		.attr( "height", this.centerHeight );

	this.__leftLayer = this.__svg.append( "svg:g" ).attr( "class", "leftLayer" )
		.attr( "transform", "translate(0," + this.topHeight + ")" )
		.attr( "width", this.leftWidth )
		.attr( "height", this.leftHeight );
	this.__topLayer = this.__svg.append( "svg:g" ).attr( "class", "topLayer" )
		.attr( "transform", "translate(" + this.leftWidth + ",0)" )
		.attr( "width", this.topWidth )
		.attr( "height", this.topHeight );
	this.__rightLayer = this.__svg.append( "svg:g" ).attr( "class", "rightLayer" )
		.attr( "transform", "translate(" + ( this.leftWidth + _.max( [ this.topWidth, this.centerWidth, this.bottomWidth ] ) ) + "," + this.topHeight + ")" )
		.attr( "width", this.rightWidth )
		.attr( "height", this.rightHeight );
	this.__bottomLayer = this.__svg.append( "svg:g" ).attr( "class", "bottomLayer" )
		.attr( "transform", "translate(" + this.leftWidth + "," + ( this.topHeight + _.max( [ this.leftHeight, this.centerHeight, this.rightHeight ] ) ) + ")" )
		.attr( "width", this.bottomWidth )
		.attr( "height", this.bottomHeight );
};
CorrespondenceChartView.prototype.__updateAllLayers = function()
{
	this.__svg
		.transition().duration( this.ANIMATION_DURATION )
			.style( "width", this.svgWidth + "px" )
			.style( "height", this.svgHeight + "px" );

	this.__backgroundLayer
		.attr( "visibility", this.__showChartLayer ? "visible" : "hidden" )
		.transition().duration( this.ANIMATION_DURATION )
			.attr( "transform", "translate(" + this.leftWidth + "," + this.topHeight + ")" )
			.attr( "width", this.centerWidth )
			.attr( "height", this.centerHeight );
	this.__contentLayer
		.attr( "visibility", this.__showChartLayer ? "visible" : "hidden" )
		.transition().duration( this.ANIMATION_DURATION )
			.attr( "transform", "translate(" + this.leftWidth + "," + this.topHeight + ")" )
			.attr( "width", this.centerWidth )
			.attr( "height", this.centerHeight );
	this.__foregroundLayer
		.attr( "visibility", this.__showChartLayer ? "visible" : "hidden" )
		.transition().duration( this.ANIMATION_DURATION )
			.attr( "transform", "translate(" + this.leftWidth + "," + this.topHeight + ")" )
			.attr( "width", this.centerWidth )
			.attr( "height", this.centerHeight );

	this.__leftLayer
		.attr( "visibility", this.__showLeftLayer ? "visible" : "hidden" )
		.transition().duration( this.ANIMATION_DURATION )
			.attr( "transform", "translate(0," + this.topHeight + ")" )
			.attr( "width", this.leftWidth )
			.attr( "height", this.leftHeight );
	this.__topLayer
		.attr( "visibility", this.__showTopLayer ? "visible" : "hidden" )
		.transition().duration( this.ANIMATION_DURATION )
			.attr( "transform", "translate(" + this.leftWidth + ",0)" )
			.attr( "width", this.topWidth )
			.attr( "height", this.topHeight );
	this.__rightLayer
		.attr( "visibility", this.__showRightLayer ? "visible" : "hidden" )
		.transition().duration( this.ANIMATION_DURATION )
			.attr( "transform", "translate(" + ( this.leftWidth + _.max( [ this.topWidth, this.centerWidth, this.bottomWidth ] ) ) + "," + this.topHeight + ")" )
			.attr( "width", this.rightWidth )
			.attr( "height", this.rightHeight );
	this.__bottomLayer
		.attr( "visibility", this.__showBottomLayer ? "visible" : "hidden" )
		.transition().duration( this.ANIMATION_DURATION )
			.attr( "transform", "translate(" + this.leftWidth + "," + ( this.topHeight + _.max( [ this.leftHeight, this.centerHeight, this.rightHeight ] ) ) + ")" )
			.attr( "width", this.bottomWidth )
			.attr( "height", this.bottomHeight );
};

CorrespondenceChartView.prototype.__updateChartBackgroundLayer = function()
{
	var self = this;
	var rowDims = this.model.get( "rowDims" );
	var columnDims = this.model.get( "columnDims" );
	var horizontalTicks = _.range( rowDims + 1 );
	var verticalTicks = _.range( columnDims + 1 );
	
	this.__backgroundLayer
		.attr( "fill", "none" )
		.attr( "stroke", "#ccc" )
		.attr( "stroke-width", 0.25 )
	
	var horizontalGridlines = this.__backgroundLayer.append( "svg:g" ).selectAll( "line" ).data( horizontalTicks );
	var verticalGridlines = this.__backgroundLayer.append( "svg:g" ).selectAll( "line" ).data( verticalTicks );
	
	horizontalGridlines.exit().remove();
	horizontalGridlines.enter().append( "svg:line" )
		.attr( "y1", function(d) { return self.__yChart(d) } )
		.attr( "y2", function(d) { return self.__yChart(d) } )
	horizontalGridlines
		.attr( "x1", this.__xChart(0) )
		.attr( "x2", this.__xChart(columnDims) );
		
	verticalGridlines.exit().remove();
	verticalGridlines.enter().append( "svg:line" )
		.attr( "x1", function(d) { return self.__xChart(d) } )
		.attr( "x2", function(d) { return self.__xChart(d) } )
	verticalGridlines
		.attr( "y1", this.__yChart(0) )
		.attr( "y2", this.__yChart(rowDims) );
};

CorrespondenceChartView.prototype.__updateChartContentLayer = function()
{
	var self = this;
	var sparseMatrix = this.model.get( "sparseMatrix" );
	this.__contentLayer
		.attr( "stroke", this.RED )
		.attr( "stroke-width", 0.5 )
		.attr( "stroke-opacity", 0.8 )
		.attr( "fill", this.RED )
		.attr( "fill-opacity", 0.4 );
	
	var chartCells = this.__contentLayer.selectAll( "circle" ).data( sparseMatrix );	
	chartCells.exit().remove();
	chartCells.enter()
		.append( "svg:circle" )
			.attr( "cx", function(d) { return self.__xChart( d.columnPosition + 0.5 ) } )
			.attr( "cy", function(d) { return self.__yChart( d.rowPosition + 0.5 ) } )
			.attr( "r", function(d) { return self.__rChart( d.value ) } )
	chartCells
		.transition().duration( this.ANIMATION_DURATION )
			.attr( "cx", function(d) { return self.__xChart( d.columnPosition + 0.5 ) } )
			.attr( "cy", function(d) { return self.__yChart( d.rowPosition + 0.5 ) } )
			.attr( "r", function(d) { return self.__rChart( d.value ) } )
};

CorrespondenceChartView.prototype.__updateChartForegroundLayer = function()
{
	var self = this;
	var noiseEstimation = this.model.get( "noiseEstimation" );
	
	this.__foregroundLayer
		.attr( "stroke", "#8c564b" )
		.attr( "stroke-width", 1.0 )
		.attr( "stroke-opacity", 1.0 )
		.attr( "fill", "#8c564b" )
		.attr( "fill-opacity", 0.4 );

	if ( noiseEstimation === null )
	{
		this.__foregroundLayer.selectAll( "circle" ).remove();
	}
	else
	{
		return;
		
		var idealSparseMatrix = noiseEstimation.idealSparseMatrix;
		var chartCells = this.__foregroundLayer.selectAll( "circle" ).data( idealSparseMatrix );	
		chartCells.exit().remove();
		chartCells.enter()
			.append( "svg:circle" )
				.attr( "cx", function(d) { return self.__xChart( d.columnIndex + 0.5 ) } )
				.attr( "cy", function(d) { return self.__yChart( d.rowIndex + 0.5 ) } )
				.attr( "r", function(d) { return self.__rChart( d.value ) } )
		chartCells
			.transition().duration( this.ANIMATION_DURATION )
				.attr( "cx", function(d) { return self.__xChart( d.columnIndex + 0.5 ) } )
				.attr( "cy", function(d) { return self.__yChart( d.rowIndex + 0.5 ) } )
				.attr( "r", function(d) { return self.__rChart( d.value ) } )
	}
};

CorrespondenceChartView.prototype.__updateLeftLayer = function()
{
	var self = this;
	var rowLabels = this.model.get( "rowLabels" );
	this.__leftLayer
		.attr( "cursor", "default" )
		.attr( "font-family", this.LABEL_FONT )
		.attr( "font-size", this.LABEL_HEIGHT_PT + "pt" )
		.attr( "text-rendering", "optimizeLegibility" )
		.attr( "stroke-width", 0 )
		.attr( "fill", this.LABEL_COLOR );
	
	var leftLabels = this.__leftLayer.selectAll( "g" ).data( rowLabels );
	leftLabels.exit().remove();
	leftLabels.enter().append( "svg:g" )
		.attr( "transform", function(d) { return "translate(" + self.leftWidth + "," + self.__yChart( d.position + 0.5 ) + ")" } )
		.append( "svg:text" )
			.attr( "x", -10 )
			.attr( "y", 2 )
			.attr( "text-anchor", "end" )
			.text( function(d) { return d.label } );
	leftLabels
		.transition().duration( this.ANIMATION_DURATION )
		.attr( "transform", function(d) { return "translate(" + self.leftWidth + "," + self.__yChart( d.position + 0.5 ) + ")" } )
	leftLabels
		.select( "text" )
			.text( function(d) { return d.label } )
};

CorrespondenceChartView.prototype.__updateTopLayer = function()
{
	var self = this;
	var columnLabels = this.model.get( "columnLabels" );
	this.__topLayer
		.attr( "cursor", "default" )
		.attr( "font-family", this.LABEL_FONT )
		.attr( "font-size", this.LABEL_HEIGHT_PT + "pt" )
		.attr( "text-rendering", "optimizeLegibility" )
		.attr( "stroke-width", 0 )
		.attr( "fill", this.LABEL_COLOR );
	
	var topLabels = this.__topLayer.selectAll( "g" ).data( columnLabels );
	topLabels.exit().remove();
	topLabels.enter().append( "svg:g" )
		.attr( "transform", function(d) { return "translate(" + self.__xChart( d.position + 0.5 ) + "," + self.topHeight + ") rotate(-75)" } )
		.append( "svg:text" )
			.attr( "x", 10 )
			.attr( "y", 2 )
			.attr( "text-anchor", "start" )
			.text( function(d) { return d.label } );
	topLabels
		.transition().duration( this.ANIMATION_DURATION )
		.attr( "transform", function(d) { return "translate(" + self.__xChart( d.position + 0.5 ) + "," + self.topHeight + ") rotate(-75)" } );
	topLabels
		.select( "text" )
			.text( function(d) { return d.label } )
};

CorrespondenceChartView.prototype.__histogram = function( stats, scheme )
{
	var oneBar   = { 'index' : stats.index, 'ordering' : stats.ordering, 'position' : stats.position, 'color' : this.HISTOGRAM_COLORS[scheme][0] };
	var multiBar = { 'index' : stats.index, 'ordering' : stats.ordering, 'position' : stats.position, 'color' : this.HISTOGRAM_COLORS[scheme][1] };
	var zeroBar  = { 'index' : stats.index, 'ordering' : stats.ordering, 'position' : stats.position, 'color' : this.HISTOGRAM_COLORS[scheme][2] };
	
	oneBar.low = 0.0;
	oneBar.high = ( stats.matchProbs.length >= 2 ) ? stats.matchProbs[1] : 0.0;
	oneBar.high = Math.max( 0.0, Math.min( 1.0, oneBar.high ) );
	multiBar.low = oneBar.high;
	multiBar.high = ( stats.matchProbs.length >= 1 ) ? ( 1.0 - stats.matchProbs[0] ) : 0.0;
	multiBar.high = Math.max( 0.0, Math.min( 1.0, multiBar.high ) );
	zeroBar.low = multiBar.high;
	zeroBar.high = 1.0;

	return [ oneBar, multiBar, zeroBar ];
};

CorrespondenceChartView.prototype.__updateRightLayer = function()
{
	var self = this;
	var rowMatchProbs = this.model.get( "rowMatchProbs" );
	this.__rightLayer
		.attr( "stroke-width", this.HISTOGRAM_WIDTH );
	
	var rightHistograms = this.__rightLayer.selectAll( "g" ).data( rowMatchProbs );
	rightHistograms.exit().remove();
	rightHistograms.enter().append( "svg:g" )
		.attr( "transform", function(d) { return "translate(0," + self.__yChart( d.position + 0.5 ) + ")" } )
	rightHistograms
		.transition().duration( this.ANIMATION_DURATION )
		.attr( "transform", function(d) { return "translate(0," + self.__yChart( d.position + 0.5 ) + ")" } );
	rightHistograms = this.__rightLayer.selectAll( "g" );
	
	var rightHistogramBars = rightHistograms.selectAll( "line" ).data( function(d) { return self.__histogram( d, self.HISTOGRAM_BLUE ) } )
	rightHistogramBars
		.enter().append( "svg:line" )
			.attr( "stroke", function(d) { return d.color } )
			.attr( "x1", function(d) { return self.__lStats( d.low ) } )
			.attr( "x2", function(d) { return self.__lStats( d.high ) } )
			.attr( "y1", 0 )
			.attr( "y2", 0 );
	rightHistogramBars
		.transition().duration( this.ANIMATION_DURATION )
			.attr( "x1", function(d) { return self.__lStats( d.low ) } )
			.attr( "x2", function(d) { return self.__lStats( d.high ) } );
};

CorrespondenceChartView.prototype.__updateBottomLayer = function()
{
	var self = this;
	var columnMatchProbs = this.model.get( "columnMatchProbs" );
	this.__bottomLayer
		.attr( "stroke-width", this.HISTOGRAM_WIDTH );
	
	var bottomHistograms = this.__bottomLayer.selectAll( "g" ).data( columnMatchProbs );
	bottomHistograms.exit().remove();
	bottomHistograms.enter().append( "svg:g" )
		.attr( "transform", function(d) { return "translate(" + self.__xChart( d.position + 0.5 ) + ",0)" } )
	bottomHistograms
		.transition().duration( this.ANIMATION_DURATION )
		.attr( "transform", function(d) { return "translate(" + self.__xChart( d.position + 0.5 ) + ",0)" } );
	bottomHistograms = this.__bottomLayer.selectAll( "g" );
	
	var bottomHistogramBars = bottomHistograms.selectAll( "line" ).data( function(d) { return self.__histogram( d, self.HISTOGRAM_ORANGE ) } )
	bottomHistogramBars
		.enter().append( "svg:line" )
			.attr( "stroke", function(d) { return d.color } )
			.attr( "x1", 0 )
			.attr( "x2", 0 )
			.attr( "y1", function(d) { return self.__lStats( d.low ) } )
			.attr( "y2", function(d) { return self.__lStats( d.high ) } );
	bottomHistogramBars
		.transition().duration( this.ANIMATION_DURATION )
			.attr( "y1", function(d) { return self.__lStats( d.low ) } )
			.attr( "y2", function(d) { return self.__lStats( d.high ) } );
};

CorrespondenceChartView.prototype.__showAllLayers = function( show )
{
	this.__showChartLayer = show;
	this.__showLeftLayer = show;
	this.__showTopLayer = show;
	this.__showRightLayer = show;
	this.__showBottomLayer = show;
};
CorrespondenceChartView.prototype.showChartLayer = function( show, only )
{
	if ( only !== undefined && only ) { this.__showAllLayers( !show ) }
	this.__showChartLayer = show;
	this.render();
	return this;
};
CorrespondenceChartView.prototype.showLeftLayer = function( show, only )
{
	if ( only !== undefined && only ) { this.__showAllLayers( !show ) }
	this.__showLeftLayer = show;
	this.render();
	return this;
};
CorrespondenceChartView.prototype.showTopLayer = function( show, only )
{
	if ( only !== undefined && only ) { this.__showAllLayers( !show ) }
	this.__showTopLayer = show;
	this.render();
	return this;
};
CorrespondenceChartView.prototype.showRightLayer = function( show, only )
{
	if ( only !== undefined && only ) { this.__showAllLayers( !show ) }
	this.__showRightLayer = show;
	this.render();
	return this;
};
CorrespondenceChartView.prototype.showBottomLayer = function( show, only )
{
	if ( only !== undefined && only ) { this.__showAllLayers( !show ) }
	this.__showBottomLayer = show;
	this.render();
	return this;
};
CorrespondenceChartView.prototype.showAllLayers = function( show )
{
	this.__showAllLayers( show );
	this.render();
	return this;
};

// Export the object declaration
exports['CorrespondenceChartView'] = CorrespondenceChartView;

}) ( typeof exports === 'undefined' ? this : exports );
