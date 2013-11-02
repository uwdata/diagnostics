(function(exports){

// Node.js: Load required libraries
if ( typeof require !== 'undefined' ) {
	ConstrainedOptimizationInitSolver = require('./ConstrainedOptimizationInitSolver.js').ConstrainedOptimizationInitSolver;
}

/**
 * Remove 'noise' histogram from 'observed' histogram.
 * @constructor
 **/
var DenoiseComputation = function( options )
{
	this.EPS = 1e-8;

	// Use options to override EPS
	if ( options !== undefined )
		for ( var key in options )
			this[key] = options[key];
			
	this.optim = new ConstrainedOptimizationInitSolver( options );
};

/**
 * Remove 'noise' histogram from 'observed' histogram.
 * @param{number[]} observed Observed histogram.
 * @param{number[]} noise Noise histogram.
 * @return{number[]} Denoised histogram (decovolute 'noise' from 'observed').
 **/
DenoiseComputation.prototype.solve = function( observed, noise )
{
	var n = noise.length;
	var m = observed.length;
	var A = this.__packMatrix( this.__getMatrixA( observed, noise ), n, m );
	var B = this.__getVectorB( observed );
	var x = this.optim.solve( n, m, A, B );
	this.iters = this.optim.iters;
	return x;
};

/**
 * Remove any cells in the convolution matrix outside of the valid dimensions.
 * Add removed cell values to the closest cells in the matrix to preserve the total values in the matrix.
 * @private
 */
DenoiseComputation.prototype.__packMatrix = function( matrix, nMax, mMax )
{
	var valueHash = {};
	var iHash = {};
	var jHash = {};
	for ( var i in matrix )
	{
		var cell = matrix[i];
		var row = Math.min( nMax-1, cell.i );
		var col = Math.min( mMax-1, cell.j );
		var key = row + ":" + col;
		if ( key in valueHash )
			valueHash[key] += cell.value;
		else
		{
			valueHash[key] = cell.value;
			iHash[key] = row;
			jHash[key] = col;
		}
	}
	var packedMatrix = [];
	for ( var key in valueHash )
	{
		var i = iHash[key];
		var j = jHash[key];
		var value = valueHash[key];
		packedMatrix.push( { 'i' : i, 'j' : j, 'value' : value } );
	}
	return packedMatrix;
};

/**
 * Repeat noise vector to build a convoluation matrix A.
 * @private
 **/
DenoiseComputation.prototype.__getMatrixA = function( observed, noise )
{
	var matrix = []
	for ( var i = 0; i < observed.length; i++ )
	{
		var colIndex = i;
		for ( var j = 0; j < noise.length; j++ )
		{
			var rowIndex = i + j;
			if ( noise[j] > this.EPS )
				matrix.push( { 'i' : rowIndex, 'j' : colIndex, 'value' : noise[j] } );
		}
	}
	return matrix;
};

/**
 * Vector B is the same as the observed histogram.
 * @private
 **/
DenoiseComputation.prototype.__getVectorB = function( observed )
{
	return observed.slice();
};


// Export the object declaration
exports['DenoiseComputation'] = DenoiseComputation;

}) ( typeof exports === 'undefined' ? this : exports );
