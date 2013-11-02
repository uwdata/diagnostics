(function(exports){

// Node.js: Load required libraries
if ( typeof require !== 'undefined' ) {
	ConjugateGradientSolver = require('./ConjugateGradientSolver.js').ConjugateGradientSolver;
	ConstrainedOptimizationSolver = require('./ConstrainedOptimizationSolver.js').ConstrainedOptimizationSolver;
}

/**
 * Contrained Optimization Solver (with Heuristic Initial Solution)
 * Jason Chuang [2013.01.26]
 * jcchuang@cs.stanford.edu
 *
 * Solve for x, a probability distribution
 *     min KL( A * x | B )
 *     min B' * ( log( B ) - log( A * x ) )
 *
 * Or equivalently, solve the constrained optimization
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
 * Generate an initial solution by heuristics.
 *
 * @param{Object} options Override default options, e.g. EPS, maxIters, etc.
 * @constructor
 **/
var ConstrainedOptimizationInitSolver = function( options )
{
	if ( options !== undefined )
		for ( var key in options )
			this[key] = options[key];

	this.cg = new ConjugateGradientSolver( options );
	this.optim = new ConstrainedOptimizationSolver( options );
};

/**
 * Solve for optimization where A is an n-by-m matrix and B is an n-by-1 vector.
 * Subject to equality constraints that entries in x must sum up to 1.
 * Subject to inequality constraints that all entries in x must be greater or equal to 0.
 *
 * @param{number} n Number of rows in matrix A and also the length of vector B.
 * @param{number} m Number of columns in matrix A, the length of x0, and also the length of solution vector.
 * @param{number[][]} A Matrix A in sparse representation as a list of elements each having 3 fields: { i, j, value }.
 * @param{number[]} B Vector B.
 * @return{number[]} Solution vector.
 **/
ConstrainedOptimizationInitSolver.prototype.solve = function( n, m, A, B )
{
	// Initial solution via conjugate gradient
	var xInit = this.cg.solve( n, m, A, B );
	
	// Ensure initial solution is valid
	// Lowerbounded by 0
	// Upperbounded by values of B
	for ( var i = 0; i < m; i++ )
	{
		if ( xInit[i] < 0 && i < m-1 )
		{
			var dx = xInit[i];
			xInit[i+1] += dx;
			xInit[i] = 0;
		}
		if ( xInit[i] > B[i] )
		{
			xInit[i] = B[i];
		}
		xInit[i] = Math.max( 0, Math.min( 1, xInit[i] ) );
	}
	// Sums to 1 to make a proper probability distribution
	var xInitSum = d3.sum( xInit );
	for ( var i = 0; i < m; i++ )
		xInit[i] = xInit[i] / xInitSum;
	this.xInit = xInit;
		
	// Solve for exaction solution via constrained optimization
	var x = this.optim.solve( n, m, A, B, xInit );
	this.iters = this.optim.iters;
	return x;
};


// Export the object declaration
exports['ConstrainedOptimizationInitSolver'] = ConstrainedOptimizationInitSolver;

}) ( typeof exports === 'undefined' ? this : exports );
