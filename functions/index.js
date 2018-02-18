'use strict';

const functions = require('firebase-functions');

exports.helloWorld = functions.https.onRequest((request, response) => {

 response.send("Hello from Firebase, it's Peter");

});

//exports.readTicTacToeBoard = functions.database.ref ('board').onWrite(
//
//  (event) => {
//
//      const previousBoard = event.data.previous;
//
//      if (previousBoard.exists()) {
//
//          console.log('readTicTacToeBoard', 'Yeahhhhh ... there is old data !!!!');
//          dumpBoard2(previousBoard.val(), 'this is the OLD board !!!');
//      }
//
//      const currentBoard = event.data.current.val();
//      dumpBoard2(currentBoard, '...  and this is the NEW board');
//
//      return Promise.resolve();
//  }
//);

exports.readTicTacToeBoard = functions.database.ref ('board').onWrite(

  (event) => {

    const previousBoard = event.data.previous;

    if (previousBoard.exists()) {

      console.log('readTicTacToeBoard', 'Yeahhhhh ... there is old data !!!!');
      var prevArray = boardToArray(previousBoard.val());
      console.log('readTicTacToeBoard', 'Result (1) ' + prevArray);
    }

    const currentBoard = event.data.current.val();
    var currArray = boardToArray(currentBoard);
    console.log('readTicTacToeBoard', 'Result (2) ' + currArray);

    return Promise.resolve();
  }
);

// just another function
function doSomething() {

    return Promise.resolve();

}

// just another function


function dumpBoard2(board, title) {

    console.log('readTicTacToeBoard', title);

    const elem11 = board.row1.col1.state;
    const elem12 = board.row1.col2.state;
    const elem13 = board.row1.col3.state;

    const elem21 = board.row2.col1.state;
    const elem22 = board.row2.col2.state;
    const elem23 = board.row2.col3.state;

    const elem31 = board.row3.col1.state;
    const elem32 = board.row3.col2.state;
    const elem33 = board.row3.col3.state;

    console.log('readTicTacToeBoard', 'elem11 ' + elem11);
    console.log('readTicTacToeBoard', 'elem12 ' + elem12);
    console.log('readTicTacToeBoard', 'elem13 ' + elem13);

    console.log('readTicTacToeBoard', 'elem21 ' + elem21);
    console.log('readTicTacToeBoard', 'elem21 ' + elem22);
    console.log('readTicTacToeBoard', 'elem21 ' + elem23);

    console.log('readTicTacToeBoard', 'elem31 ' + elem31);
    console.log('readTicTacToeBoard', 'elem31 ' + elem32);
    console.log('readTicTacToeBoard', 'elem31 ' + elem33);

    return;
}

function boardToArray(board) {

    const elem11 = board.row1.col1.state;
    const elem12 = board.row1.col2.state;
    const elem13 = board.row1.col3.state;

    const elem21 = board.row2.col1.state;
    const elem22 = board.row2.col2.state;
    const elem23 = board.row2.col3.state;

    const elem31 = board.row3.col1.state;
    const elem32 = board.row3.col2.state;
    const elem33 = board.row3.col3.state;

//    console.log('readTicTacToeBoard', 'elem11 ' + elem11);
//    console.log('readTicTacToeBoard', 'elem12 ' + elem12);
//    console.log('readTicTacToeBoard', 'elem13 ' + elem13);
//
//    console.log('readTicTacToeBoard', 'elem21 ' + elem21);
//    console.log('readTicTacToeBoard', 'elem21 ' + elem22);
//    console.log('readTicTacToeBoard', 'elem21 ' + elem23);
//
//    console.log('readTicTacToeBoard', 'elem31 ' + elem31);
//    console.log('readTicTacToeBoard', 'elem31 ' + elem32);
//    console.log('readTicTacToeBoard', 'elem31 ' + elem33);

    var boardAsArray = [ [elem11, elem12, elem13], [elem21, elem22, elem23], [elem31, elem32, elem33]  ];

    return boardAsArray;
}


//function dumpBoard(board) {
//
//    // GEHT ... aber alte Fassung
//
//    console.log('readTicTacToeBoard', 'Dump of Board:');
//
//    const firstRow = board.row1;
//    const secondRow = board.row2;
//    const thirdRow = board.row3;
//
//    const elem11 = firstRow.col1.state;
//    const elem12 = firstRow.col2.state;
//    const elem13 = firstRow.col3.state;
//
//    console.log('readTicTacToeBoard', elem11);
//    console.log('readTicTacToeBoard', elem12);
//    console.log('readTicTacToeBoard', elem13);
//
//    const elem21 = secondRow.col1.state;
//    const elem22 = secondRow.col2.state;
//    const elem23 = secondRow.col3.state;
//
//    console.log('readTicTacToeBoard', elem21);
//    console.log('readTicTacToeBoard', elem22);
//    console.log('readTicTacToeBoard', elem23);
//
//    const elem31 = thirdRow.col1.state;
//    const elem32 = thirdRow.col2.state;
//    const elem33 = thirdRow.col3.state;
//
//    console.log('readTicTacToeBoard', elem31);
//    console.log('readTicTacToeBoard', elem32);
//    console.log('readTicTacToeBoard', elem33);
//}
