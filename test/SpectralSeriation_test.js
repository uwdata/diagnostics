
// Node.js: Load required libraries
if ( typeof require !== "undefined" ) {
	chai = require( "chai" );
	SpectralSeriation = require( "../client_src/js/SpectralSeriation.js" ).SpectralSeriation;
}

describe( "SpectralSeriation #1:", function() {

	// A = [ 1 0 0.4 0 ; 0 1 0.3 0 ; 0.4 0.3 0.1 0.05 ; 0 0 0.05 1 ];
	var A = [
		{ i : 0, j : 0, value : 1    },
		{ i : 0, j : 2, value : 0.4  },
		{ i : 1, j : 1, value : 1    },
		{ i : 1, j : 2, value : 0.3  },
		{ i : 2, j : 0, value : 0.4  },
		{ i : 2, j : 1, value : 0.3  },
		{ i : 2, j : 2, value : 0.1  },
		{ i : 2, j : 3, value : 0.05 },
		{ i : 3, j : 2, value : 0.05 },
		{ i : 3, j : 3, value : 1    },
	];
	
	describe( "First matrix", function() {
		it( "should be a 4 × 4 matrix with 10 non-zero entries.", function() {
			chai.assert.equal( 10, A.length );
			chai.assert.equal( 1, A[0].value );
			chai.assert.equal( 0.4, A[1].value );
			chai.assert.equal( 1, A[2].value );
			chai.assert.equal( 0.3, A[3].value );
			chai.assert.equal( 0.4, A[4].value );
			chai.assert.equal( 0.3, A[5].value );
			chai.assert.equal( 0.1, A[6].value );
			chai.assert.equal( 0.05, A[7].value );
			chai.assert.equal( 0.05, A[8].value );
			chai.assert.equal( 1, A[9].value );
		});
	});
	
	describe( "Fiedler value", function() {
		for ( var iter = 0; iter < 10; iter ++ )
		{
			it( "should equal 0.064427972770667.", function() {
				var seriation = new SpectralSeriation();
				seriation.compute( 4, A );
				chai.assert.equal( true, Math.abs( 0.064427972770667 - seriation.fiedler_value ) < 1e-4 );
			});
		}
	});

	describe( "Seriated indexes", function() {
		for ( var iter = 0; iter < 10; iter ++ )
		{
			it( "should equal [1, 0, 2, 3] or [3, 2, 0, 1].", function() {
				var seriation = new SpectralSeriation();
				var indexes = seriation.compute( 4, A );
				chai.assert.equal( 4, indexes.length );
				if ( indexes[0] == 1 )
				{
					chai.assert.equal( 1, indexes[0] );
					chai.assert.equal( 0, indexes[1] );
					chai.assert.equal( 2, indexes[2] );
					chai.assert.equal( 3, indexes[3] );
				}
				else
				{
					chai.assert.equal( 1, indexes[3] );
					chai.assert.equal( 0, indexes[2] );
					chai.assert.equal( 2, indexes[1] );
					chai.assert.equal( 3, indexes[0] );
				}
			});
		}
	});
});

describe( "SpectralSeriation #2:", function() {
	var A = [
		{ i : 0, j : 0, value : 1 },
		{ i : 1, j : 0, value : 1 },
		{ i : 4, j : 0, value : 1 },
		{ i : 0, j : 1, value : 1 },
		{ i : 1, j : 1, value : 1 },
		{ i : 6, j : 1, value : 1 },
		{ i : 2, j : 2, value : 1 },
		{ i : 5, j : 2, value : 1 },
		{ i : 3, j : 3, value : 1 },
		{ i : 4, j : 3, value : 1 },
		{ i : 0, j : 4, value : 1 },
		{ i : 3, j : 4, value : 1 },
		{ i : 4, j : 4, value : 1 },
		{ i : 2, j : 5, value : 1 },
		{ i : 5, j : 5, value : 1 },
		{ i : 6, j : 5, value : 1 },
		{ i : 1, j : 6, value : 1 },
		{ i : 5, j : 6, value : 1 },
		{ i : 6, j : 6, value : 1 },
	];
	describe( "First matrix", function() {
		it( "should be a 7 × 7 matrix with 19 non-zero entries.", function() {
			chai.assert.equal( 19, A.length );
			for ( var i = 0; i < 19; i++ )
				chai.assert.equal( 1, A[i].value );
		});
	});
	
	describe( "Fiedler value", function() {
		for ( var iter = 0; iter < 10; iter ++ )
		{
			it( "should equal 0.198062510068208.", function() {
				var seriation = new SpectralSeriation();
				seriation.compute( 7, A );
				chai.assert.equal( true, Math.abs( 0.198062510068208 - seriation.fiedler_value ) < 1e-4 );
			});
		}
	});
	
	describe( "Seriated indexes", function() {
		for ( var iter = 0; iter < 10; iter ++ )
		{
			it( "should equal [2 5 6 1 0 4 3] or [3 4 0 1 6 5 2].", function() {
				var seriation = new SpectralSeriation();
				var indexes = seriation.compute( 7, A );
				chai.assert.equal( 7, indexes.length );
				if ( indexes[0] == 2 )
				{
					chai.assert.equal( 2, indexes[0] );
					chai.assert.equal( 5, indexes[1] );
					chai.assert.equal( 6, indexes[2] );
					chai.assert.equal( 1, indexes[3] );
					chai.assert.equal( 0, indexes[4] );
					chai.assert.equal( 4, indexes[5] );
					chai.assert.equal( 3, indexes[6] );
				}
				else
				{
					chai.assert.equal( 2, indexes[6] );
					chai.assert.equal( 5, indexes[5] );
					chai.assert.equal( 6, indexes[4] );
					chai.assert.equal( 1, indexes[3] );
					chai.assert.equal( 0, indexes[2] );
					chai.assert.equal( 4, indexes[1] );
					chai.assert.equal( 3, indexes[0] );
				}
			});
		}
	});
	

});
