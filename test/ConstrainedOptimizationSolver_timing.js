
// Node.js: Load required libraries
if ( typeof require !== "undefined" ) {
	chai = require( "chai" );
	ConstrainedOptimizationSolver = require( "../client_src/js/ConstrainedOptimizationSolver.js" ).ConstrainedOptimizationSolver;
}

// 100 iterations @ 280.66 ms/iteration based on original implementation. 
// 100 iterations @ 23.39 ms/iteration after inlining multiply by A and AT
// 100 iterations @ 14.26 ms/iteration after removing Array.map calls.
// 100 iterations @ 8.26 ms/iteration after caching diff in __distanceBetweenVectors calculation.

var MAX_ITERS = 100;
var N = 40;
var M = 50;
var startTime = null;
var endTime = null;

beforeEach( function() {
	startTime = new Date();
});
afterEach( function() {
	endTime = new Date();
	console.log( "\nConstrainedOptimizationSolver: " + MAX_ITERS + " iterations @ " + ( endTime - startTime ) / MAX_ITERS + " ms/iteration." );
});

describe( "ConstrainedOptimizationSolver:", function() {
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
		var getX0 = function( M )
		{
			var x0 = [];
			for ( var j = 0; j < M; j++ )
				x0.push( 1.0 / M );
			return x0;
		}
		for ( var iter = 0; iter < MAX_ITERS; iter++ )
		{
			var optim = new ConstrainedOptimizationSolver();
			optim.solve( N, M, getA(N,M), getB(N), getX0(M) );
		}
	});
});
