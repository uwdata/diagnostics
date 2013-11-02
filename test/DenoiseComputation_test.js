
// Node.js: Load required libraries
if ( typeof require !== "undefined" ) {
	chai = require( "chai" );
	DenoiseComputation = require( "../client_src/js/DenoiseComputation.js" ).DenoiseComputation;
}

describe( "DenoiseComputation:", function() {

	var observed = [ 0.2, 0.3, 0.2, 0.1, 0.1, 0.1 ];
	var identity = [ 1.0, 0, 0, 0, 0, 0 ];
	var slight = [ 0.8, 0.2, 0, 0, 0, 0 ];
	var split = [ 0.5, 0.5, 0, 0, 0, 0 ];
	var noisy = [ 0.5, 0.3, 0.1, 0.05, 0.05, 0 ];
	var shift = [ 0.05, 0.8, 0.05, 0.05, 0.05, 0 ];

	describe( "Identity (no noise condition)", function() {
		var denoiseComputation = new DenoiseComputation();
		var x = denoiseComputation.solve( observed, identity );

		it( "should be a vector [ 0.2, 0.3, 0.2, 0.1, 0.1, 0.1 ] of length 6.", function() {
			chai.assert.equal( 6, x.length );
			chai.assert.equal( true, Math.abs( 0.2 - x[0] ) < 1e-2 );
			chai.assert.equal( true, Math.abs( 0.3 - x[1] ) < 1e-2 );
			chai.assert.equal( true, Math.abs( 0.2 - x[2] ) < 1e-2 );
			chai.assert.equal( true, Math.abs( 0.1 - x[3] ) < 1e-2 );
			chai.assert.equal( true, Math.abs( 0.1 - x[4] ) < 1e-2 );
			chai.assert.equal( true, Math.abs( 0.1 - x[5] ) < 1e-2 );
		});
		it( "should be solved in 3 iterations", function() {
			chai.assert.equal( 1, denoiseComputation.iters );
		});
	});

	describe( "Slight noise (80-20 noise condition)", function() {
		var denoiseComputation = new DenoiseComputation();
		var x = denoiseComputation.solve( observed, slight );

		it( "should be a vector [ 0.25, 0.31, 0.17, 0.08, 0.10, 0.08 ] of length 6.", function() {
			chai.assert.equal( 6, x.length );
			chai.assert.equal( true, Math.abs( 0.24813400694427695 - x[0] ) < 1e-8 );
			chai.assert.equal( true, Math.abs( 0.314953329995151   - x[1] ) < 1e-8 );
			chai.assert.equal( true, Math.abs( 0.1713532924474074  - x[2] ) < 1e-8 );
			chai.assert.equal( true, Math.abs( 0.08201908392501593 - x[3] ) < 1e-8 );
			chai.assert.equal( true, Math.abs( 0.1044829325591843  - x[4] ) < 1e-8 );
			chai.assert.equal( true, Math.abs( 0.07905735412896409 - x[5] ) < 1e-8 );
		});
		it( "should be solved in 8 iterations", function() {
			chai.assert.equal( 8, denoiseComputation.iters );
		});
	});

	describe( "Split (50-50 noise condition)", function() {
		var denoiseComputation = new DenoiseComputation();
		var x = denoiseComputation.solve( observed, split );

		it( "should be a vector [ 0.37, 0.26, 0.12, 0.09, 0.10, 0.05 ] of length 6.", function() {
			chai.assert.equal( 6, x.length );
			chai.assert.equal( true, Math.abs( 0.37475566909508934 - x[0] ) < 1e-8 );
			chai.assert.equal( true, Math.abs( 0.2644572236783783  - x[1] ) < 1e-8 );
			chai.assert.equal( true, Math.abs( 0.11643204497357058 - x[2] ) < 1e-8 );
			chai.assert.equal( true, Math.abs( 0.0914362688806511  - x[3] ) < 1e-8 );
			chai.assert.equal( true, Math.abs( 0.10464233860698824 - x[4] ) < 1e-8 );
			chai.assert.equal( true, Math.abs( 0.04827645476532201 - x[5] ) < 1e-8 );
		});
		it( "should be solved in 20 iterations", function() {
			chai.assert.equal( 20, denoiseComputation.iters );
		});
	});

	describe( "Noisy (50-30-10-5-5 noise condition)", function() {
		var denoiseComputation = new DenoiseComputation();
		var x = denoiseComputation.solve( observed, noisy );

		it( "should be a vector [ 0.39, 0.38, 0.09, 0.03, 0.08, 0.02 ] of length 6.", function() {
			chai.assert.equal( 6, x.length );
			chai.assert.equal( true, Math.abs( 0.38851965481136924  - x[0] ) < 1e-8 );
			chai.assert.equal( true, Math.abs( 0.3822841747716928   - x[1] ) < 1e-8 );
			chai.assert.equal( true, Math.abs( 0.08863980248600717  - x[2] ) < 1e-8 );
			chai.assert.equal( true, Math.abs( 0.033253816793290175 - x[3] ) < 1e-8 );
			chai.assert.equal( true, Math.abs( 0.08370033385253697  - x[4] ) < 1e-8 );
			chai.assert.equal( true, Math.abs( 0.023602217285104008 - x[5] ) < 1e-8 );
		});
		it( "should be solved in 20 iterations", function() {
			chai.assert.equal( 20, denoiseComputation.iters );
		});
	});

	describe( "Noisy (5-80-5-5-5 noise condition)", function() {
		var denoiseComputation = new DenoiseComputation();
		var x = denoiseComputation.solve( observed, shift );

		it( "should be a vector [ 0.48, 0.25, 0.09, 0.09, 0.03, 0.05 ] of length 6.", function() {
			chai.assert.equal( 6, x.length );
			chai.assert.equal( true, Math.abs( 0.4808927618313467   - x[0] ) < 1e-8 );
			chai.assert.equal( true, Math.abs( 0.2528718164683509   - x[1] ) < 1e-8 );
			chai.assert.equal( true, Math.abs( 0.09331076279490987  - x[2] ) < 1e-8 );
			chai.assert.equal( true, Math.abs( 0.09105095024699476  - x[3] ) < 1e-8 );
			chai.assert.equal( true, Math.abs( 0.03416341742270126  - x[4] ) < 1e-8 );
			chai.assert.equal( true, Math.abs( 0.047710291235696436 - x[5] ) < 1e-8 );
		});
		it( "should be solved in 18 iterations", function() {
			chai.assert.equal( 18, denoiseComputation.iters );
		});
	});
});
