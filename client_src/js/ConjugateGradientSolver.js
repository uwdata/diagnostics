(function(exports){

// Node.js: Load required libraries
if ( typeof require !== 'undefined' ) {
	_ = require('underscore');
}

/**
 * Conjugate Gradient Solver
 * Jason Chuang [2013.01.26]
 * jcchuang@cs.stanford.edu
 *
 * Solve for the optimization problem.
 *     min || A * x - B ||
 *
 * Solution occurs only when gradient is zero.
 * Equivalently, solve for the system of linear equations.
 *      A' * A * x = A' * B
 *
 * Apply conjugatge gradient.
 *     x_k = [ 0, 0, ... ]
 *     r_k = A' * B - A' * A * x_k
 *     p_k = r_k
 *         Ap_k = A * p_k
 *         AAp_k = A' * Ap_k
 *         a = ||r_k||^2 / ||Ap_k||^2
 *         x_kk = x_k + a * p_k
 *         r_kk = r_k - a * AAp_k
 *         b = ||r_kk||^2 / ||r_k||^2
 *         p_kk = r_kk + b * p_k
 *         _k ---> _kk
 *
 * @param{Object} options Override default options, e.g. EPS, MAX_ITERATIONS, etc.
 * @constructor
 **/
var ConjugateGradientSolver = function( options )
{
	this.MAX_ITERATIONS = 50;
	this.INFO = false;
	this.DEBUG = false;
	this.WARNING = true;
	this.EPS = 1e-8;
	
	// Use options to override EPS, INFO, DEBUG, WARNING, MAX_ITERATIONS, etc.
	if ( options !== undefined )
		for ( var key in options )
			this[key] = options[key];
};

/**
 * Solve for convex optimization where A is an n-by-m matrix and B is an n-by-1 vector.
 *
 * @param{number} n Number of rows in matrix A and also the length of vector B.
 * @param{number} m Number of columns in matrix A and also the length of solution vector.
 * @param{Object[]} A Matrix A in sparse representation as a list of elements each having 3 fields: { i, j, value }.
 * @param{number[]} B Vector B.
 * @return{number[]} Solution vector.
 **/
ConjugateGradientSolver.prototype.solve = function( n, m, A, B )
{
	this.n = n;
	this.m = m;
	this.A = A;
	this.B = B;
	if ( this.INFO ) { console.log( 'Conjugate Gradient Solver: (n, m, A, B) = ', this.n, this.m, this.A, this.B ) }
	
	var A_row = _.max( this.A.map( function(d) { return d.i } ) ) + 1;
	var A_col = _.max( this.A.map( function(d) { return d.j } ) ) + 1;
	var B_row = this.B.length;
	if ( this.INFO ) { console.log( 'dims(A) = ', A_row, A_col ) }
	if ( this.INFO ) { console.log( 'dims(B) = ', B_row, 1 ) }
	if ( this.WARNING && A_row != B_row ) { console.log( 'WARNING: Dimension mismatch: row(A) != row(B)', A_row, B_row ) }
	if ( this.WARNING && A_row > this.n ) { console.log( 'WARNING: Invalid matrix elements: row(A) > n', A_row, this.n ) }
	if ( this.WARNING && A_col > this.m ) { console.log( 'WARNING: Invalid matrix elements: col(A) > m', A_col, this.m ) }

	this.__initSolve();
	for ( var iter = 0; iter < this.MAX_ITERATIONS; iter ++ )
	{
		this.iters = iter + 1;
		if ( this.__iterSolve( iter ) )
			break;
	}

	return this.x_kk;
};

/**
 * Initial iteration of CG.
 * @private
 **/
ConjugateGradientSolver.prototype.__initSolve = function()
{
	//--------------------
	// x_0 = 0
	this.x_k = this.__zeros(this.m);
	if ( this.DEBUG ) { console.log( 'x_k ('+this.x_k.length+') = ', this.x_k ) }

	//--------------------
	// r_0 = A^T * B - A^T * A * x;
	var AB = this.__multiplyVectorByAT( this.B );
	if ( this.DEBUG ) { console.log( 'AT * B ('+AB.length+') = ', AB ) }

	var Ax = this.__multiplyVectorByA( this.x_k );
	if ( this.DEBUG ) { console.log( 'A * x ('+Ax.length+') = ', Ax ) }

	var AAx = this.__multiplyVectorByAT( Ax );
	if ( this.DEBUG ) { console.log( 'AT * A * x ('+AAx.length+') = ', AAx ) }

	this.r_k = this.__addVectors( AB, this.__rescaleVector( -1.0, AAx ) );
	if ( this.DEBUG ) { console.log( 'r_k ('+this.r_k.length+') = ', this.r_k ) }
	
	//--------------------
	// p_0 = r_0
	this.p_k = this.__rescaleVector( 1.0, this.r_k );
	if ( this.DEBUG ) { console.log( 'p_k ('+this.p_k.length+') = ', this.p_k ) }
};

/**
 * Subsequent iterations of CG.
 * @param{number} iter Iteration index (for display only).
 * @return{boolean} Whether convergence criteria has been met.
 * @private
 **/
ConjugateGradientSolver.prototype.__iterSolve = function( iter )
{
	// alpha = r_k ^2 / ( A * p_k ) ^2
	var norm_r_k = this.__dot( this.r_k );
	if ( this.DEBUG ) { console.log( 'norm(r_k) = ', norm_r_k ) }

	var Ap_k = this.__multiplyVectorByA( this.p_k );
	if ( this.DEBUG ) { console.log( 'A * p_k ('+Ap_k.length+') = ', Ap_k ) }
	
	var AAp_k = this.__multiplyVectorByAT( Ap_k );
	if ( this.DEBUG ) { console.log( 'AT * A * p_k ('+AAp_k.length+') = ', AAp_k ) }
	
	var norm_Ap_k = this.__dot( Ap_k );
	if ( this.DEBUG ) { console.log( 'norm(Ap_k) = ', norm_Ap_k ) }

	var alpha = norm_r_k / norm_Ap_k;
	if ( this.DEBUG ) { console.log( 'alpha = ', alpha ) }

	//--------------------
	// x_kk = x_k + alpha * p_k
	this.x_kk = this.__addVectors( this.x_k, this.__rescaleVector( alpha, this.p_k ) );
	if ( this.DEBUG ) { console.log( 'x_kk ('+this.x_kk.length+') = ', this.x_kk ) }

	//--------------------
	// r_kk = r_k - alpha * A * A * p_k
	this.r_kk = this.__addVectors( this.r_k, this.__rescaleVector( -alpha, AAp_k ) );
	if ( this.DEBUG ) { console.log( 'r_kk ('+this.r_kk.length+') = ', this.r_kk ) }

	var norm_r_kk = this.__dot( this.r_kk );
	if ( this.DEBUG ) { console.log( 'norm(r_kk) = ', norm_r_kk ) }
	
	if ( this.INFO ) { console.log( 'Conjugate Gradient Solver: iteration #' + iter + ', residual = ' + norm_r_kk ) }
	if ( norm_r_kk <= this.EPS )
		return true;
	
	//--------------------
	// beta = r_kk ^2 / r_k ^2
	var beta = norm_r_kk / norm_r_k;
	if ( this.DEBUG ) { console.log( 'beta = ', beta ) }

	//--------------------
	// p_kk = r_k + beta * p_k
	this.p_kk = this.__addVectors( this.r_kk, this.__rescaleVector( beta, this.p_k ) );
	if ( this.DEBUG ) { console.log( 'p_kk ('+this.p_kk.length+') = ', this.p_kk ) }

	//--------------------
	// k = k + 1
	this.x_k = this.x_kk;
	this.r_k = this.r_kk;
	this.p_k = this.p_kk;
	return false;
};

/**
 * Generate an array of zeros.
 * @param{number} len Length of array.
 * @return{number[]} An array of given length filled with zero values.
 * @private
 **/
ConjugateGradientSolver.prototype.__zeros = function( len )
{
    var vector = new Array( len );
    while ( --len >= 0 )
 		vector[ len ] = 0.0;
    return vector;
}

/**
 * Calculate the dot product of a vector with itself.
 * @param{number[]} vector A vector of numbers.
 * @return{number} The dot product of a vector with itself.
 * @prviate
 **/
ConjugateGradientSolver.prototype.__dot = function( vector )
{
	var product = 0.0;
	for ( var i = 0; i < vector.length; i++ )
		product += vector[i] * vector[i];
	return product;
};

/**
 * Multiply a vector by a scalar.
 * @param{number} scalar A scalar.
 * @param{number[]} vector A vector.
 * @return{number[]} Rescaled vector.
 * @private
 **/
ConjugateGradientSolver.prototype.__rescaleVector = function( scalar, vector )
{
	var rescaledVector = new Array( vector.length );
	for ( var i = 0; i < vector.length; i++ )
		rescaledVector[i] = scalar * vector[i];
	return rescaledVector;
};

/**
 * Add two vectors.
 * @param{number[]} vector1 A vector.
 * @param{number[]} vector2 A vector.
 * @param{number[]} Sum of vectors.
 * @private
 **/
ConjugateGradientSolver.prototype.__addVectors = function( vector1, vector2 )
{
	var vectorSum = new Array( vector1.length );
	for ( var i = 0; i < vector1.length; i++ )
		vectorSum[i] = vector1[i] + vector2[i];
	return vectorSum;
};

/**
 * Left multiple a vector p by matrix A.
 * @param{number[]} p A vector of length m.
 * @return{number[]} A vector of length n.
 * @private
 **/
ConjugateGradientSolver.prototype.__multiplyVectorByA = function( p )
{
	var Ap = this.__zeros( this.n );
	for ( var n = 0; n < this.A.length; n ++ )
	{
		var Aij = this.A[n];
		Ap[ Aij.i ] += Aij.value * p[ Aij.j ];
	}
	return Ap;
};

/**
 * Left multiply a vector B by matrix A^T (i.e., transposed matrix A).
 * @param{number[]} B A vector of length n.
 * @return{number[]} A vector of length m.
 * @private
 **/
ConjugateGradientSolver.prototype.__multiplyVectorByAT = function( B )
{
	var AB = this.__zeros( this.m );
	for ( var n = 0; n < this.A.length; n ++ )
	{
		var Aij = this.A[n];
		AB[ Aij.j ] += Aij.value * B[ Aij.i ];
	}
	return AB;
};


// Export the object declaration
exports['ConjugateGradientSolver'] = ConjugateGradientSolver;

}) ( typeof exports === 'undefined' ? this : exports );
