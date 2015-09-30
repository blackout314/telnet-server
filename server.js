/*
 * Idea from: https://github.com/zachflower/resume-server
 * Sources: http://www.davidmclifton.com/2011/07/22/simple-telnet-server-in-node-js/
 */

var net = require('net');
var figlet = require('figlet');
var sprintf = require("sprintf-js").sprintf;
var vsprintf = require("sprintf-js").vsprintf;
var wrap = require('word-wrap');

try {
  require.resolve('./config');
} catch(e) {
  console.error("config.js file not found, use config-sample.js as a reference");
  process.exit(e.code);
}

var config = require('./config');

/*
 * Global Variables
 */
var sockets = [];
var lastInput = '';

/*
 * Cleans the input of carriage return, newline
 */
function cleanInput(data) {
	return data.toString().replace(/(\r\n|\n|\r)/gm,"").toLowerCase();
}

/*
 * Send Data to Socket
 */
function sendData(socket, data) {
	socket.write(data);
	socket.write("$ ");
}

/*
 * Method executed when data is received from a socket
 */
function receiveData(socket, data) {
	var cleanData = cleanInput(data);

	if ( cleanData != '!!' ) {
		lastInput = cleanData;
	} else {
		cleanData = lastInput;
	}

	var output = "";

	switch ( cleanData ) {
		case 'quit':
		case 'exit':
			socket.end('Goodbye!\n');
			break;
		case 'help':
			output += "These shell commands are defined internally.  Type 'help' to see this list.\n";
			output += "Type 'help <command>' for more information about a particular command.\n";

			output += "\n";
			output += "Commands:\n";

			sendData(socket, output);
			break;
		default:
			sendData(socket, "error: " + cleanData + ": command not found.\n");
			break;
	}
}

/*
 * Method executed when a socket ends
 */
function closeSocket(socket) {
	var i = sockets.indexOf(socket);

	if (i != -1) {
		sockets.splice(i, 1);
	}
}
 
/*
 * Callback method executed when a new TCP socket is opened.
 */
function newSocket(socket) {
	sockets.push(socket);
	socket.write("\n"+config.last+"\n\n");
	socket.write(figlet.textSync(config.motd));
	socket.write("\n");

	sendData(socket, "Type 'help' for more information.\n");

	socket.on('data', function(data) {
		receiveData(socket, data);
	})

	socket.on('end', function() {
		closeSocket(socket);
	})
}
 
var server = net.createServer(newSocket);
server.listen(config.port);
