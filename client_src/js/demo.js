var DemoDataLoader = Backbone.Model.extend({
	defaults : {
		"references" : [],
		"reference_labels" : {},
		"reference_topics" : {},
		"latents" : [],
		"latent_labels" : {},
		"latent_topics" : {}
	},
	url : "data/models.json"
});

DemoDataLoader.prototype.initialize = function() {
	this.view = new DemoDataView({ model : this });
};

DemoDataLoader.prototype.load = function() {
	this.fetch();
};

var DemoDataView = Backbone.View.extend({
	el : "div#PageControl"
});

DemoDataView.prototype.initialize = function() {
	this.views = {};
	this.views.container = d3.select( this.el );
	this.listenTo( this.model, "change", this.render );
};

DemoDataView.prototype.render = function() {
	var references = this.model.get( "references" );
	var referenceLabels = this.model.get( "reference_labels" );
	this.views.references = this.views.container.select( "select.ReferenceConcepts" )
		.on( "change", this.updateChart.bind(this) );
	var options = this.views.references.selectAll( "option" ).data( references );
	options.exit().remove();
	options.enter().append( "option" )
		.attr( "value", function(d) { return d } )
		.attr( "selected", function(d) { return d == "silverStandards" ? "selected" : null } )
		.html( function(d) { return referenceLabels[d] } );
		
	var latents = this.model.get( "latents" );
	var latentLabels = this.model.get( "latent_labels" );
	this.views.latents = this.views.container.select( "select.LatentTopics" )
		.on( "change", this.updateChart.bind(this) );
	var options = this.views.latents.selectAll( "option" ).data( latents );
	options.exit().remove();
	options.enter().append( "option" )
		.attr( "value", function(d) { return d } )
		.attr( "selected", function(d) { return d == "lda_25_0.01_0.01" ? "selected" : null } )
		.html( function(d) { return latentLabels[d] } );
	
	this.updateChart();
};

DemoDataView.prototype.updateChart = function() {
	var referenceValue = this.views.references[0][0].value;
	var latentValue = this.views.latents[0][0].value;
	
	this.views.container.select( "a.exploreReferences" ).attr( "href", "model/" + referenceValue );
	this.views.container.select( "a.exploreLatents" ).attr( "href", "model/" + latentValue );
	
	d3.select( 'div#Visualization' ).transition().style( "opacity", 0.25 );
	d3.text( "data/comparisons/" + referenceValue + "--" + latentValue + ".csv", "text/plain", this.__loadedPrecomputed.bind(this) );
};

DemoDataView.prototype.__loadedPrecomputed = function( content ) {
	var referenceValue = this.views.references[0][0].value;
	var latentValue = this.views.latents[0][0].value;
	var referenceTopics = this.model.get( "reference_topics" )[ referenceValue ];
	var latentTopics = this.model.get( "latent_topics" )[ latentValue ];
	var referenceDim = this.model.get( "reference_topics" )[ referenceValue ].length;
	var latentDim = this.model.get( "latent_topics" )[ latentValue ].length;
	var matrix = new Array( referenceDim );
	for ( var s = 0; s < referenceDim; s++ )
	{
		var row = new Array( latentDim );
		for ( var t = 0; t < latentDim; t++ )
			row[t] = 0.0;
		matrix[s] = row;
	}

	var allReferenceIDs = [];
	var lines = content.split( /[\n\r\f]+/g );
	for ( var n = 1; n < lines.length; n++ )
	{
		var line = lines[n];
		if ( line.length == 0 )
			continue;
		var fields = line.split( /,/g );
		var s = fields[0];
		allReferenceIDs.push( s );
	}
	allReferenceIDs = _.uniq( allReferenceIDs );
	if ( referenceValue == "silverStandards" )
		allReferenceIDs = allReferenceIDs.sort( function(a,b) { return parseInt(a) < parseInt(b) ? -1 : 1 } );
	else
		allReferenceIDs = allReferenceIDs.sort( function(a,b) { return a < b ? -1 : 1 } );
	var sLookup = {};
	for ( var i = 0; i < allReferenceIDs.length; i++ )
		sLookup[ allReferenceIDs[i] ] = i;

	var lines = content.split( /[\n\r\f]+/g );
	for ( var n = 1; n < lines.length; n++ )
	{
		var line = lines[n];
		if ( line.length == 0 )
			continue;
			
		var fields = line.split( /,/g );
		var s = sLookup[ fields[0] ];
		var t = parseInt( fields[1], 10 );
		var value = parseFloat( fields[2] );
		matrix[s][t] = value;
	}
	
	d3.select( 'div#Visualization' ).transition().delay( 300 ).style( "opacity", 1 );
	d3.select( 'div#Visualization' ).selectAll( "*" ).remove();
	var chartObject = new CorrespondenceChartObject()
		.importMatrix( matrix )
		.setLabels( referenceTopics, latentTopics );
	var chartView = new CorrespondenceChartView( { model : chartObject, el : 'div#Visualization' } );
	
	chartObject.once( "seriated", function() { setTimeout( function( referenceDim, latentDim, chartObject ) { computeDenoisedMatchProbs( referenceDim, latentDim, chartObject ) }, 600, referenceDim, latentDim, chartObject ) } );
	setTimeout( function() { chartObject.seriate() }, 300 );
	
	function computeDenoisedMatchProbs( rowDims, columnDims, chart )
	{
		var nfc = new NoiseFactorComputation();
		var noiseFactorResults = nfc.compute( rowDims, columnDims, chart.get( "entries" ) );
		var dh = new DenoiseHelper();
		var denoiseResults = dh.compute( rowDims, columnDims, chart.get( "fullMatrix" ), noiseFactorResults.noise );
		chart.setMatchProbs( denoiseResults.rowHistograms, denoiseResults.columnHistograms );
	}
};
