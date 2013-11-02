(function(exports){

// Node.js: Load required libraries
if ( typeof require !== 'undefined' ) {
}

var NoiseFactorComputation = function()
{
	this.MIN_FACTOR = 0.0001;
	this.MAX_FACTOR = 0.9999;
	this.EPS = 1e-8;
	this.H = 0.1;  // Initial stepsize for estimating divergence slope
};

NoiseFactorComputation.prototype.compute = function( n, m, observedEntries, noiseFactor )
{
	this.n = n;
	this.m = m;
	
	// Precomputation.
	this.observedEntries = observedEntries;
	this.observedHistogram = this.__histogram( this.observedEntries );
	this.observedWeight = this.__weight( this.observedEntries );
	this.averageNoise = this.observedWeight / this.n / this.m;
	
	// Binary search for most likely noise level.
	if ( noiseFactor === undefined || noiseFactor === null )
	{
		noiseFactor = this.__binarySearch( this.__slope.bind(this), this.__estimate.bind(this) );
	}
	
	// Denoise
	this.results = this.__results( noiseFactor );
	return this.results;
};

/**
 * Search for minimum value of f (or zero crossing of g).
 * @param{function} g Numerical slope estimator.
 * @param{function} f Objective function.
 * @param{number} a Undefined when called externally; lower end of binary search when called internally via recursion.
 * @param{number} b Undefined when called externally; higher end of binary search when called internally via recursion.
 * @param{number} h Stepsize for gradient computation.
 * @return{number} Solution.
 **/
NoiseFactorComputation.prototype.__binarySearch = function( g, f, a, b, depth, h )
{
	// Initial recursive call.
	if ( a === undefined )
	 	a = this.MIN_FACTOR;
	if ( b === undefined )
		b = this.MAX_FACTOR;
	if ( depth === undefined || h === undefined )
	{
		depth = 0;
		h = this.H;
	}
	
	// Determine the next solution. Check termination criteria.
	var m = ( a + b ) / 2;
	if ( depth >= 50 )
		return m;
	if ( Math.abs( b - a ) <= this.EPS )
		return m;
	
	// Estimate divergence slope.
	var value = g( f, m, h );
	
	// Recurse and perform binary search.
	if ( value > this.EPS )
		return this.__binarySearch( g, f, a, m, depth + 1, h / 2 );
	else if ( value < -this.EPS )
		return this.__binarySearch( g, f, m, b, depth + 1, h / 2 );
	else
		return m;
};

/**
 * Given an objective function f and a point x,
 * numerically estimate the slope f'(x) using stepsize h.
 * @param{function} f Objective function.
 * @param{number} x Point.
 * @param{number} h Stepsize.
 * @param{number} Estimated slope f'(x).
 * @private
 **/
NoiseFactorComputation.prototype.__slope = function( f, x, h )
{
	var ab = this.__ab( x, h );
	var a = ab.a;
	var b = ab.b;
	var fa = f( a );
	var fb = f( b );
	var slope = ( fb - fa ) / ( b - a );
	return slope;
};

/**
 * For linear scale, this function would normally return { a : x-h/2, b : x+h/2 }
 * However, since x is on a log-ratio scale, this function returns a transformed interval.
 * @param{number} x Solution.
 * @param{number} h Stepsize.
 * @return{Object} The two ends points on either side of the solution.
 * @private
 **/
NoiseFactorComputation.prototype.__ab = function( x, h )
{
	var logRatio = Math.log(x) - Math.log(1-x);
	var aLog = logRatio - h;
	var bLog = logRatio + h;
	var a = Math.exp(aLog) / ( 1 + Math.exp(aLog) );
	var b = Math.exp(bLog) / ( 1 + Math.exp(bLog) );
	return { "a" : a, "b" : b };
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
NoiseFactorComputation.prototype.__histogram = function( sparseMatrix, index, histogram )
{
	// Initial recursive call.
	if ( index === undefined || histogram === undefined )
	{
		index = 0;
		histogram = [ 1.0 ];
	}
	
	// Check termination criteria.
	if ( index >= sparseMatrix.length )
		return histogram;
	
	// Process one more Bernoulli event.
	var ap = sparseMatrix[ index ].value;
	var bp = 1.0 - ap;
	var n = histogram.length;
	var nextHistogram = new Array( n+1 );
	nextHistogram[0] =              0 * ap + histogram[0] * bp;
	nextHistogram[n] = histogram[n-1] * ap +            0 * bp;
	for ( var i = 1; i < n; i++ )
		nextHistogram[i] = histogram[i-1] * ap + histogram[i] * bp;
	
	// Recurse.
	return this.__histogram( sparseMatrix, index + 1, nextHistogram );
};

/**
 * Given a series of binomail probabilities (as a sparse matrix),
 * compute the 'total weight' or the expected number of matches.
 *
 * @private
 **/
NoiseFactorComputation.prototype.__weight = function( sparseMatrix )
{
	var weight = 0.0;
	for ( var i = 0; i < sparseMatrix.length; i++ )
		weight += sparseMatrix[i].value;
	return weight;
};

/**
 * Estimate divergence between mixture and observed histograms.
 * @param{number} Divergence
 * @private
 */
NoiseFactorComputation.prototype.__estimate = function( factor )
{
	var p = 1.0 - factor;     // Probability of drawing from the ideal distribution (probs = 1 or 0)
	var q = factor;           // Probability of drawing from the noise distribution (i.e., marginal or row/column average)

	var remainingSignal = this.observedWeight * p;
	var noisePerCell = this.observedWeight * q / this.n / this.m;
	var mixtureEntries = [];
	for ( var i in this.observedEntries )
	{
		if ( remainingSignal <= 0 )
		{
			mixtureEntries.push( { 'value' : noisePerCell } );
		}
		else
		{
			var signalOfCurrentCell = 1.0 - noisePerCell;
			if ( signalOfCurrentCell < remainingSignal )
			{
				mixtureEntries.push( { 'value' : noisePerCell + signalOfCurrentCell } );
				remainingSignal -= signalOfCurrentCell;
			}
			else
			{
				mixtureEntries.push( { 'value' : noisePerCell + remainingSignal } );
				remainingSignal = 0.0;
			}
		}
	}
	var mixtureHistogram = this.__histogram( mixtureEntries );
	var divergence = this.__KL( mixtureHistogram, this.observedHistogram );
	return divergence;
};

/**
 * Estimate divergence between mixture and observed histograms.
 * @param{number} Divergence
 * @private
 */
NoiseFactorComputation.prototype.__results = function( factor )
{
	var results = {};
	results.factor = factor;

	var p = 1.0 - factor;     // Probability of drawing from the ideal distribution (probs = 1 or 0)
	var q = factor;           // Probability of drawing from the noise distribution (i.e., marginal or row/column average)
	
	var remainingSignal = this.observedWeight * p;
	var noisePerCell = this.observedWeight * q / this.n / this.m;
	var mixtureEntries = [];
	var idealEntries = [];
	for ( var i in this.observedEntries )
	{
		var cell = this.observedEntries[i];
		if ( remainingSignal <= 0 )
		{
			mixtureEntries.push( { 'rowIndex' : cell.rowIndex, 'columnIndex' : cell.columnIndex, 'value' : noisePerCell } );
			idealEntries.push( { 'rowIndex' : cell.rowIndex, 'columnIndex' : cell.columnIndex, 'value' : 0.0 } );
		}
		else
		{
			var signalOfCurrentCell = 1.0 - noisePerCell;
			if ( signalOfCurrentCell < remainingSignal )
			{
				mixtureEntries.push( { 'rowIndex' : cell.rowIndex, 'columnIndex' : cell.columnIndex, 'value' : noisePerCell + signalOfCurrentCell } );
				idealEntries.push( { 'rowIndex' : cell.rowIndex, 'columnIndex' : cell.columnIndex, 'value' : signalOfCurrentCell } );
				remainingSignal -= signalOfCurrentCell;
			}
			else
			{
				mixtureEntries.push( { 'rowIndex' : cell.rowIndex, 'columnIndex' : cell.columnIndex, 'value' : noisePerCell + remainingSignal } );
				idealEntries.push( { 'rowIndex' : cell.rowIndex, 'columnIndex' : cell.columnIndex, 'value' : remainingSignal } );
				remainingSignal = 0.0;
			}
		}
	}
	
	var noiseEntries = [];
	for ( var s = 0; s < this.n; s++ )
		for ( var t = 0; t < this.m; t++ )
			noiseEntries.push( { 'rowIndex' : s, 'columnIndex' : t, 'value' : noisePerCell } );

	var mixtureHistogram = this.__histogram( mixtureEntries );
	var divergence = this.__KL( mixtureHistogram, this.observedHistogram );
	
	results.divergence = divergence;
	results.n = this.n;
	results.m = this.m;
	results.noise = noisePerCell;

	results.observedEntries = this.observedEntries;
	results.mixtureEntries = mixtureEntries;
	results.noiseEntries = noiseEntries;
	results.idealEntries = idealEntries;

	results.observedHistogram = this.observedHistogram;
	results.mixtureHistogram = mixtureHistogram;
	results.noiseHistogram = this.__histogram( noiseEntries );
	results.idealHistogram = this.__histogram( idealEntries );
	
	results.observedWeight = this.observedWeight;
	results.mixtureWeight = this.__weight( mixtureEntries );
	results.noiseWeight = this.__weight( noiseEntries );
	results.idealWeight = this.__weight( idealEntries );
	return results;	
};
/**
 * Compute the KL-divergence KL(P|Q).
 * @param{Array[Number]} P Probability distribution.
 * @param{Array[Number]} Q Probability distribution.
 * @return{number} KL-divergence.
 **/
NoiseFactorComputation.prototype.__KL = function( P, Q )
{
	var divergence = 0.0;
	for ( var i = 0; i < P.length; i++ )
	{
		var p = P[i];
		var q = Q[i];
		if ( p > this.EPS )
			divergence += p * ( Math.log(p) - Math.log(q) );
	}
	if ( divergence > 1 / this.EPS )
		return 1 / this.EPS;
	if ( divergence < this.EPS )
		return this.EPS;
	return divergence;
};

// Export the object declaration
exports['NoiseFactorComputation'] = NoiseFactorComputation;

}) ( typeof exports === 'undefined' ? this : exports );
