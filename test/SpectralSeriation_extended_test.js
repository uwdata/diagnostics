
// Node.js: Load required libraries
if ( typeof require !== "undefined" ) {
	chai = require( "chai" );
	SpectralSeriation = require( "../client_src/js/SpectralSeriation.js" ).SpectralSeriation;
}

var minChain = 11;
var maxChain = 21;
var stepChain = 5;
var minMagnitude = 1.0;
var maxMagnitude = 2.0;
var stepMagnitude = 0.5;
var maxIters = 5;

var spearmanRankCoefficient = function( indexes )
{
	var n = indexes.length;
	var diffs = _.reduce( indexes, function( accumulator, d, i ) { return accumulator + ( d - i ) * ( d - i ); }, 0 );
	var rho = 1.0 - 6 * diffs / n / ( n * n - 1 );
	return rho;
}

var durations = [];
for ( var magnitude = minMagnitude; magnitude <= maxMagnitude; magnitude += stepMagnitude )
{
	for ( var chain = minChain; chain <= maxChain; chain += stepChain )
	{
		describe( chain + "-chained matrix (" + Math.round( Math.pow( 10, magnitude ) ) + " elements):", function() {
	
			var dimension = Math.round( Math.pow( 10, magnitude ) );
			for ( var iter = 0; iter < maxIters; iter ++ )
			{
				describe( "Iteration #" + (iter+1) + ":", function() {

					// Construct a k-chained matrix
					var band = Math.floor( chain / 2 );
					var A = [];
					for ( var row = 0; row < dimension; row++ )
						for ( var col = row - band; col <= row + band; col++ )
							if ( 0 <= col && col < dimension )
								A.push( { i : row, j : col, value : 1.0 / ( 1.0 + Math.abs( col - row ) ) } );

					// Randomly permute output
					var Q = _.range(dimension).map( function(i) { return { "value" : Math.random(), "source" : i, "target" : null } } );
					Q = Q.sort( function(a,b) { return a.value - b.value } );
					Q.forEach( function(d,i) { d.target = i } );
					var sources = Q.map( function(d) { return d.source } );
					var targets = Q.map( function(d) { return d.target } );
					var forwards = _.object( sources, targets );
					var backwards = _.object( targets, sources );
		
					// Apply permutation to matrix A
					A.forEach( function(d) { d.i = forwards[d.i]; d.j = forwards[d.j]; } );
		
					// Recover permutation from matrix A
					var startTime = new Date().getTime();
					var seriation = new SpectralSeriation();
					var indexes = seriation.compute( dimension, A );
					var endTime = new Date().getTime();
					var duration = endTime - startTime;
					durations.push( duration );
					var recovered = indexes.map( function(d) { return backwards[d] } );
				
					// Compare against original list of indexes
					var originalEqs = _.reduce( recovered, function( accumulator, d, i ) { return accumulator + ( d == i ? 1 : 0 ); }, 0 );
					// Compare against reversed list of indexes
					var invertedEqs = _.reduce( recovered, function( accumulator, d, i ) { return accumulator + ( dimension-1-d == i ? 1 : 0 ); }, 0 );
					var maxEqs = Math.max( originalEqs, invertedEqs );
					var spearman = spearmanRankCoefficient( recovered );
				
					console.log( "Iteration #" + (iter+1) + " (" + dimension + " elements):", spearman, duration + "ms", seriation.iters + "x", seriation.fiedler_value );
//					console.log( "Iteration #" + (iter+1) + " (" + dimension + " elements):", spearman, seriation.fiedler_value, duration + "ms", seriation.iters + "x", recovered );
				
					// Validate permutation
					if ( maxEqs == dimension )
					{
						if ( originalEqs == dimension )
							it( "should recover either the *ORIGINAL* or the inverted list of indexes", function() {
								chai.assert.equal( dimension, originalEqs );
							});
						else
							it( "should recover either the original or the *INVERTED* list of indexes", function() {
								chai.assert.equal( dimension, invertedEqs );
							});
					}
					else
					{
						if ( spearman > 0 )
							it( "should recover either the original or the inverted list of indexes (Spearman's rank correlation = 1)", function() {
								chai.assert.equal( 1.0, spearman );
							});
						else
							it( "should recover either the original or the inverted list of indexes (Spearman's rank correlation = -1)", function() {
								chai.assert.equal( -1.0, spearman );
							});
					}
				});
			}
		});
	}
}