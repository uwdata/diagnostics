(function(exports){

// Node.js: Load required libraries
if ( typeof require !== 'undefined' ) {
	Backbone = require('backbone');
}

// Matrix object:
//   rowDims = Number of rows
//   columnDims = Number of columns

//   [ 1 2 3 4 5 6 ] -> [ 4 2 1 6 5 3 ]
//     Ordering = [ 4 2 1 6 5 3 ]
//     Positions = [ 3 2 6 1 5 4 ]
//   rowOrdering = Mapping from input row index to output row ordering
//   columnOrdering = Mapping from input column index to output column ordering
//   rowPositions = Mapping from output row ordering to input row index
//   columnPositions = Mapping from output column ordering to input column index

//   rowLabels = Names assigned to the rows
//   columnLabels = Names assigned to the columns
//   rowMatchProbs = Number of expected matches per row
//   columnMatchProbs = Number of expected matches per column

//   entries = 1D representation of the matrix, including all cells
//   fullMatrix = 2D representation of the matrix, including all cells
//   sparseMatrix = 1D representation of the matrix, including only non-zero cells

// Change events:
//   dims, labels, ordering, matrix, match_probs

var CorrespondenceChartObject = Backbone.Model.extend({
	defaults: {
		"rowDims" : 0,
		"columnDims" : 0,

		"entries" : [],       // All entries in the matrix as an 1D array.
		"fullMatrix" : [],    // All entries in the matrix as a 2D array.
		"sparseMatrix" : [],  // Non-zero entries in the matrix as an 1D array.

		"rowOrdering" : [],
		"columnOrdering" : [],
		"rowPositions" : [],
		"columnPositions" : [],
		"rowLabels" : [],
		"columnLabels" : [],
		"rowMatchProbs" : [],
		"columnMatchProbs" : []
	},
	initialize : function() {
		this.__seriation = new SpectralSeriation();
		this.__triggerEvents = _.debounce( this.__triggerEventsImmediately, 25 );

		this.__setRowOrdering();
		this.__setColumnOrdering();
		this.__setRowLabels();
		this.__setColumnLabels();
		this.__setRowMatchProbs();
		this.__setColumnMatchProbs();

		this.__orderMatrixEntries();
		this.__orderRowLabels();
		this.__orderColumnLabels();
		this.__orderRowMatchProbs();
		this.__orderColumnMatchProbs();
		
		this.trigger( "initialized" );
	}
});

//--------------------------------------------------------------------------------------------------

/**
 * Set the ordering of rows and columns.
 * @param{number[]} rowOrdering Ordering of rows.
 * @param{number[]} columnOrdering Ordering of columns.
 * @return{CorrespondenceChartObject} Return this object to enable chaining.
 **/
CorrespondenceChartObject.prototype.setOrdering = function( rowOrdering, columnOrdering )
{
	this.__setRowOrdering( rowOrdering );
	this.__setColumnOrdering( columnOrdering );
	
	this.__orderMatrixEntries();
	this.__orderRowLabels();
	this.__orderColumnLabels();
	this.__orderRowMatchProbs();
	this.__orderColumnMatchProbs();
	
	this.__prepareEvents( "change change:ordering change:matrix change:labels change:match_probs" );
	this.__triggerEvents();
	return this;
};

CorrespondenceChartObject.prototype.__setRowOrdering = function( rowOrdering )
{
	var rowDims = this.get( "rowDims" );
	if ( rowOrdering === undefined || rowOrdering === null )
		rowOrdering = this.get( "rowOrdering" );
	
	// Sanitize input ordering
	var existingIndexes = {};
	rowOrdering = _.filter( rowOrdering, function(d) { 
		var index = parseInt( d, 10 );
		if ( index != d  ||  index < 0  ||  index >= rowDims )
			return false;
		if ( index in existingIndexes )
			return false;
		existingIndexes[ index ] = true;
		return true;
	});
	for ( var index = 0; index < rowDims; index++ )
		if ( ! ( index in existingIndexes ) )
			rowOrdering.push( index );
	
	// Generate reverse lookup by position
	var rowPositions = new Array( rowDims );
	for ( var s = 0; s < rowDims; s++ )
		rowPositions[ rowOrdering[s] ] = s;
	
	this.set( "rowOrdering", rowOrdering, { 'silent' : true } );
	this.set( "rowPositions", rowPositions, { 'silent' : true } );
};

CorrespondenceChartObject.prototype.__setColumnOrdering = function( columnOrdering )
{
	var columnDims = this.get( "columnDims" );
	if ( columnOrdering === undefined || columnOrdering === null )
		columnOrdering = this.get( "columnOrdering" );
	
	// Sanitize input ordering
	var existingIndexes = {};
	columnOrdering = _.filter( columnOrdering, function(d) { 
		var index = parseInt( d, 10 );
		if ( index != d  ||  index < 0  ||  index >= columnDims )
			return false;
		if ( index in existingIndexes )
			return false;
		existingIndexes[ index ] = true;
		return true;
	});
	for ( var index = 0; index < columnDims; index++ )
		if ( ! ( index in existingIndexes ) )
			columnOrdering.push( index );


	// Generate reverse lookup by position
	var columnPositions = new Array( columnDims );
	for ( var s = 0; s < columnDims; s++ )
		columnPositions[ columnOrdering[s] ] = s;
	
	this.set( "columnOrdering", columnOrdering, { 'silent' : true } );
	this.set( "columnPositions", columnPositions, { 'silent' : true } );
};

//--------------------------------------------------------------------------------------------------

/**
 * Set the labels for the rows and columns.
 * @param{String[]} rowLabels Labels for the rows.
 * @param{String[]} columnLabels Labels for the columns.
 * @return{CorrespondenceChartObject} Return this object to enable chaining.
 **/
CorrespondenceChartObject.prototype.setLabels = function( rowLabels, columnLabels )
{
	this.__setRowLabels( rowLabels );
	this.__setColumnLabels( columnLabels );
	
	this.__prepareEvents( "change change:labels" );
	this.__triggerEvents();
	return this;
};

CorrespondenceChartObject.prototype.__setRowLabels = function( labels )
{
	var rowDims = this.get( "rowDims" );
	var rowLabels = this.get( "rowLabels" );

	// Validate the number of labels.
	if ( rowLabels.length > rowDims )
		rowLabels = rowLabels.slice( 0, rowDims );
	if ( rowLabels.length < rowDims )
		for ( var s = rowLabels.length; s < rowDims; s++ )
			rowLabels.push( { 'index' : s, 'label' : "Row #" + (s+1) } );

	// Copy over new label texts, if available.
	if ( labels !== undefined  &&  labels !== null )
	{
		var sCount = Math.min( rowDims, labels.length );
		for ( var s = 0; s < sCount; s++ )
			rowLabels[s].label = labels[s];
	}
	
	this.set( "rowLabels", rowLabels, { 'silent' : true } );
};

CorrespondenceChartObject.prototype.__setColumnLabels = function( labels )
{
	var columnDims = this.get( "columnDims" );
	var columnLabels = this.get( "columnLabels" );
	
	// Validate the number of labels.
	if ( columnLabels.length > columnDims )
		columnLabels = columnLabels.slice( 0, columnDims );
	if ( columnLabels.length < columnDims )
		for ( t = columnLabels.length; t < columnDims; t++ )
			columnLabels.push( { 'index' : t, 'label' : "Column #" + (t+1) } );
	
	// Copy over new label texts, if available.
	if ( labels !== undefined  &&  labels !== null )
	{
		var tCount = Math.min( columnDims, labels.length );
		for ( var t = 0; t < tCount; t++ )
			columnLabels[t].label = labels[t];
	}
	
	this.set( "columnLabels", columnLabels, { 'silent' : true } );
};

CorrespondenceChartObject.prototype.__orderRowLabels = function()
{
	var rowDims = this.get( "rowDims" );
	var rowLabels = this.get( "rowLabels" );
	var rowOrdering = this.get( "rowOrdering" );
	var rowPositions = this.get( "rowPositions" );
	for ( var s = 0; s < rowDims; s++ )
	{
		rowLabels[s].ordering = rowOrdering[s];
		rowLabels[s].position = rowPositions[s];
	}
};

CorrespondenceChartObject.prototype.__orderColumnLabels = function()
{
	var columnDims = this.get( "columnDims" );
	var columnLabels = this.get( "columnLabels" );
	var columnOrdering = this.get( "columnOrdering" );
	var columnPositions = this.get( "columnPositions" );
	for ( var t = 0; t < columnDims; t++ )
	{
		columnLabels[t].ordering = columnOrdering[t];
		columnLabels[t].position = columnPositions[t];
	}
};

//--------------------------------------------------------------------------------------------------

/**
 * Set the matching probabilities for the rows and columns.
 * @param{number[][]} rowMatchProbs Matching probabilities for the rows.
 * @param{number[][]} columnMatchingProbs Matching probabilities for the columns.
 * @return{CorrespondenceChartObject} Return this object to enable chaining.
 **/
CorrespondenceChartObject.prototype.setMatchProbs = function( rowMatchProbs, columnMatchProbs )
{
	this.__setRowMatchProbs( rowMatchProbs );
	this.__setColumnMatchProbs( columnMatchProbs );

	this.__prepareEvents( "change change:match_probs" );
	this.__triggerEvents();
	return this;
};

CorrespondenceChartObject.prototype.__setRowMatchProbs = function( matchProbs )
{
	var rowDims = this.get( "rowDims" );
	var rowMatchProbs = this.get( "rowMatchProbs" );

	// Validate the number of matchProbs.
	if ( rowMatchProbs.length > rowDims )
		rowMatchProbs = rowMatchProbs.slice( 0, rowDims );
	if ( rowMatchProbs.length < rowDims )
		for ( var s = rowMatchProbs.length; s < rowDims; s++ )
			rowMatchProbs.push( { 'index' : s, 'matchProbs' : [ 1.0 ] } );

	// Copy over new matching likelihoods, if available.
	if ( matchProbs !== undefined  &&  matchProbs !== null )
	{
		var sCount = Math.min( rowDims, matchProbs.length );
		for ( var s = 0; s < sCount; s++ )
			rowMatchProbs[s].matchProbs = matchProbs[s];
	}
	
	this.set( "rowMatchProbs", rowMatchProbs, { 'silent' : true } );
};

CorrespondenceChartObject.prototype.__setColumnMatchProbs = function( matchProbs )
{
	var columnDims = this.get( "columnDims" );
	var columnMatchProbs = this.get( "columnMatchProbs" );
	
	// Validate the number of matchProbs.
	if ( columnMatchProbs.length > columnDims )
		columnMatchProbs = columnMatchProbs.slice( 0, columnDims );
	if ( columnMatchProbs.length < columnDims )
		for ( t = columnMatchProbs.length; t < columnDims; t++ )
			columnMatchProbs.push( { 'index' : t, 'matchProbs' : [ 1.0 ] } );
	
	// Copy over new label texts, if available.
	if ( matchProbs !== undefined  &&  matchProbs !== null )
	{
		var tCount = Math.min( columnDims, matchProbs.length );
		for ( var t = 0; t < tCount; t++ )
			columnMatchProbs[t].matchProbs = matchProbs[t];
	}
	
	this.set( "columnMatchProbs", columnMatchProbs, { 'silent' : true } );
};

CorrespondenceChartObject.prototype.__orderRowMatchProbs = function()
{
	var rowDims = this.get( "rowDims" );
	var rowMatchProbs = this.get( "rowMatchProbs" );
	var rowOrdering = this.get( "rowOrdering" );
	var rowPositions = this.get( "rowPositions" );
	for ( var s = 0; s < rowDims; s++ )
	{
		rowMatchProbs[s].ordering = rowOrdering[s];
		rowMatchProbs[s].position = rowPositions[s];
	}
};

CorrespondenceChartObject.prototype.__orderColumnMatchProbs = function()
{
	var columnDims = this.get( "columnDims" );
	var columnMatchProbs = this.get( "columnMatchProbs" );
	var columnOrdering = this.get( "columnOrdering" );
	var columnPositions = this.get( "columnPositions" );
	for ( var t = 0; t < columnDims; t++ )
	{
		columnMatchProbs[t].ordering = columnOrdering[t];
		columnMatchProbs[t].position = columnPositions[t];
	}
};

//--------------------------------------------------------------------------------------------------

/**
 * Read in an 1D array of matrix entries { rowIndex, columnIndex, value }
 * @private
 **/
CorrespondenceChartObject.prototype.importEntries = function( entries, rowDims, columnDims )
{
	// Infer matrix dimensions
	if ( rowDims === undefined )
		rowDims = _.max( entries.map( function(d) { return d.rowIndex } ) ) + 1;
	if ( columnDims === undefined )
		columnDims = _.max( entries.map( function(d) { return d.columnIndex } ) ) + 1;

	// Generate full matrix of the appropriate dimensions
	var fullMatrix = new Array( rowDims );
	for ( var s = 0; s < rowDims; s++ )
	{
		var fullRow = new Array( columnDims );
		for ( var t = 0; t < columnDims; t++ )
			fullRow[t] = { 'rowIndex' : s, 'columnIndex' : t, 'value' : 0.0 };
		fullMatrix[s] = fullRow;
	}

	// Copy matrix entries
	for ( var n = 0; n < entries.length; n++ )
	{
		var entry = entries[n];
		if ( entry.rowIndex < rowDims )
			if ( entry.columnIndex < columnDims )
				fullMatrix[ entry.rowIndex ][ entry.columnIndex ].value = entry.value;
	}

	this.__setMatrixEntries( rowDims, columnDims, fullMatrix );
	this.__prepareEvents( "change change:dims change:ordering change:matrix change:labels change:match_probs" );
	this.__triggerEvents();
	return this;
};

/**
 * Read in a 2D array of numbers.
 * Infer row and column dimensions from input data.
 * @param{number[][]} matrix Two dimensional array of values for the matrix.
 * @return{CorrespondenceChartObject} Return this object to enable chaining.
 **/
CorrespondenceChartObject.prototype.importMatrix = function( matrix, rowDims, columnDims )
{
	// Infer matrix dimensions
	if ( rowDims === undefined )
		rowDims = matrix.length;
	if ( columnDims === undefined )
		columnDims = _.max( matrix.map( function(d) { return d.length } ) );

	// Generate full matrix of the appropriate dimensions
	var fullMatrix = new Array( rowDims );
	for ( var s = 0; s < rowDims; s++ )
	{
		var fullRow = new Array( columnDims );
		for ( var t = 0; t < columnDims; t++ )
			fullRow[t] = { 'rowIndex' : s, 'columnIndex' : t, 'value' : 0.0 };
		fullMatrix[s] = fullRow;
	}
	
	// Copy matrix values
	var sCount = Math.min( rowDims, matrix.length );
	for ( var s = 0; s < sCount; s++ )
	{
		var tCount = Math.min( columnDims, matrix[s].length );
		for ( var t = 0; t < tCount; t++ )
		{
			fullMatrix[s][t].value = matrix[s][t];
		}
	}
	
	this.__setMatrixEntries( rowDims, columnDims, fullMatrix );
	this.__prepareEvents( "change change:dims change:ordering change:matrix change:labels change:match_probs" );
	this.__triggerEvents();
	return this;
};

/**
 * Write out a 2D array of numbers.
 * @return{number[][]} Two dimensional array of values for the matrix.
 **/
CorrespondenceChartObject.prototype.exportMatrix = function()
{
	var rowDims = this.get( "rowDims" );
	var columnDims = this.get( "columnDims" );
	var fullMatrix = this.get( "fullMatrix" );
	var rowOrdering = this.get( "rowOrdering" );
	var columnOrdering = this.get( "columnOrdering" );
	
	var matrix = [];
	for ( var s = 0; s < fullMatrix.length; s++ )
	{
		var row = [];
		for ( var t = 0; t < fullMatrix[s].length; t++ )
			row.push( fullMatrix[s][t].value );
		row = this.__reorder( row, columnOrdering );
		matrix.push( row );
	}
	matrix = this.__reorder( matrix, rowOrdering );
	return matrix;
};

CorrespondenceChartObject.prototype.__setMatrixEntries = function( rowDims, columnDims, fullMatrix )
{
	var entries = _.flatten( fullMatrix );
	var sparseMatrix = _.filter( entries, function(d) { return d.value > 0 } );
	sparseMatrix = sparseMatrix.sort( function(a,b) { return b.value - a.value } );
	sparseMatrix.forEach( function(d,i) { d.rank = i } );
	
	this.set( "rowDims", rowDims, { 'silent' : true } );
	this.set( "columnDims", columnDims, { 'silent' : true } );
	this.set( "entries", entries, { 'silent' : true } );
	this.set( "fullMatrix", fullMatrix, { 'silent' : true } );
	this.set( "sparseMatrix", sparseMatrix, { 'silent' : true } );
	
	this.__setRowOrdering();
	this.__setColumnOrdering();
	this.__setRowLabels();
	this.__setColumnLabels();
	this.__setRowMatchProbs();
	this.__setColumnMatchProbs();

	this.__orderMatrixEntries();
	this.__orderRowLabels();
	this.__orderColumnLabels();
	this.__orderRowMatchProbs();
	this.__orderColumnMatchProbs();
};

CorrespondenceChartObject.prototype.__orderMatrixEntries = function()
{
	var rowDims = this.get( "rowDims" );
	var columnDims = this.get( "columnDims" );
	var fullMatrix = this.get( "fullMatrix" );
	var rowOrdering = this.get( "rowOrdering" );
	var columnOrdering = this.get( "columnOrdering" );
	var rowPositions = this.get( "rowPositions" );
	var columnPositions = this.get( "columnPositions" );
	
	for ( var s = 0; s < rowDims; s++ )
	{
		for ( var t = 0; t < columnDims; t++ )
		{
			var entry = fullMatrix[s][t];
			entry.rowOrdering = rowOrdering[s];
			entry.columnOrdering = columnOrdering[t];
			entry.rowPosition = rowPositions[s];
			entry.columnPosition = columnPositions[t];
		}
	}
};

//--------------------------------------------------------------------------------------------------

CorrespondenceChartObject.prototype.seriateSpectral = function()
{
	this.trigger( "seriating" );
	var rowDims = this.get( "rowDims" );
	var columnDims = this.get( "columnDims" );
	var fullMatrix = this.get( "fullMatrix" );

	var rowSims = [];
	for ( var s = 0; s < rowDims; s++ )
	{
		var sVector = fullMatrix[s];
		for ( var ss = 0; ss < rowDims; ss++ )
		{
			var ssVector = fullMatrix[ss];
			var sim = this.__similarity( sVector, ssVector );
			rowSims.push( { 'i' : s, 'j' : ss, 'value' : sim } );
		}
	}
	var rowOrdering = this.__seriation.compute( rowDims, rowSims );

	var columnSims = [];
	for ( var t = 0; t < columnDims; t++ )
	{
		var tVector = new Array( rowDims );
		for ( var s = 0; s < rowDims; s++ )
			tVector[s] = fullMatrix[s][t];
		
		for ( var tt = 0; tt < columnDims; tt++ )
		{
			var ttVector = new Array( rowDims );
			for ( var s = 0; s < rowDims; s++ )
				ttVector[s] = fullMatrix[s][tt];
				
			var sim = this.__similarity( tVector, ttVector );
			columnSims.push( { 'i' : t, 'j' : tt, 'value' : sim } );
		}
	}
	var columnOrdering = this.__seriation.compute( columnDims, columnSims );
	
	this.setOrdering( rowOrdering, columnOrdering );
	this.trigger( "seriated" );
	return this;
};

CorrespondenceChartObject.prototype.seriate = function()
{
	this.trigger( "seriating" );
	var source = this.get( "rowDims" );
	var target = this.get( "columnDims" );
	var matrix = this.get( "fullMatrix" );

	// Re-order the rows
	var allSources = d3.range( source );
	var allTargets = d3.range( target );
	var candidateSources = d3.range( source );
	var candidateTargets = d3.range( target );
	var results = getBestSourcesAndTargets( candidateSources, candidateTargets, allSources, allTargets, matrix );
	
	this.setOrdering( results.seriatedSources, results.seriatedTargets );
	this.trigger( "seriated" );
	return this;
	
	
	function getBestSourcesAndTargets( candidateSources, candidateTargets, allSources, allTargets, matrix )
	{
		if ( candidateSources.length == 0 || candidateTargets.length == 0 )
		{
			var results = {};
			results.seriatedSources = candidateSources;
			results.seriatedTargets = candidateTargets;
			return results;
		}
		// Determine best target score
		var sourceValues = [];
		candidateSources.forEach( function(s)
		{
			var targetValues = [];
			allTargets.forEach( function(t)
			{
				targetValues.push( matrix[s][t].value )
			});
			sourceValues.push( d3.max( targetValues ) + d3.sum( targetValues ) * 0.1 )
		});
		var sourceValue = d3.max( sourceValues );
		var sourceIndex = 0; //sourceValues.indexOf( sourceValue );
		var bestSource = candidateSources.splice( sourceIndex, 1 );

		var targetValues = [];
		candidateTargets.forEach( function(t)
		{
			targetValues.push( matrix[bestSource][t].value );
		});
		var targetValue = d3.max( targetValues );
		var targetIndex = targetValues.indexOf( targetValue );
		var bestTarget = candidateTargets.splice( targetIndex, 1 );

		var results = getBestSourcesAndTargets( candidateSources, candidateTargets, allSources, allTargets, matrix );
		results.seriatedSources.splice( 0, 0, bestSource );
		results.seriatedTargets.splice( 0, 0, bestTarget );
		return results;
	}
}

CorrespondenceChartObject.prototype.__similarity = function( a, b )
{
	var ab = 0.0;
	var aa = 0.0;
	var bb = 0.0;
	for ( var i = 0; i < a.length; i++ )
	{
		aa += a[i].value * a[i].value;
		ab += a[i].value * b[i].value;
		bb += b[i].value * b[i].value;
	}
	var dotProduct = ab / Math.sqrt( aa ) / Math.sqrt( bb );
	return dotProduct;
};

CorrespondenceChartObject.prototype.align = function()
{
	this.trigger( "aligning" );
	var rowDims = this.get( "rowDims" );
	var columnDims = this.get( "columnDims" );
	var fullMatrix = this.get( "fullMatrix" );
	
	var rowMatchProbs = new Array( rowDims );
	for ( var s = 0; s < rowDims; s++ )
	{
		var observed = fullMatrix[s];
		var histogram = this.__histogram( observed );
		rowMatchProbs[s] = histogram;
	}

	var columnMatchProbs = new Array( columnDims );
	for ( var t = 0; t < columnDims; t++ )
	{
		var observed = new Array( rowDims );
		for ( var s = 0; s < rowDims; s++ )
			observed[s] = fullMatrix[s][t];
		var histogram = this.__histogram( observed );
		columnMatchProbs[t] = histogram;
	}
	
	this.setMatchProbs( rowMatchProbs, columnMatchProbs );
	this.trigger( "aligned" );
	return this;
};

//--------------------------------------------------------------------------------------------------

CorrespondenceChartObject.prototype.__prepareEvents = function( events )
{
	if ( this.__events === undefined )
		this.__events = events.split( /[ ]+/g );
	else
		this.__events = _.union( this.__events, events.split( /[ ]+/g ) );
};

CorrespondenceChartObject.prototype.__triggerEventsImmediately = function( events )
{
	this.trigger( this.__events.join( " " ), this );
	this.__events = [];
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
CorrespondenceChartObject.prototype.__histogram = function( entries, index, histogram )
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

/**
 * Re-order a list of objects.
 * @param{Object[]} objects A list of objects to be reordered.
 * @param{number[]} ordering New object indexes.
 * @return{Object[]} The list of objects sorted by row ordering.
 * @private
 **/
CorrespondenceChartObject.prototype.__reorder = function( objects, ordering )
{
	var reorderedObjects = new Array( objects.length );
	for ( var n = 0; n < objects.length; n++ )
		reorderedObjects[ n ] = objects[ ordering[n] ];
	return reorderedObjects;
}


// Export the object declaration
exports['CorrespondenceChartObject'] = CorrespondenceChartObject;

}) ( typeof exports === 'undefined' ? this : exports );
