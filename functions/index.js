'use strict';

// firebase utils
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp (functions.config().firebase);

// game board stones
const GameStoneX = "X";
const GameStoneO = "O";
const GameStoneEmpty = "Empty";

// empty board - needed for initialization
const EmtpyBoard = {
    row1 : {
        col1: { state : "Empty" },
        col2: { state : "Empty" },
        col3: { state : "Empty" }
    },
    row2 : {
        col1: { state : "Empty" },
        col2: { state : "Empty" },
        col3: { state : "Empty" }
    },
    row3 : {
        col1: { state : "Empty" },
        col2: { state : "Empty" },
        col3: { state : "Empty" }
    }
};

// game state within cloud functions
const GameIdle = "GameIdle";
const GameRoom1Player = "GameRoom1Player";
const GameRoom2Players = "GameRoom2Players";
const GameActivePlayer = "GameActivePlayer";
const GameOver = "GameOver";


// game commands
const GameCommandClear = "clear";
const GameCommandStart = "start";

// trigger functions
exports.triggerPlayers = functions.database.ref ('/players').onWrite (

    (event) => {

        if (!event.data.exists()) {

            console.log(' da muss es einen delete gegeben haben');
            // TODO: Da muss der State wieder auf Room1Player oder Idle gesetzt werden
            return null;
        }

        var arrPlayers = snapshotToArray (event.data);
        console.log('snapshotToArray ------->  ' , arrPlayers.length);

        // TODO
        // Das ist recht uncool
        // ist die property stone in dem Objekt 'Unknown', dann sind wir im Hochlauf

        // ist die property stone in dem Objekt 'X' oder 'O', dann sind wir im Spielbetrieb ... und es dard KEINE Zustand gesetzt werden

        var isInitialization = true;
        if (arrPlayers[0].stone === "X" || arrPlayers[0].stone === "O" ) {
            isInitialization = false;
        }

        if (isInitialization === true) {

            console.log(' BIN HIER HIER (aa) ' + arrPlayers[0].stone);

            var name, key;
            if (arrPlayers.length === 1) {

                name = arrPlayers[0].name;
                key = arrPlayers[0].key;

                return event.data.ref.parent.child('control').child('status').set({ id : GameRoom1Player, parameter1 : key, parameter2 : name });
            }
            else if (arrPlayers.length === 2) {

                name = arrPlayers[1].name;
                key = arrPlayers[1].key;

                return event.data.ref.parent.child('control').child('status').set({ id : GameRoom2Players, parameter1 : key, parameter2 : name });
            }
            else {

                console.log('INTERNAL ERROR: More than 3 members within game room');
                return null;
            }

        }
        else {

            console.log('triggerPlayers', 'ignore this call --- just added some more informations into players objects (real time data base)');
            return null;
        }
    }
);

function snapshotToArray(snapshot) {

    let arrPlayers = [];

    snapshot.forEach (childSnapshot => {

        var item = childSnapshot.val();
        var key = childSnapshot.key;

        var player = new Object();
        player.timestamp = item.creationDate;
        player.name = item.name;
        player.key = key;
        player.stone = item.stone;
        player.score = item.score;
        arrPlayers.push(player);
    });

    return arrPlayers;
}

