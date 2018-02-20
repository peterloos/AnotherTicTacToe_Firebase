'use strict';

const GameStoneX = "X";
const GameStoneO = "O";
const GameStoneEmpty = "Empty";

const functions = require('firebase-functions');

exports.helloWorld = functions.https.onRequest((request, response) => {

    response.send("Hello from Firebase, it's Peter");

});

// ERSTE VARIANTE -- GEHT --- HALT MAL AUFHEBEN ....
//exports.readTicTacToeBoard = functions.database.ref ('board').onWrite(
//
//    (event) => {
//
//        const previousBoard = event.data.previous;
//        var prevArray = boardToArray(previousBoard.val());
//        console.log('readTicTacToeBoard', 'Result (1) ' + prevArray);
//
//        const currentBoard = event.data.current.val();
//        var currArray = boardToArray(currentBoard);
//        console.log('readTicTacToeBoard', 'Result (2) ' + currArray);
//
//        var lastMovedStone = searchLastMove (prevArray, currArray);
//
//        if (lastMovedStone.row !== -1) {
//
//            console.log('readTicTacToeBoard', 'LAST STONE: row=' + lastMovedStone.row + ', col=' + lastMovedStone.col + ', stone=' + lastMovedStone.stone);
//        }
//        else {
//
//            console.log('readTicTacToeBoard', 'LAST STONE UNKNONW');
//        }
//
//        return Promise.resolve(1);
//    }
//);


exports.readTicTacToeBoard = functions.database.ref ('board').onWrite(

    (event) => {

        const previousBoard = event.data.previous;
        var prevArray = boardToArray(previousBoard.val());
        console.log('readTicTacToeBoard', 'Result (1) ' + prevArray);

        const currentBoard = event.data.current.val();
        var currArray = boardToArray(currentBoard);
        console.log('readTicTacToeBoard', 'Result (2) ' + currArray);

        var lastMovedStone = searchLastMove (prevArray, currArray);

        var result = checkForEndOfGame(currArray, lastMovedStone.stone);

        if (! result.isGameOver) {

            console.log('readTicTacToeBoard', 'game is NOT over');
            return event.data.ref.parent.child('state').child('test_status').set('game_not_over');

        }
        else {

            console.log('readTicTacToeBoard', 'GAME IS OVER');
            return event.data.ref.parent.child('state').child('test_status').set('game_is_OVER');

        }
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

    var boardAsArray = [ [elem11, elem12, elem13], [elem21, elem22, elem23], [elem31, elem32, elem33] ];

    return boardAsArray;
}

function searchLastMove(prevBoard, currBoard) {

    var lastStone = new Object();
    lastStone.row = -1;
    lastStone.col = -1;
    lastStone.stone = GameStoneEmpty;

    for (var row = 0; row < 3; row ++) {

        for (var col = 0; col < 3; col ++) {

            console.log('readTicTacToeBoard', 'reading arrays at row=' + row + ', and at col=' + col);

            if (prevBoard[row][col] !== currBoard[row][col]) {

                lastStone.row = row;
                lastStone.col = col;
                lastStone.stone = currBoard[row][col];
                return lastStone;
            }
        }
    }

    return lastStone;
}

function checkForEndOfGame(board, stone) {

    var result = new Object();
    result.isGameOver = false;
    result.isADraw = false;

    // test columns
    for (var row = 0; row < 3; row++) {
        if (board[row][0] === stone && board[row][1] === stone && board[row][2] === stone) {
            result.isGameOver = true;
            return result;
        }
    }

    // test rows
    for (var col = 0; col < 3; col++) {
        if (board[0][col] === stone && board[1][col] === stone && board[2][col] === stone) {
            result.isGameOver = true;
            return result;
        }
    }

    // test diagonals
    if (board[0][0] === stone && board[1][1] === stone && board[2][2] === stone) {
        result.isGameOver = true;
        return result;
    }

    if (board[2][0] === stone && board[1][1] === stone && board[0][2] === stone) {
        result.isGameOver = true;
        return result;
    }

    // could be a draw
    var emptyStones = 0;
    for (row = 0; row < 3; row++) {
        for (col = 0; col < 3; col++) {
            if (board[row][col] === GameStoneEmpty) {
                emptyStones++;
                break;
            }
        }
    }
    if (emptyStones === 0) {

        result.isGameOver = true;
        result.isADraw = true;
        return result;
    }

    return result;
}


// ================================================================================================


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
