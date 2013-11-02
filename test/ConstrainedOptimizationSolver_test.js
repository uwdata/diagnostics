
// Node.js: Load required libraries
if ( typeof require !== "undefined" ) {
	chai = require( "chai" );
	ConstrainedOptimizationSolver = require( "../client_src/js/ConstrainedOptimizationSolver.js" ).ConstrainedOptimizationSolver;
}


describe( "ConstrainedOptimizationSolver:", function() {

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
	var x0 = [
				0.5000,
			    0.3000,
			    0.2000
			];

	describe( "Solve constrained optimization", function() {
		var optim = new ConstrainedOptimizationSolver();
		var x = optim.solve( 7, 3, A, B, x0 );
		
		it( "should be a vector of length 3.", function() {
			chai.assert.equal( 3, x.length );
		});
		it( "should contain values [ 0.466, 0.512, 0.021 ].", function() {
			console.log( x )
			chai.assert.equal( true, Math.abs( 0.466514963789744 - x[0] ) < 1e-15 );  // Arithmetic errors
			chai.assert.equal( true, Math.abs( 0.512358555626676 - x[1] ) < 1e-15 );  // Arithmetic errors
			chai.assert.equal( true, Math.abs( 0.021126480583579 - x[2] ) < 1e-15 );  // Arithmetic errors
		});
		it( "should be solved in 20 iterations", function() {
			chai.assert.equal( 20, optim.iters );
		});
	});
});
