(function(exports){

// Node.js: Load required libraries
if ( typeof require !== 'undefined' ) {
	d3 = require('d3')
	ConjugateGradientSolver = require('./ConjugateGradientSolver.js').ConjugateGradientSolver;
}

/**
 * Contrained Optimization Solver
 * Jason Chuang [2013.01.26]
 * jcchuang@cs.stanford.edu
 *
 * Solve for x, a probability distribution
 *     min KL( A * x | B )
 *     min B' * ( log( B ) - log( A * x ) )
 *
 * Or equivalently, solve the equality and inequality constrained optimization
 *     f = -B * log( Ax )
 *     g = A' * ( -B * 1/Ax )
 *     H = A' * diag( B * 1/Ax/Ax ) * A
 * subject to
 *     sum( x ) = 1
 *     0 <= x <= 1
 *
 * Or equivalently, solve the equality constrained optimization
 *     f = -B * log( Ax ) + exp( -barrier*violation )
 *     g = A' * ( -B * 1/Ax ) + barrier * exp( -barrier*violation ) * d(violation)/dx
 * subject to
 *     sum( x ) = 1
 *
 * @param{Object} options Override default options, e.g. EPS, maxIters, etc.
 * @constructor
 **/
var ConstrainedOptimizationSolver = function( options )
{
	this.maxIters = 20;
	this.maxInnerIters = 30;
	this.maxStepSize = 0.1;     // Initial and maximum multiplier for each gradient descent step (via binary search)
	this.initBarrier = 100;     // Inequality constraints are implemented via exp(-barrier*violation)
	this.finalBarrier = 10000;  // Inequality constraints are implemented via exp(-barrier*violation)
	this.INFO = false;
	this.DEBUG = false;
	this.WARNING = true;
	this.EPS = 1e-8;
	this.MIN_CONSTRAINTS = 1e-3;
	this.MAX_CONVERGENCE = 1e-3;
	this.barriers = d3.scale.linear().domain( [ 0, this.maxIters] ).range( [ this.initBarrier, this.finalBarrier ] );
	
	if ( options !== undefined )
		for ( var key in options )
			this[key] = options[key];
};

/**
 * Solve for optimization where A is an n-by-m matrix and B is an n-by-1 vector, using initial solution x0.
 * Subject to equality constraints that entries in x must sum up to 1.
 * Subject to inequality constraints that all entries in x must be greater or equal to 0.
 *
 * @param{number} n Number of rows in matrix A and also the length of vector B.
 * @param{number} m Number of columns in matrix A, the length of x0, and also the length of solution vector.
 * @param{number[][]} A Matrix A in sparse representation as a list of elements each having 3 fields: { i, j, value }.
 * @param{number[]} B Vector B.
 * @param{number[]} x0 Vector x0 (optional; uniform distribution is used as initial solution if none is specified).
 * @return{number[]} Solution vector.
 **/
ConstrainedOptimizationSolver.prototype.solve = function( n, m, A, B, x0 )
{
	this.n = n;
	this.m = m;
	this.A = A;
	this.B = B;
	if ( this.INFO ) { console.log( 'Contrained Optimization Solver: (n, m, A, B) = ', this.n, this.m, this.A, this.B  ) }
	
	this.__logB = this.B.map( function(d) { return Math.log(d) } );

	var A_row = d3.max( this.A.map( function(d) { return d.i } ) ) + 1;
	var A_col = d3.max( this.A.map( function(d) { return d.j } ) ) + 1;
	var B_row = this.B.length;
	if ( this.INFO ) { console.log( 'dims(A) = ', A_row, A_col ) }
	if ( this.INFO ) { console.log( 'dims(B) = ', B_row, 1 ) }
	if ( A_row != B_row && this.WARNING ) { console.log( 'WARNING: Dimension mismatch: row(A) != row(B)', A_row, B_row ) }
	
	this.__initSolve( x0 );
	for ( var iter = 0; iter < this.maxIters; iter++ )
	{
		this.iters = iter + 1;
		if ( this.__iterSolve( iter ) )
			break;
	}

	// Sums to 1 to make a proper probability distribution
	var xSum = 0.0;
	for ( var i = 0; i < this.x.length; i++ )
	{
		this.x[i] = Math.max( 0, Math.min( 1, this.x[i] ) );
		xSum += this.x[i];
	}
	for ( var i = 0; i < this.x.length; i++ )
		this.x[i] = this.x[i] / xSum;

	return this.x;
};

/**
 * Initial solution.
 * @private
 **/
ConstrainedOptimizationSolver.prototype.__initSolve = function( x0 )
{
	if ( x0 === undefined || x0 === null )
		this.x = this.__uniform( this.m );
	else
		this.x = x0.slice();
	this.barrier = this.barriers(0);
	this.stepSize = this.maxStepSize;

	if ( this.INFO )
	{
		console.log( 'ContrainedOptimization Solver initial: f = ', this.__objective(this.x), ', x = ', d3.sum(this.x), this.x );
	}
};

/**
 * Outer loop: Barrier method.
 * @param{number} iter Iteration number, used to calculate current barrier.
 * @private
 **/
ConstrainedOptimizationSolver.prototype.__iterSolve = function( iter )
{
	var x = this.x.slice();
	this.barrier = this.barriers(iter);
	this.stepSize = this.maxStepSize;
	
	// Solve for x
	this.x = this.__innerIterSolve( x );
	
	// Check for constraint violations
	this.lowerboundViolation = 0.0;
	this.upperboundViolation = 0.0;
	for ( var i = 0; i < this.m; i++ )
	{
		this.lowerboundViolation += Math.exp( -this.barrier *    x[i]  );  // Lowerbounds
		this.upperboundViolation += Math.exp( -this.barrier * (1-x[i]) );  // Upperbounds
	}
	
	if ( this.INFO )
	{
		console.log( 'ContrainedOptimization Solver iteration #' + iter,
			': f = ', this.__objective(this.x),
			', x = ', d3.sum(this.x), 
			', dx = ', this.__distanceBetweenVectors( this.x, x ),
			', {x|x<0} = ', this.lowerboundViolation,
			', {x|x>1} = ', this.upperboundViolation,
			', step_size = ', this.stepSize,
			', barrier = ', this.barrier );
	}
	
	if ( this.__distanceBetweenVectors( this.x, x ) < this.MAX_CONVERGENCE
	  && this.lowerboundViolation < this.MIN_CONSTRAINTS
	  && this.upperboundViolation < this.MIN_CONSTRAINTS )
		return true;
	return false;
};

/**
 * Inner loop: Crude trust region search along the constrained gradient direction.
 * @param{number[]} x Solution from the previous iteration.
 * @private
 **/
ConstrainedOptimizationSolver.prototype.__innerIterSolve = function( x, descentIter, f, g, gConstrained )
{
	if ( descentIter === undefined )
	{
		descentIter = 0;

		if ( this.DEBUG ) { console.log( 'x = ', x ) }

		f = this.__objective( x );
		if ( this.DEBUG ) { console.log( 'f = ', f ) }

		g = this.__gradient( x );
		if ( this.DEBUG ) { console.log( 'g = ', g ) }

		gConstrained = this.__gConstrained( g );
		if ( this.DEBUG ) { console.log( 'g_constrained = ', gConstrained ) }
	}

	var xCandidate = this.__addScaledVectors( x, gConstrained, -this.stepSize );
	if ( this.DEBUG ) { console.log( 'x_candidate = ', xCandidate ) }

	fCandidate = this.__objective( xCandidate );
	if ( this.DEBUG ) { console.log( 'f_candidate ('+this.stepSize+') = ', fCandidate ) }

	if ( fCandidate < f )
	{
		return xCandidate;
	}
	if ( this.__distanceBetweenVectors( xCandidate, x ) < this.EPS || descentIter > this.maxIters )
	{
		return x;
	}
	this.stepSize /= 2;
	return this.__innerIterSolve( x, descentIter + 1, f, g, gConstrained );
}

/**
 * Objective value at x.
 * @param{number[]} x Current solution.
 * @return{number} Objective at x.
 * @private
 **/
ConstrainedOptimizationSolver.prototype.__objective = function( x )
{
	var f = 0;
	this.Ax = this.__multiplyVectorByA( x );
	this.logAx = new Array( this.n );
	for ( var i = 0; i < this.n; i++ )
	{
		this.Ax[i] = Math.max( this.EPS, this.Ax[i] );
		this.logAx[i] = Math.log( this.Ax[i] );
		f += this.Ax[i] * ( this.logAx[i] - this.__logB[i] );
	}
	for ( var i = 0; i < this.m; i++ )
	{
		f += Math.exp( -this.barrier *    x[i]  );  // Lowerbound violations; 0 if constraint is not violated.
		f += Math.exp( -this.barrier * (1-x[i]) );  // Upperbound violations; 0 if constarint is not violated.
	}
	return f;
};

/**
 * Gradient vector at x.
 * @param{number[]} x Current solution.
 * @return{number[]} Gradient at x.
 * @private
 **/
ConstrainedOptimizationSolver.prototype.__gradient = function( x )
{
	var t = new Array( this.n );
	for ( var i = 0; i < this.n; i++ )
	{
		t[i] = this.logAx[i] - this.__logB[i] + 1;
	}
	var g = this.__multiplyVectorByAT( t );
	for ( var i = 0; i < this.m; i++ )
	{
		g[i] += -this.barrier * Math.exp( -this.barrier *    x[i]  );  // Lowerbound violations; 0 if constraint is not violated.
		g[i] +=  this.barrier * Math.exp( -this.barrier * (1-x[i]) );  // Upperbound violations; 0 if constarint is not violated.
	}
	return g;
};

/**
 * Constrain gradient to confirm with equality constraint.
 * Ensure gradient has no component in nullspace ( 1, 1, ... )
 * @param{number[]} g Gradient at x.
 * @return{number[]} Constrained gradient at x.
 * @private
 **/
ConstrainedOptimizationSolver.prototype.__gConstrained = function( g )
{
	var projection = 0.0;
	for ( var i = 0; i < g.length; i++ )
		projection += g[i];
	projection /= g.length;
	
	var gConstrained = new Array( g.length );
	for ( var i = 0; i < g.length; i++ )
		gConstrained[i] = g[i] - projection;
	return gConstrained;
};

/**
 * Generate an array of zeros.
 * @param{number} len Length of array.
 * @return{number[]} An array of given length filled with zero values.
 * @private
 **/
ConstrainedOptimizationSolver.prototype.__zeros = function( len )
{
    var vector = new Array( len );
    while ( --len >= 0 ) vector[ len ] = 0.0;
    return vector;
};

/**
 * Generate a uniform array (of 1/n).
 * @param{number} len Length of array.
 * @return{number[]} An array of given length filled with constant values that add up to 1.
 * @private
 **/
ConstrainedOptimizationSolver.prototype.__uniform = function( len )
{
	var u = 1.0 / len;
    var vector = new Array( len );
    while ( --len >= 0 ) vector[ len ] = u;
    return vector;
};

/**
 * Compute Eucliean distance between two vectors.
 * @param{number[]} vector1 A vector.
 * @param{number[]} vector2 A vector.
 * @param{number} Square root of sum of squared differences.
 */
ConstrainedOptimizationSolver.prototype.__distanceBetweenVectors = function( vector1, vector2 )
{
	var squareDiffs = 0.0;
	for ( var i = 0; i < vector1.length; i++ )
	{
		var diff = vector1[i] - vector2[i];
		squareDiffs += diff * diff;
	}
	return Math.sqrt( squareDiffs );
}

/**
 * Add a vector to a scaled vector.
 * @param{number[]} vector1 A vector.
 * @param{number[]} vector2 A vector.
 * @param{number} scalar A scalar.
 * @param{number[]} Sum of vector1 and scaled vector2.
 * @private
 **/
ConstrainedOptimizationSolver.prototype.__addScaledVectors = function( vector1, vector2, scale )
{
	var vectorSum = new Array( vector1.length );
	for ( var i = 0; i < vector1.length; i++ )
		vectorSum[i] = vector1[i] + scale * vector2[i];
	return vectorSum;
};

/**
 * Left multiple a vector by matrix A.
 * @param{number[]} vector A vector of length m.
 * @return{number[]} A vector of length n.
 * @private
 **/
ConstrainedOptimizationSolver.prototype.__multiplyVectorByA = function( vector )
{
	var Av = this.__zeros( this.n );
	for ( var n = 0; n < this.A.length; n++ )
	{
		var Aij = this.A[n];
		Av[ Aij.i ] += Aij.value * vector[ Aij.j ];
	}
	return Av;
};

/**
 * Left multiply a vector by matrix A^T (i.e., transposed matrix A).
 * @param{number[]} vector A vector of length n.
 * @return{number[]} A vector of length m.
 * @private
 **/
ConstrainedOptimizationSolver.prototype.__multiplyVectorByAT = function( vector )
{
	var Av = this.__zeros( this.m );
	for ( var n = 0; n < this.A.length; n++ )
	{
		var Aij = this.A[n];
		Av[ Aij.j ] += Aij.value * vector[ Aij.i ];
	}
	return Av;
};


// Export the object declaration
exports['ConstrainedOptimizationSolver'] = ConstrainedOptimizationSolver;

}) ( typeof exports === 'undefined' ? this : exports );
