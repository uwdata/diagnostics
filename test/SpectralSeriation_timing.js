
// Node.js: Load required libraries
if ( typeof require !== "undefined" ) {
	chai = require( "chai" );
	SpectralSeriation = require( "../client_src/js/SpectralSeriation.js" ).SpectralSeriation;
}

// 0.1701ms for inlined implementation based on 10,000 iterations at N = 250.
// 0.4016ms for original implementation based on 10,000 iterations at N = 250.

// 0.8477ms for inlined implementation, at N = 1000
// 1.5402ms for original implementation, at N = 1000

var MAX_ITERS = 10000;
var N = 1000;
var startTime = null;
var endTime = null;

beforeEach( function() {
	startTime = new Date();
});
afterEach( function() {
	endTime = new Date();
	console.log( "\nConjugateGradient: " + MAX_ITERS + " iterations @ " + ( endTime - startTime ) / MAX_ITERS + " ms/iteration." );
});

describe( "SpectralSeriation:", function() {
	it( "should execute " + MAX_ITERS + " iterations.", function() {

		var getA = function( N )
		{
			var A = [];
			for ( var i = 0; i < N; i++ )
				for ( var j = i; j < N; j++ )
				{
					if ( i == j )
					{
						A.push( { i : i, j : j, value : 1.0 } );
					}
					else
					{
						A.push( { i : i, j : j, value : Math.random() } );
						A.push( { i : j, j : i, value : Math.random() } );
					}
				}
			return A;
		};
		for ( var iter = 0; iter < MAX_ITERS; iter++ )
		{
			var seriation = new SpectralSeriation();
			seriation.compute( N, getA() );
		}
	});
});
