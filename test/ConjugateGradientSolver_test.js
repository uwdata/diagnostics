
// Node.js: Load required libraries
if ( typeof require !== "undefined" ) {
	chai = require( "chai" );
	ConjugateGradientSolver = require( "../client_src/js/ConjugateGradientSolver.js" ).ConjugateGradientSolver;
}

describe( "ConjugateGradientSolver:", function() {
	
	var I = [
				{ i : 0, j : 0, value : 1 },
				{ i : 1, j : 1, value : 1 }
			];
	var A = [
				{ i : 0, j : 0, value : 2 },
				{ i : 0, j : 1, value : 5 },
				{ i : 1, j : 1, value : 1 },
				{ i : 1, j : 2, value : 1 }
			];
	var B = [ 5, 2 ];

	describe( "Solve for min || I * x - B ||", function() {
		var cg = new ConjugateGradientSolver();
		var x = cg.solve( 2, 3, I, B );
		
		it( "should be a vector of length 3.", function() {
			chai.assert.equal( 3, x.length );
		});
		it( "should contain values [ 5, 2, 0 ].", function() {
			chai.assert.equal( true, Math.abs( 5 - x[0] ) < 1e-15 );  // Arithmetic errors
			chai.assert.equal( true, Math.abs( 2 - x[1] ) < 1e-15 );  // Arithmetic errors
			chai.assert.equal( true, Math.abs( 0 - x[2] ) < 1e-15 );  // Arithmetic errors
		});
		it( "should be solved in 1 iteration", function() {
			chai.assert.equal( 1, cg.iters );
		});
	});
	
	describe( "Solve for min || A * x - B ||", function() {
		var cg = new ConjugateGradientSolver();
		var x = cg.solve( 2, 3, A, B );

		it( "should be a vector of length 3.", function() {
			chai.assert.equal( 3, x.length );
		});
		it( "should contain values [ 0, 1, 1 ].", function() {
			chai.assert.equal( true, Math.abs( 0 - x[0] ) < 1e-15 );  // Arithmetic errors
			chai.assert.equal( true, Math.abs( 1 - x[1] ) < 1e-15 );  // Arithmetic errors
			chai.assert.equal( true, Math.abs( 1 - x[2] ) < 1e-15 );  // Arithmetic errors
		});
		it( "should be solved in 2 iterations", function() {
			chai.assert.equal( 2, cg.iters );
		});
	});
});
