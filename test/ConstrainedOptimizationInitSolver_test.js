
// Node.js: Load required libraries
if ( typeof require !== "undefined" ) {
	chai = require( "chai" );
	ConjugateGradientSolver = require( "../client_src/js/ConjugateGradientSolver.js" ).ConjugateGradientSolver;
	ConstrainedOptimizationInitSolver = require( "../client_src/js/ConstrainedOptimizationInitSolver.js" ).ConstrainedOptimizationInitSolver;
}

describe( "ConstrainedOptimizationInitSolver:", function() {

	var A = [
				{ i : 0, j : 0, value : 0.25 },
				{ i : 1, j : 0, value : 0.50 },
				{ i : 2, j : 0, value : 0.25 },
				{ i : 1, j : 1, value : 0.25 },
				{ i : 2, j : 1, value : 0.50 },
				{ i : 3, j : 1, value : 0.25 },
				{ i : 2, j : 2, value : 0.25 },
				{ i : 3, j : 2, value : 0.75 },
				{ i : 4, j : 2, value : 1.00 },
				{ i : 5, j : 2, value : 0.75 },
				{ i : 6, j : 2, value : 0.25 }
			];
	var B = [
	 			0.1000,
			    0.2000,
			    0.3000,
			    0.2000,
			    0.0500,
			    0.0300,
			    0.0200
			];

	describe( "Denoise solver with given initial solution", function() {
		var optim = new ConstrainedOptimizationSolver();
		var x0 = [ 0.27605118829981684, 0.5521023765996337, 0.17184643510054942 ];
		var x = optim.solve( 7, 3, A, B, x0 );

		it( "should be a vector of length 3.", function() {
			chai.assert.equal( 3, x.length );
		});
		it( "should contain values [ 0.340, 0.639, 0.021 ].", function() {
			chai.assert.equal( true, Math.abs( 0.3400883599630634 - x[0] ) < 1e-15 );  // Arithmetic errors
			chai.assert.equal( true, Math.abs( 0.6388206334055929 - x[1] ) < 1e-15 );  // Arithmetic errors
			chai.assert.equal( true, Math.abs( 0.0210910066313437 - x[2] ) < 1e-15 );  // Arithmetic errors
		});
		it( "should be solved in 3 iterations", function() {
			chai.assert.equal( 20, optim.iters );
		});
	});

	describe( "Denoise solver", function() {
		var optim = new ConstrainedOptimizationInitSolver();
		var x = optim.solve( 7, 3, A, B );
		
		it( "should be a vector of length 3.", function() {
			chai.assert.equal( 3, x.length );
		});
		it( "should contain values [ 0.340, 0.639, 0.021 ].", function() {
			chai.assert.equal( true, Math.abs( 0.3400883599630634 - x[0] ) < 1e-15 );  // Arithmetic errors
			chai.assert.equal( true, Math.abs( 0.6388206334055929 - x[1] ) < 1e-15 );  // Arithmetic errors
			chai.assert.equal( true, Math.abs( 0.0210910066313437 - x[2] ) < 1e-15 );  // Arithmetic errors
		});
		it( "should be solved in 20 iterations", function() {
			chai.assert.equal( 20, optim.iters );
		});
	});
});
