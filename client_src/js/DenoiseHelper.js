(function(exports){

// Node.js: Load required libraries
if ( typeof require !== 'undefined' ) {
	DenoiseComputation = require('DenoiseComputation').DenoiseComputation;
}

var DenoiseHelper = function( options )
{
	this.EPS = 1e-8;

	// Use options to override EPS
	if ( options !== undefined )
		for ( var key in options )
			this[key] = options[key];
			
	this.__comp = new DenoiseComputation( options );
};

DenoiseHelper.prototype.compute = function( rowDims, columnDims, fullMatrix, noise )
{
	this.__rowDims = rowDims;
	this.__columnDims = columnDims;
	this.__fullMatrix = fullMatrix;
	this.__noise = noise;
	this.__computeRows();
	this.__computeColumns();
	return { 'rowHistograms' : this.rowHistograms, 'columnHistograms' : this.columnHistograms };
};

DenoiseHelper.prototype.__computeRows = function()
{
	this.rowHistograms = new Array( this.__rowDims );
	
	var noiseEntries = new Array( this.__columnDims );
	for ( var t = 0; t < this.__columnDims; t++ )
		noiseEntries[t] = { 'value' : this.__noise };
	var noiseHistogram = this.__histogram( noiseEntries );
	
	for ( var s = 0; s < this.__rowDims; s++ )
	{
		var observedEntries = this.__fullMatrix[s];
		var observedHistogram = this.__histogram( observedEntries );
		var denoisedHistogram = this.__comp.solve( observedHistogram, noiseHistogram );
		this.rowHistograms[s] = denoisedHistogram;
	}
};

DenoiseHelper.prototype.__computeColumns = function()
{
	this.columnHistograms = new Array( this.__columnDims );
	
	var noiseEntries = new Array( this.__rowDims );
	for ( var s = 0; s < this.__rowDims; s++ )
		noiseEntries[s] = { 'value' : this.__noise };
	var noiseHistogram = this.__histogram( noiseEntries );
	
	for ( var t = 0; t < this.__columnDims; t++ )
	{
		var observedEntries = new Array( this.__rowDims );
		for ( var s = 0; s < this.__rowDims; s++ )
			observedEntries[s] = this.__fullMatrix[s][t];
		var observedHistogram = this.__histogram( observedEntries );
		var denoisedHistogram = this.__comp.solve( observedHistogram, noiseHistogram );
		this.columnHistograms[t] = denoisedHistogram;
	}
};

/**
 * Given a series of binomial probabilities (as a sparse matrix),
 * generate a histogram of the expected distribution of matches.
 * @param{Array[Object]} entries An array of probability distributions.
 * @param{number} index Undefined when called externally; only defined when called internally via recursion.
 * @param{Array[Number]} histogram Undefiened when called externally; only defined when called internaly vis recursion.
 * @return Array[Number] A histogram of the expected number of matches.
 * @private
 **/
DenoiseHelper.prototype.__histogram = function( entries, index, histogram )
{
	// Initial recursive call.
	if ( index === undefined || histogram === undefined )
	{
		index = 0;
		histogram = [ 1.0 ];
	}
	
	// Check termination criteria.
	if ( index >= entries.length )
		return histogram;
	
	// Process one more Bernoulli event.
	var ap = entries[ index ].value;
	var bp = 1.0 - ap;
	var n = histogram.length;
	
	var nextHistogram = new Array( n+1 );
	nextHistogram[0] =              0 * ap + histogram[0] * bp;
	nextHistogram[n] = histogram[n-1] * ap +            0 * bp;
	for ( var i = 1; i < n; i++ )
		nextHistogram[i] = histogram[i-1] * ap + histogram[i] * bp;
	
	// Recurse.
	return this.__histogram( entries, index + 1, nextHistogram );
};



// Export the object declaration
exports['DenoiseHelper'] = DenoiseHelper;

}) ( typeof exports === 'undefined' ? this : exports );
