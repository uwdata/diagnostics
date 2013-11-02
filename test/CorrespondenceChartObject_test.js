
// Node.js: Load required libraries
if ( typeof require !== "undefined" ) {
	chai = require( "chai" );
	SpectralSeriation = require( "../client_src/js/SpectralSeriation.js" ).SpectralSeriation;
	CorrespondenceChartObject = require( "../client_src/js/CorrespondenceChartObject.js" ).CorrespondenceChartObject;
}

describe( "CorrespondenceChartObject:", function() {
	
	var data = [ [ 11, 13 ], [ 17, 19, 23, 29 ] ];
	var rows = [ "concept A", "concept B", "concept C" ];
	var columns = [ "topic A", "topic B", "topic C" ];
	var rowOrdering2 = [ 1, 0 ];
	var columnOrdering4 = [ 2, 3, 0, 1 ];
	var rowOrdering4 = [ 1, 2, 0, 3 ];
	var columnOrdering6 = [ 2, 3, 0, 1, 5, 4 ];
	var rowMatchProbs = [ [ 0.45, 0.55 ], [ 0.6, 0.3, 0.1 ] ];

	describe( "An empty matrix", function() {
		var matrix = new CorrespondenceChartObject();

	    it( "should have 0 rows", function() {
			chai.assert.equal( 0, matrix.get( "rowDims" ) );
		});
	    it( "should have 0 columns", function() {
			chai.assert.equal( 0, matrix.get( "columnDims" ) );
		});
	    it( "should have 0 non-zero cells as a sparse matrix", function() {
			chai.assert.equal( 0, matrix.get( "sparseMatrix" ).length );
		});
	    it( "should be a 0-by-0 full matrix", function() {
			chai.assert.equal( 0, matrix.get( "fullMatrix" ).length );
		});
	});
	
	describe( "A test matrix (2 × 4)", function() {
		var matrix = new CorrespondenceChartObject()
			.importMatrix( data )
			.setLabels( rows, columns );

	    it( "should have 2 rows", function() {
			chai.assert.equal( 2, matrix.get( "rowDims" ) );
		});
	    it( "should have 4 columns", function() {
			chai.assert.equal( 4, matrix.get( "columnDims" ) );
		});
	    it( "should be a 2-by-4 full matrix", function() {
			chai.assert.equal( 2, matrix.get( "fullMatrix" ).length );
			for ( var i = 0; i < 2; i++ )
				chai.assert.equal( 4, matrix.get( "fullMatrix" )[i].length );
			chai.assert.equal( 11, matrix.get( "fullMatrix" )[0][0].value );
			chai.assert.equal( 13, matrix.get( "fullMatrix" )[0][1].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[0][2].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[0][3].value );
			chai.assert.equal( 17, matrix.get( "fullMatrix" )[1][0].value );
			chai.assert.equal( 19, matrix.get( "fullMatrix" )[1][1].value );
			chai.assert.equal( 23, matrix.get( "fullMatrix" )[1][2].value );
			chai.assert.equal( 29, matrix.get( "fullMatrix" )[1][3].value );
		});
	    it( "should have 6 non-zero cells as a sparse matrix", function() {
			chai.assert.equal( 6, matrix.get( "sparseMatrix" ).length );
			chai.assert.equal( 29, matrix.get( "sparseMatrix" )[0].value );
			chai.assert.equal( 23, matrix.get( "sparseMatrix" )[1].value );
			chai.assert.equal( 19, matrix.get( "sparseMatrix" )[2].value );
			chai.assert.equal( 17, matrix.get( "sparseMatrix" )[3].value );
			chai.assert.equal( 13, matrix.get( "sparseMatrix" )[4].value );
			chai.assert.equal( 11, matrix.get( "sparseMatrix" )[5].value );
		});
	    it( "should have 2 row labels", function() {
			chai.assert.equal( 2, matrix.get( "rowLabels" ).length );
			chai.assert.equal( "concept A", matrix.get( "rowLabels" )[0].label );
			chai.assert.equal( "concept B", matrix.get( "rowLabels" )[1].label );
		});
	    it( "should have 4 column labels", function() {
			chai.assert.equal( 4, matrix.get( "columnLabels" ).length );
			chai.assert.equal( "topic A" , matrix.get( "columnLabels" )[0].label );
			chai.assert.equal( "topic B" , matrix.get( "columnLabels" )[1].label );
			chai.assert.equal( "topic C" , matrix.get( "columnLabels" )[2].label );
			chai.assert.equal( "Column #4", matrix.get( "columnLabels" )[3].label );
		});
	});

	describe( "A test matrix with row ordering (2 × 4)", function() {
		var matrix = new CorrespondenceChartObject()
			.importMatrix( data )
			.setLabels( rows, columns )
			.setOrdering( rowOrdering2, null );

	    it( "should have 2 rows", function() {
			chai.assert.equal( 2, matrix.get( "rowDims" ) );
		});
	    it( "should have 4 columns", function() {
			chai.assert.equal( 4, matrix.get( "columnDims" ) );
		});
	    it( "should be a 2-by-4 full matrix", function() {
			chai.assert.equal( 2, matrix.get( "fullMatrix" ).length );
			for ( var i = 0; i < 2; i++ )
				chai.assert.equal( 4, matrix.get( "fullMatrix" )[i].length );
			chai.assert.equal( 11, matrix.get( "fullMatrix" )[0][0].value );
			chai.assert.equal( 13, matrix.get( "fullMatrix" )[0][1].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[0][2].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[0][3].value );
			chai.assert.equal( 17, matrix.get( "fullMatrix" )[1][0].value );
			chai.assert.equal( 19, matrix.get( "fullMatrix" )[1][1].value );
			chai.assert.equal( 23, matrix.get( "fullMatrix" )[1][2].value );
			chai.assert.equal( 29, matrix.get( "fullMatrix" )[1][3].value );
		});
	    it( "should have 6 non-zero cells as a sparse matrix", function() {
			chai.assert.equal( 6, matrix.get( "sparseMatrix" ).length );
			chai.assert.equal( 29, matrix.get( "sparseMatrix" )[0].value );
			chai.assert.equal( 23, matrix.get( "sparseMatrix" )[1].value );
			chai.assert.equal( 19, matrix.get( "sparseMatrix" )[2].value );
			chai.assert.equal( 17, matrix.get( "sparseMatrix" )[3].value );
			chai.assert.equal( 13, matrix.get( "sparseMatrix" )[4].value );
			chai.assert.equal( 11, matrix.get( "sparseMatrix" )[5].value );
		});
	    it( "should have 2 row labels", function() {
			chai.assert.equal( 2, matrix.get( "rowLabels" ).length );
			chai.assert.equal( "concept A", matrix.get( "rowLabels" )[0].label );
			chai.assert.equal( "concept B", matrix.get( "rowLabels" )[1].label );
			chai.assert.equal( 1, matrix.get( "rowLabels" )[0].position );
			chai.assert.equal( 0, matrix.get( "rowLabels" )[1].position );
		});
	    it( "should have 4 column labels", function() {
			chai.assert.equal( 4, matrix.get( "columnLabels" ).length );
			chai.assert.equal( "topic A" , matrix.get( "columnLabels" )[0].label );
			chai.assert.equal( "topic B" , matrix.get( "columnLabels" )[1].label );
			chai.assert.equal( "topic C" , matrix.get( "columnLabels" )[2].label );
			chai.assert.equal( "Column #4", matrix.get( "columnLabels" )[3].label );
		});
	});

	describe( "A test matrix with column ordering (2 × 4)", function() {
		var matrix = new CorrespondenceChartObject()
			.importMatrix( data )
			.setLabels( rows, columns )
			.setOrdering( null, columnOrdering4 );

	    it( "should have 2 rows", function() {
			chai.assert.equal( 2, matrix.get( "rowDims" ) );
		});
	    it( "should have 4 columns", function() {
			chai.assert.equal( 4, matrix.get( "columnDims" ) );
		});
	    it( "should be a 2-by-4 full matrix", function() {
			chai.assert.equal( 2, matrix.get( "fullMatrix" ).length );
			for ( var i = 0; i < 2; i++ )
				chai.assert.equal( 4, matrix.get( "fullMatrix" )[i].length );
			chai.assert.equal( 11, matrix.get( "fullMatrix" )[0][0].value );
			chai.assert.equal( 13, matrix.get( "fullMatrix" )[0][1].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[0][2].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[0][3].value );
			chai.assert.equal( 17, matrix.get( "fullMatrix" )[1][0].value );
			chai.assert.equal( 19, matrix.get( "fullMatrix" )[1][1].value );
			chai.assert.equal( 23, matrix.get( "fullMatrix" )[1][2].value );
			chai.assert.equal( 29, matrix.get( "fullMatrix" )[1][3].value );
		});
	    it( "should have 6 non-zero cells as a sparse matrix", function() {
			chai.assert.equal( 6, matrix.get( "sparseMatrix" ).length );
			chai.assert.equal( 29, matrix.get( "sparseMatrix" )[0].value );
			chai.assert.equal( 23, matrix.get( "sparseMatrix" )[1].value );
			chai.assert.equal( 19, matrix.get( "sparseMatrix" )[2].value );
			chai.assert.equal( 17, matrix.get( "sparseMatrix" )[3].value );
			chai.assert.equal( 13, matrix.get( "sparseMatrix" )[4].value );
			chai.assert.equal( 11, matrix.get( "sparseMatrix" )[5].value );
		});
	    it( "should have 2 row labels", function() {
			chai.assert.equal( 2, matrix.get( "rowLabels" ).length );
			chai.assert.equal( "concept A", matrix.get( "rowLabels" )[0].label );
			chai.assert.equal( "concept B", matrix.get( "rowLabels" )[1].label );
		});
	    it( "should have 4 column labels", function() {
			chai.assert.equal( 4, matrix.get( "columnLabels" ).length );
			chai.assert.equal( "topic A" , matrix.get( "columnLabels" )[0].label );
			chai.assert.equal( "topic B", matrix.get( "columnLabels" )[1].label );
			chai.assert.equal( "topic C", matrix.get( "columnLabels" )[2].label );
			chai.assert.equal( "Column #4" , matrix.get( "columnLabels" )[3].label );
			chai.assert.equal( 2, matrix.get( "columnLabels" )[0].position );
			chai.assert.equal( 3, matrix.get( "columnLabels" )[1].position );
			chai.assert.equal( 0, matrix.get( "columnLabels" )[2].position );
			chai.assert.equal( 1, matrix.get( "columnLabels" )[3].position );
		});
	});

	describe( "A resized test matrix (4 × 6)", function() {
		var matrix = new CorrespondenceChartObject()
			.importMatrix( data, 4, 6 )
			.setLabels( rows, columns )
			.setOrdering( rowOrdering4, columnOrdering6 )
			.setMatchProbs( rowMatchProbs, null );

	    it( "should have 4 rows", function() {
			chai.assert.equal( 4, matrix.get( "rowDims" ) );
		});
	    it( "should have 6 columns", function() {
			chai.assert.equal( 6, matrix.get( "columnDims" ) );
		});
	    it( "should be a 4-by-6 full matrix", function() {
			chai.assert.equal( 4, matrix.get( "fullMatrix" ).length );
			for ( var i = 0; i < 4; i++ )
				chai.assert.equal( 6, matrix.get( "fullMatrix" )[i].length );
			chai.assert.equal( 11, matrix.get( "fullMatrix" )[0][0].value );
			chai.assert.equal( 13, matrix.get( "fullMatrix" )[0][1].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[0][2].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[0][3].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[0][4].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[0][5].value );			

			chai.assert.equal( 17, matrix.get( "fullMatrix" )[1][0].value );
			chai.assert.equal( 19, matrix.get( "fullMatrix" )[1][1].value );
			chai.assert.equal( 23, matrix.get( "fullMatrix" )[1][2].value );
			chai.assert.equal( 29, matrix.get( "fullMatrix" )[1][3].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[1][4].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[1][5].value );

			chai.assert.equal(  0, matrix.get( "fullMatrix" )[2][0].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[2][1].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[2][2].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[2][3].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[2][4].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[2][5].value );

			chai.assert.equal(  0, matrix.get( "fullMatrix" )[3][0].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[3][1].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[3][2].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[3][3].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[3][4].value );
			chai.assert.equal(  0, matrix.get( "fullMatrix" )[3][5].value );
		});
	    it( "should have 6 non-zero cells as a sparse matrix", function() {
			chai.assert.equal( 6, matrix.get( "sparseMatrix" ).length );
			chai.assert.equal( 29, matrix.get( "sparseMatrix" )[0].value );
			chai.assert.equal( 23, matrix.get( "sparseMatrix" )[1].value );
			chai.assert.equal( 19, matrix.get( "sparseMatrix" )[2].value );
			chai.assert.equal( 17, matrix.get( "sparseMatrix" )[3].value );
			chai.assert.equal( 13, matrix.get( "sparseMatrix" )[4].value );
			chai.assert.equal( 11, matrix.get( "sparseMatrix" )[5].value );

			chai.assert.equal( 1, matrix.get( "sparseMatrix" )[0].rowIndex );
			chai.assert.equal( 1, matrix.get( "sparseMatrix" )[1].rowIndex );
			chai.assert.equal( 1, matrix.get( "sparseMatrix" )[2].rowIndex );
			chai.assert.equal( 1, matrix.get( "sparseMatrix" )[3].rowIndex );
			chai.assert.equal( 0, matrix.get( "sparseMatrix" )[4].rowIndex );
			chai.assert.equal( 0, matrix.get( "sparseMatrix" )[5].rowIndex );

			chai.assert.equal( 3, matrix.get( "sparseMatrix" )[0].columnIndex );
			chai.assert.equal( 2, matrix.get( "sparseMatrix" )[1].columnIndex );
			chai.assert.equal( 1, matrix.get( "sparseMatrix" )[2].columnIndex );
			chai.assert.equal( 0, matrix.get( "sparseMatrix" )[3].columnIndex );
			chai.assert.equal( 1, matrix.get( "sparseMatrix" )[4].columnIndex );
			chai.assert.equal( 0, matrix.get( "sparseMatrix" )[5].columnIndex );

			chai.assert.equal( 0, matrix.get( "sparseMatrix" )[0].rowPosition );
			chai.assert.equal( 0, matrix.get( "sparseMatrix" )[1].rowPosition );
			chai.assert.equal( 0, matrix.get( "sparseMatrix" )[2].rowPosition );
			chai.assert.equal( 0, matrix.get( "sparseMatrix" )[3].rowPosition );
			chai.assert.equal( 2, matrix.get( "sparseMatrix" )[4].rowPosition );
			chai.assert.equal( 2, matrix.get( "sparseMatrix" )[5].rowPosition );

			chai.assert.equal( 1, matrix.get( "sparseMatrix" )[0].columnPosition );
			chai.assert.equal( 0, matrix.get( "sparseMatrix" )[1].columnPosition );
			chai.assert.equal( 3, matrix.get( "sparseMatrix" )[2].columnPosition );
			chai.assert.equal( 2, matrix.get( "sparseMatrix" )[3].columnPosition );
			chai.assert.equal( 3, matrix.get( "sparseMatrix" )[4].columnPosition );
			chai.assert.equal( 2, matrix.get( "sparseMatrix" )[5].columnPosition );
		});
	    it( "should have 4 row labels", function() {
			chai.assert.equal( 4, matrix.get( "rowLabels" ).length );
			chai.assert.equal( "concept A", matrix.get( "rowLabels" )[0].label );
			chai.assert.equal( "concept B", matrix.get( "rowLabels" )[1].label );
			chai.assert.equal( "concept C", matrix.get( "rowLabels" )[2].label );
			chai.assert.equal( "Row #4" , matrix.get( "rowLabels" )[3].label );
			chai.assert.equal( 2, matrix.get( "rowLabels" )[0].position );
			chai.assert.equal( 0, matrix.get( "rowLabels" )[1].position );
			chai.assert.equal( 1, matrix.get( "rowLabels" )[2].position );
			chai.assert.equal( 3, matrix.get( "rowLabels" )[3].position );
		});
	    it( "should have 6 column labels", function() {
			chai.assert.equal( 6, matrix.get( "columnLabels" ).length );
			chai.assert.equal( "topic A" , matrix.get( "columnLabels" )[0].label );
			chai.assert.equal( "topic B", matrix.get( "columnLabels" )[1].label );
			chai.assert.equal( "topic C" , matrix.get( "columnLabels" )[2].label );
			chai.assert.equal( "Column #4" , matrix.get( "columnLabels" )[3].label );
			chai.assert.equal( "Column #5", matrix.get( "columnLabels" )[4].label );
			chai.assert.equal( "Column #6", matrix.get( "columnLabels" )[5].label );
			chai.assert.equal( 2, matrix.get( "columnLabels" )[0].position );
			chai.assert.equal( 3, matrix.get( "columnLabels" )[1].position );
			chai.assert.equal( 0, matrix.get( "columnLabels" )[2].position );
			chai.assert.equal( 1, matrix.get( "columnLabels" )[3].position );
			chai.assert.equal( 5, matrix.get( "columnLabels" )[4].position );
			chai.assert.equal( 4, matrix.get( "columnLabels" )[5].position );
		});
	    it( "should have 4 sets of row matching probabilities", function() {
			chai.assert.equal( 4, matrix.get( "rowMatchProbs" ).length );
			chai.assert.equal( 2, matrix.get( "rowMatchProbs" )[0].matchProbs.length );
			chai.assert.equal( 3, matrix.get( "rowMatchProbs" )[1].matchProbs.length );
			chai.assert.equal( 1, matrix.get( "rowMatchProbs" )[2].matchProbs.length );
			chai.assert.equal( 1, matrix.get( "rowMatchProbs" )[3].matchProbs.length );
			chai.assert.equal( 0.45, matrix.get( "rowMatchProbs" )[0].matchProbs[0] );
			chai.assert.equal( 0.55, matrix.get( "rowMatchProbs" )[0].matchProbs[1] );
			chai.assert.equal( 0.6 , matrix.get( "rowMatchProbs" )[1].matchProbs[0] );
			chai.assert.equal( 0.3 , matrix.get( "rowMatchProbs" )[1].matchProbs[1] );
			chai.assert.equal( 0.1 , matrix.get( "rowMatchProbs" )[1].matchProbs[2] );
			chai.assert.equal( 1   , matrix.get( "rowMatchProbs" )[2].matchProbs[0] );
			chai.assert.equal( 1   , matrix.get( "rowMatchProbs" )[3].matchProbs[0] );
		});
	    it( "should have 6 sets of column matching probabilities", function() {
			chai.assert.equal( 6, matrix.get( "columnMatchProbs" ).length );
			for ( var i = 0; i < 6; i++ )
			{
				chai.assert.equal( 1, matrix.get( "columnMatchProbs" )[i].matchProbs.length );
				chai.assert.equal( 1, matrix.get( "columnMatchProbs" )[i].matchProbs[0] );
			}
		});
	});
});
