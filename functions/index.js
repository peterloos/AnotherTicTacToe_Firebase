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
const GameActive = "GameActive";
const GameOver = "GameOver";

// game commands
const GameCommandClear = "clear";
const GameCommandStart = "start";

// trigger functions
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

                // kick-off begin of game
                console.log('triggerCommand', 'kick-off begin of game');
                var key = arrPlayers[index].key;
                return event.data.ref.parent.parent.child('control').child('status').set({ id : GameActive, parameter1 : key, parameter2 : ''});

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

        // *************** begin
        console.log('triggerBoard', '!!!!!!!!!! lastMovedStone.stone => '  + lastMovedStone.stone );
        // *************** end

        if (lastMovedStone.stone === GameStoneEmpty) {

            console.log('triggerBoard', 'ignorig EMPTY stone ...');
            return Promise.resolve(1);
        }

        // set stone
        var result = checkForEndOfGame(currArray, lastMovedStone.stone);
        if (! result.isGameOver) {

            console.log('triggerBoard', 'game is NOT over');

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
                    {id : GameActive,
                     parameter1 : keyOfNextPlayer,
                     parameter2 : stoneOfNextPlayer}
                );
            });
        }
        else {

            console.log('triggerBoard', 'GAME IS OVER');

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

function dumpBoard(board, title) {

    console.log('dumpBoard', title);

    console.log('readTicTacToeBoard', 'elem11 ' + board.row1.col1.state);
    console.log('readTicTacToeBoard', 'elem12 ' + board.row1.col2.state);
    console.log('readTicTacToeBoard', 'elem13 ' + board.row1.col3.state);

    console.log('readTicTacToeBoard', 'elem21 ' + board.row2.col1.state);
    console.log('readTicTacToeBoard', 'elem21 ' + board.row2.col2.state);
    console.log('readTicTacToeBoard', 'elem21 ' + board.row2.col3.state);

    console.log('readTicTacToeBoard', 'elem31 ' + board.row3.col1.state);
    console.log('readTicTacToeBoard', 'elem31 ' + board.row3.col2.state);
    console.log('readTicTacToeBoard', 'elem31 ' + board.row3.col3.state);

    return;
}
