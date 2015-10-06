/*
 * Idea from: https://github.com/zachflower/resume-server
 * Sources: http://www.davidmclifton.com/2011/07/22/simple-telnet-server-in-node-js/
 */

/*
 * require lib
 */
var net     = require('net'),
  figlet    = require('figlet'),
  sprintf   = require("sprintf-js").sprintf,
  vsprintf  = require("sprintf-js").vsprintf,
  wrap      = require('word-wrap');

/*
 * new implement of telnetServer
 */
var telnetServer = (function(){
  var config  = loadConfig(),
    server    = {},
    sockets   = [],
    lastInput = "";

  function loadConfig() {
    try {
      require.resolve('./config');
    } catch(e) {
      console.error("config.js file not found, use config-sample.js as a reference");
      process.exit(e.code);
    }
    return require('./config');
  }

  function sendData(socket, data) {
    socket.write(data);
    socket.write("$ ");
  }

  function closeSocket(socket) {
    var i = sockets.indexOf(socket);
    if (i != -1) {
      sockets.splice(i, 1);
    }
  }

  function printHeader(socket) {
    socket.write("\n" + config.last + "\n\n");
    socket.write(figlet.textSync(config.motd));
    socket.write("\n");
    sendData(socket, "Type 'help' for more information.\n");
  }

  function initTriggers(socket) {
    socket.on('data', function(data) {
      receiveData(socket, data);
    })
    socket.on('end', function() {
      closeSocket(socket);
    })
  }

  function newSocket(socket) {
    sockets.push(socket);
    
    printHeader(socket);
    initTriggers(socket);
  }

  function cleanInput(data) {
    return data.toString().replace(/(\r\n|\n|\r)/gm,"").toLowerCase();
  }

  function receiveData(socket, data) {
    var cleanData = cleanInput(data);

    if (cleanData != '!!') {
      lastInput = cleanData;
    } else {
      cleanData = lastInput;
    }

    parseCommand(socket, cleanData);
  }

  function parseCommand(socket, action) {
    switch (action) {
      case 'quit':
      case 'exit':
        socket.end('Goodbye!\n');
        break;
      case 'help':
        var output = "";
        output += "These shell commands are defined internally.  Type 'help' to see this list.\n";
        output += "Type 'help <command>' for more information about a particular command.\n";
        
        output += "\n";
        output += "Commands:\n";
        sendData(socket, output);
        break;
      default:
        sendData(socket, "error: " + action + ": command not found.\n");
        break;
    }
  }

  return {
    "create" : function() {
      server = net.createServer(newSocket);
      server.listen(config.port);
    }
  }
}());

/* go */ 
telnetServer.create();
