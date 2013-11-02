
// Node.js: Load required libraries
if ( typeof require !== "undefined" ) {
	chai = require( "chai" );
	NoiseFactorComputation = require( "../client_src/js/NoiseFactorComputation.js" ).NoiseFactorComputation;
}

describe( "NoiseFactorComputation:", function() {
	describe( "Numerical differentiation f(x) = (x-0.7)^2", function() {
		var EPS = 1e-6;
		var f = function(x) { return (x-0.7) * (x-0.7) };
		var h = 1e-8;
		var noiseFactorComputation = new NoiseFactorComputation();
		var g = function(x) { return 2 * (x-0.7) };
		var gNumerical = function(x) { return ( noiseFactorComputation.__slope.bind(noiseFactorComputation) ) ( f, x, h ) };
		
		it( "should have a slope of " + g(0.1) + " at x = 0.1.", function() {
			chai.assert.equal( true, Math.abs( g(0.1) - gNumerical(0.1) ) < EPS );
		});
		it( "should have a slope of " + g(0.2) + " at x = 0.2.", function() {
			chai.assert.equal( true, Math.abs( g(0.2) - gNumerical(0.2) ) < EPS );
		});
		it( "should have a slope of " + g(0.3) + " at x = 0.3.", function() {
			chai.assert.equal( true, Math.abs( g(0.3) - gNumerical(0.3) ) < EPS );
		});
		it( "should have a slope of " + g(0.4) + " at x = 0.4.", function() {
			chai.assert.equal( true, Math.abs( g(0.4) - gNumerical(0.4) ) < EPS );
		});
		it( "should have a slope of " + g(0.5) + " at x = 0.5.", function() {
			chai.assert.equal( true, Math.abs( g(0.5) - gNumerical(0.5) ) < EPS );
		});
		it( "should have a slope of " + g(0.6) + " at x = 0.6.", function() {
			chai.assert.equal( true, Math.abs( g(0.6) - gNumerical(0.6) ) < EPS );
		});
		it( "should have a slope of " + g(0.7) + " at x = 0.7.", function() {
			chai.assert.equal( true, Math.abs( g(0.7) - gNumerical(0.7) ) < EPS );
		});
		it( "should have a slope of " + g(0.8) + " at x = 0.8.", function() {
			chai.assert.equal( true, Math.abs( g(0.8) - gNumerical(0.8) ) < EPS );
		});
		it( "should have a slope of " + g(0.9) + " at x = 0.9.", function() {
			chai.assert.equal( true, Math.abs( g(0.9) - gNumerical(0.9) ) < EPS );
		});
	});
	
	describe( "Binary search f(x) = (x-0.2) * (x-0.5) * (x-0.9)", function() {
		var EPS = 10e-6;
		var g = function( f, x, h ) { return (x-0.2) * (x-0.5) * (x-0.9) }
		var noiseFactorComputation = new NoiseFactorComputation();
		var search = function(a, b) { return noiseFactorComputation.__binarySearch( g, null, a, b ) }
		it( "should have a solution at x = 0.2 within the range [ 0.01, 0.30 ].", function() {
			chai.assert.equal( true, Math.abs( 0.2 - search( 0.01, 0.30 ) ) < EPS );
		});
		it( "should have a solution at x = 0.5 within the range [ 0.30, 0.70 ].", function() {
			chai.assert.equal( true, Math.abs( 0.5 - search( 0.30, 0.70 ) ) < EPS );
		});
		it( "should have a solution at x = 0.9 within the range [ 0.70, 0.99 ].", function() {
			chai.assert.equal( true, Math.abs( 0.9 - search( 0.70, 0.99 ) ) < EPS );
		});
	});
	
	describe( "Histograms", function() {
		var EPS = 10e-12;
		var p1 = [ { "value" : 1 }, { "value" : 1 }, { "value" : 1 } ];
		var p2 = [ { "value" : 0.2 }, { "value" : 0.3 }, { "value" : 0.5 } ];
		var p3 = [ { "value" : 0.5 }, { "value" : 0.2 }, { "value" : 0.3 } ];
		var noiseFactorComputation = new NoiseFactorComputation();
		var h1 = noiseFactorComputation.__histogram( p1 );
		
		it( "[ 1, 1, 1 ] should have a histogram of [ 0, 0, 0, 1 ]", function() {
			chai.assert.equal( 4, h1.length );
			chai.assert.equal( 0.0, h1[0] );
			chai.assert.equal( 0.0, h1[1] );
			chai.assert.equal( 0.0, h1[2] );
			chai.assert.equal( 1.0, h1[3] );
		});
		
		var h2 = noiseFactorComputation.__histogram( p2 );
		it( "[ .2, .3, .5 ] should have a histogram of [ .28, .47, .22, .03 ]", function() {
			chai.assert.equal( 4, h2.length );
			chai.assert.equal( true, Math.abs( 0.28 - h2[0] ) < EPS );
			chai.assert.equal( true, Math.abs( 0.47 - h2[1] ) < EPS );
			chai.assert.equal( true, Math.abs( 0.22 - h2[2] ) < EPS );
			chai.assert.equal( true, Math.abs( 0.03 - h2[3] ) < EPS );
		});
		
		var h3 = noiseFactorComputation.__histogram( p3 );
		it( "[ .5, .2, .3 ] should have the same histogram", function() {
			chai.assert.equal( h2.length, h3.length );
			for ( var i = 0; i < h2.length; i++ )
				chai.assert.equal( true, Math.abs( h2[i] - h3[i] ) < EPS );
		});
	});
	
	describe( "Weights", function() {
		var EPS = 10e-12;
		var p1 = [ { "value" : 1 }, { "value" : 1 }, { "value" : 1 } ];
		var p2 = [ { "value" : 0.2 }, { "value" : 0.3 }, { "value" : 0.5 } ];
		var p3 = [ { "value" : 8 }, { "value" : 4 }, { "value" : 6 } ];
		var noiseFactorComputation = new NoiseFactorComputation();
		var w1 = noiseFactorComputation.__weight( p1 );
		
		it( "[ 1, 1, 1 ] should have a weight of 3", function() {
			chai.assert.equal( 3, w1 );
		});
		
		var w2 = noiseFactorComputation.__weight( p2 );
		it( "[ .2, .3, .5 ] should have a weight of 1.0", function() {
			chai.assert.equal( 1.0, w2 );
		});
		
		var w3 = noiseFactorComputation.__weight( p3 );
		it( "[ 8, 4, 6 ] should have a weight of 18", function() {
			chai.assert.equal( 18, w3 );
		});
	});
	
	describe( "Identity matrix", function() {
		var N = 25;
		var R = 0.1;
		var n = N;
		var m = N;
		var matrix = [];
		for ( var i = 0; i < N; i++ )
			for ( var j = 0; j < N; j++ )
				if ( i == j )
					matrix.push( { "rowIndex" : i, "columnIndex" : j, "value" : (1-R) + R * Math.random() } );
				else
					matrix.push( { "rowIndex" : i, "columnIndex" : j, "value" : R * Math.random() } );
		matrix = matrix.sort( function(a,b) { return b.value - a.value } );

		var noiseFactorComputation = new NoiseFactorComputation();
		var solution = noiseFactorComputation.compute( n, m, matrix );
		it( "should have some tests...", function() {
		});
	});
});
