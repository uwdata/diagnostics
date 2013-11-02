
// Node.js: Load required libraries
if ( typeof require !== "undefined" ) {
	chai = require( "chai" );
	ConjugateGradientSolver = require( "../client_src/js/ConjugateGradientSolver.js" ).ConjugateGradientSolver;
}

// Approximately 0.1s per iteration for 40x50 matrices. Original implementation.
//               0.05s per iteration for 40x50 matrices. Inlined __multiplyVectorByAT() method.
//               7.079ms per iteration for 40x50 matrices. Inlined __multiplyVectorByT() method.
//               Inlining __zeros has no effect.
//               6.022ms per iteration. Inlined __rescaleVector() method.
//               5.041ms per iteration. Inlined __dot() method.

var MAX_ITERS = 1000;
var N = 40;
var M = 50;
var startTime = null;
var endTime = null;

beforeEach( function() {
	startTime = new Date();
});
afterEach( function() {
	endTime = new Date();
	console.log( "\nConjugateGradient: " + MAX_ITERS + " iterations @ " + ( endTime - startTime ) / MAX_ITERS + " ms/iteration." );
});

describe( "ConjugateGradientSolver:", function() {
	it( "should execute " + MAX_ITERS + " iterations.", function() {
		
		var getA = function( N, M )
		{
			var A = [];
			for ( var i = 0; i < N; i++ )
				for ( var j = 0; j < M; j++ )
					A.push( { i : i, j : j, value : Math.random() } );
			return A;
		};
		var getB = function( N )
		{
			var B = [];
			for ( var i = 0; i < N; i++ )
				B.push( Math.random() );
			return B;
		};
		for ( var iter = 0; iter < MAX_ITERS; iter++ )
		{
			var cg = new ConjugateGradientSolver();
			cg.solve( N, M, getA(N,M), getB(N) );
		}
	});
});
