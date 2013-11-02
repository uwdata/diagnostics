(function(exports){

// Node.js: Load required libraries
if ( typeof require !== 'undefined' ) {
	_ = require('underscore');	
}

/**
 * Spectral Seriation
 * Jason Chuang [2013.05.13]
 * jcchuang@cs.stanford.edu
 *
 * Solve for the Fiedler vector for symmetric matrix A.
 *
 * D = Diagonal matrix where
 *     D(i,j) = 0 for i != j
 *     D(i,i) = sum_k A(i,k)
 *
 * L = Laplacian matrix where
 *     L = D - A
 *
 * Fiedler vector is the eigenvector corresponding to the 
 * smallest non-zero eigenvalue of L, a.k.a. Fielder value.
 *
 * Based on iterative eigenvector calculation based 
 * on auxiliary matrix Q where
 *    Q = (2*Delta+1) * I - D + A
 *    Delta = max_i D(i,i)
 *
 * The largest eigenvalue of Q equals ( 2 * Delta + 1 )
 * whose corresponding eigenvector is [ 1, 1, ... , 1 ]^T
 *
 * The second largest eigenvalue of Q equals ( 2 * Delta + 1 - FiedlerValue )
 * whose corresponding eigenvector is the fiedler vector
 *
 * Spectral seriation corresponds to the indices of the ordered values
 * in the Fiedler vector. This implementation assumes that all nodes
 * are fully connected in matrix A, i.e., A does not decompose into two
 * completely disconnected block matrices.
 **/
var SpectralSeriation = function( options )
{
	this.MAX_ITERATIONS = 1e+5;
	this.INFO = false;
	this.DEBUG = false;
	this.WARNING = true;
	this.EPS = 1e-12;
	this.POSITIVE_CONSTANT = 1.0;  // Must be greater than 0.0

	// Use options to override EPS, INFO, DEBUG, WARNING, MAX_ITERATIONS, etc.
	if ( options !== undefined )
		for ( var key in options )
			this[key] = options[key];
};

/**
 * Solve for seriation where A is an n-by-n symmetric adjacency matrix.
 *
 * @param{number} n Number of rows/columns in matrix A.
 * @param{Object[]} A Matrix A in sparse representation: a list of non-zero entries with 3 fields: { i, j, value }.
 * @return{number[]} Seriatied indexes.
 **/
SpectralSeriation.prototype.compute = function( n, A )
{
	this.n = n;
	this.A = A;
	if ( this.INFO ) { console.log( 'Spectral Seriation: (n, A) = ', this.n, this.A ) }
	
	// Construct diagonal matrix D.
	this.D = this.__zeros( this.n );
	this.DD = this.__zeros( this.n );
	for ( var i = 0; i < this.A.length; i++ )
	{
		var d = this.A[i];
		this.D[ d.i ] += d.value;
		this.DD[ d.j ] += d.value;
	}
	if ( this.WARNING )
		for ( var i = 0; i < this.n; i++ )
			if ( Math.abs( this.D[i] - this.DD[i] ) > this.EPS )
				console.log( 'WARNING: Input matrix A is not symmetric.' );

	// Construct maxD, needed for creating auxiliary matrix Q.
	this.maxD = Math.max.apply( Math, this.D );
	if ( this.DEBUG )
		console.log( 'Diagonal matrix: D =', this.D );
	if ( this.DEBUG )
		console.log( 'Maximum diagonal: maxD =', this.maxD );
	
	// Initial solution.
	this.__initSolve();
	
	// Power iteration.
	for ( var iter = 0; iter < this.MAX_ITERATIONS; iter ++ )
	{
		this.iters = iter + 1;
		if ( this.__iterSolve() )
			break;
	}
	if ( this.DEBUG )
		console.log( 'Convergence: iters =', this.iters, 'residual =', this.residual );
	
	// Extract node ordering from Fiedler vector.
	this.__seriate();
	return this.ordering;
};

/**
 * Initial solution is a random vector.
 * Fiedler value is initially set to 0.
 * Fiedler vector is initially set to all zeros.
 * @private
 **/
SpectralSeriation.prototype.__initSolve = function()
{
	this.x_vector = this.__randoms( this.n );
	this.fiedler_value = 0;
	this.fiedler_vector = this.__zeros( this.n );
};

/**
 * One iteration of the power method to solve for the 2nd smallest eigenvalue.
 * @private
 **/
SpectralSeriation.prototype.__iterSolve = function()
{
	// Remove null space vector. Compute vector length.
	// Two steps combined into one, for computational efficiency.
	var avg = 0.0;
	for ( var i = 0; i < this.n; i++ )
		avg += this.x_vector[i];
	avg /= this.n;
	this.x_length = 0.0;
	for ( var i = 0; i < this.n; i++ )
	{
		this.x_vector[i] -= avg;
		this.x_length += this.x_vector[i] * this.x_vector[i];
	}
	this.x_length = Math.sqrt( this.x_length );
	
	// Normalize vector.
	var multiplier = 1.0 / this.x_length;
	for ( var i = 0; i < this.n; i++ )
		this.x_vector[i] *= multiplier;

	// Compute y = A * x
	// y = ( ( 2 * maxD + 1 ) * eye(N) - D ) * x_normalized + A * x_normalized;
	this.y_vector = new Array( this.n );
	for ( var i = 0; i < this.n; i++ )
		this.y_vector[i] = ( 2.0 * this.maxD + this.POSITIVE_CONSTANT - this.D[i] ) * this.x_vector[i];
	for ( var z = 0; z < this.A.length; z++ )
	{
		var Aij = this.A[z];
		this.y_vector[ Aij.i ] += Aij.value * this.x_vector[ Aij.j ];
	}

	// Remove null space vector. Compute vector length.
	// Two steps combined into one, for computational efficiency.
	// For numerial stability: Make individual iterations more costly but reduce overall number of iterations.
	var avg = 0.0;
	for ( var i = 0; i < this.n; i++ )
		avg += this.y_vector[i];
	avg /= this.n;
	this.y_length = 0.0;
	for ( var i = 0; i < this.n; i++ )
	{
		this.y_vector[i] -= avg;
		this.y_length += this.y_vector[i] * this.y_vector[i];
	}
	this.y_length = Math.sqrt( this.y_length );

	// Normalize vector.
	var multiplier = 1.0 / this.y_length;
	for ( var i = 0; i < this.n; i++ )
		this.y_vector[i] *= multiplier;
	
	// Isolate eigenvalue.
	var previous_value = this.fiedler_value;
	this.fiedler_value = 2.0 * this.maxD + this.POSITIVE_CONSTANT - this.y_length;
	this.fiedler_vector = this.y_vector;
	this.residual = Math.abs( this.fiedler_value - previous_value );
	
	// Terminate if change in eigenvalue is below EPS.
	if ( this.residual < this.EPS )
		return true;
	
	// Otherwise, initialize solution for the next iteration.
	this.x_vector = this.fiedler_vector;
	return false;
};

SpectralSeriation.prototype.__seriate = function()
{
	var indexesAndPositions = new Array( this.n );
	for ( var i = 0; i < this.n; i++ )
		indexesAndPositions[i] = { value : this.fiedler_vector[i], index : i, position: null };
	indexesAndPositions = indexesAndPositions.sort( function(a,b) { return a.value - b.value } );
	for ( var i = 0; i < this.n; i++ )
		indexesAndPositions[i].position = i;
	indexesAndPositions = indexesAndPositions.sort( function(a,b) { return a.index - b.index } );

	this.ordering = new Array( this.n );
	this.positions = new Array( this.n );
	for ( var i = 0; i < this.n; i++ )
	{
		var d = indexesAndPositions[i];
		this.ordering[ d.position ] = d.index;
		this.positions[ d.index ] = d.position;
	}
};

/**
 * Generate an array of zeros.
 * @param{number} len Length of array.
 * @return{number[]} An array of given length filled with zero values.
 * @private
 **/
SpectralSeriation.prototype.__zeros = function( len )
{
    var vector = new Array( len );
    while ( --len >= 0 )
 		vector[ len ] = 0.0;
    return vector;
}

/**
 * Generate an array of random values.
 * @param{number} len Length of array.
 * @return{number[]} An array of given length filled with random values.
 * @private
 **/
SpectralSeriation.prototype.__randoms = function( len )
{
    var vector = new Array( len );
    while ( --len >= 0 )
 		vector[ len ] = Math.random();
    return vector;
}

// Export the object declaration
exports['SpectralSeriation'] = SpectralSeriation;

}) ( typeof exports === 'undefined' ? this : exports );