exports.triggerCommand = functions.database.ref ('/control/command').onUpdate (

    (event) => {

        if (!event.data.exists()) {
            return null;
        }

        const command = event.data.val();

        console.log('triggerCommand', '=======> [' + command + ']');

        if (command === "") {

            console.log('triggerCommand', ' --> command has been clear by the cloud server');
            return null;
        }

        else if (command === GameCommandStart) {

            return admin.database().ref('/players').once('value').then ((snapshot) => {

                var arrPlayers = snapshotToArray (snapshot);
                if (arrPlayers.length !== 2) {

                    console.log('triggerCommand', 'Array hat a unexpected length ' + arrPlayers.length);
                    return null;
                }

                // decide, which player begins - comparing time stamps
                var index = 0;
                if (arrPlayers[1].timestamp <= arrPlayers[0].timestamp) {
                    index = 1;
                }

                if (index === 0) {

                    // players at position zero starts playing (using 'X')
                    console.log('triggerCommand', 'XXX (a)');
                    return event.data.ref.parent.parent.child('players').child(arrPlayers[0].key).child('stone').set('X').then (
                        () => {

                            // second player uses a 'O'
                            console.log('triggerCommand', 'XXX (b)');
                            return event.data.ref.parent.parent.child('players').child(arrPlayers[1].key).child('stone').set('O').then (
                                () => {

                                    // kick-off begin of game
                                    console.log('triggerCommand', 'XXX (c)');
                                    return event.data.ref.parent.parent.child('control').child('status').set({ id : GameActivePlayer, parameter1 : arrPlayers[0].key, parameter2 : 'X'});
                                }
                            );
                        }
                    );
                }
                else if (index === 1) {

                    // players at position one starts playing (using 'X')
                    console.log('triggerCommand', 'YYY (a)');
                    return event.data.ref.parent.parent.child('players').child(arrPlayers[1].key).child('stone').set('X').then (
                        () => {

                            // second player uses a 'O'
                            console.log('triggerCommand', 'YYY (b)');
                            return event.data.ref.parent.parent.child('players').child(arrPlayers[0].key).child('stone').set('O').then (
                                () => {

                                    // kick-off begin of game
                                    console.log('triggerCommand', 'YYY (c)');
                                    return event.data.ref.parent.parent.child('control').child('status').set({ id : GameActivePlayer, parameter1 : arrPlayers[1].key, parameter2 : 'X'});
                                }
                            );
                        }
                    );
                }
                else
                    return null;

            }).catch ((reason) => {

                console.log('triggerCommand', 'Dont  know what to do ??????????????????? ');
            });

        }

        else if (command === GameCommandClear) {

            // console.log('triggerCommand', 'board should be cleared now ............................' );
            // return event.data.ref.parent.parent.child('board').set(EmtpyBoard);

            console.log('triggerCommand', 'in command clear (1a)' );

            return event.data.ref.parent.parent.child('board').set(EmtpyBoard).then ( () => {

                console.log('triggerCommand', 'in command clear (1b)');
                return event.data.ref.set ("");
            });
        }
        else {

            console.log('triggerCommand', 'Found an REALLY unknown command ---------> ' + command );
            return null;
        }
    }
);

exports.triggerBoard = functions.database.ref ('board').onUpdate(

    (event) => {

        const previousBoard = event.data.previous;
        var prevArray = boardToArray(previousBoard.val());

        const currentBoard = event.data.current.val();
        var currArray = boardToArray(currentBoard);

        var lastMovedStone = searchLastMove (prevArray, currArray);
        if (lastMovedStone === GameStoneEmpty) {

            console.log('readTicTacToeBoard', 'ignorig EMPTY stone ...');
            return Promise.resolve(1);
        }

        // set stone
        var result = checkForEndOfGame(currArray, lastMovedStone.stone);
        if (! result.isGameOver) {

            console.log('readTicTacToeBoard', 'game is NOT over');

            // need list of players to change state of game accordingly
            return admin.database().ref('/players').once('value').then ((snapshot) => {

                var arrPlayers = snapshotToArray (snapshot);
                var keyOfNextPlayer;
                var stoneOfNextPlayer;

                if (arrPlayers[0].stone === lastMovedStone.stone) {

                    keyOfNextPlayer = arrPlayers[1].key;
                    stoneOfNextPlayer = arrPlayers[1].stone;
                }
                else if (arrPlayers[1].stone === lastMovedStone.stone) {

                    keyOfNextPlayer = arrPlayers[0].key;
                    stoneOfNextPlayer = arrPlayers[0].stone;
                }

                return event.data.ref.parent.child('control').child('status').set(
                    {id : GameActivePlayer,
                     parameter1 : keyOfNextPlayer,
                     parameter2 : stoneOfNextPlayer}
                );
            });
        }
        else {

            console.log('readTicTacToeBoard', 'GAME IS OVER');

            return admin.database().ref('/players').once('value').then (

                (snapshot) => {

                    var arrPlayers = snapshotToArray (snapshot);
                    var indexOfWinner = (arrPlayers[0].stone === lastMovedStone.stone) ? 0 : 1;

                    var lastScoreOfWinner = arrPlayers[indexOfWinner].score;
                    lastScoreOfWinner++;

                    var keyOfWinner = arrPlayers[indexOfWinner].key;

                    return event.data.ref.parent.child('players').child(arrPlayers[indexOfWinner].key).child('score').set(lastScoreOfWinner).then(
                        () => {
                            return event.data.ref.parent.child('control').child('status').set(
                                {id : GameOver,
                                 parameter1 : keyOfWinner,
                                 parameter2 : lastScoreOfWinner.toString() }
                            );
                        }
                    );
                }
            );
        }
    }
);





/*
 *   helper functions
 */

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
