$(function () {
    "use strict";

    //For easy printing of messages.
    var content = $('#message-box');
    var input = $('#input');
    var status = $('#status');
    var passtext = $('#passtext');
    var password = $('#password');

    // my color assigned by the server
    var myColor = false;
    // my name sent to the server
    var myName = false;
  
    var loggedIn = false;

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        content.html($('<p>', { text: 'Sorry, but your browser doesn\'t '
                                    + 'support WebSockets.'} ));
        input.hide();
        $('span').hide();
        return;
    }

    // open connection
    //My address, change this to ws://localhost:1337 if you are testing this elsware
    var connection = new WebSocket('ws://chilltec.net:1337'); 

    connection.onopen = function () {
        // first we want users to enter their names
        input.removeAttr('disabled');
        status.text('Username');
        password.removeAttr('disabled');
        passtext.text('Password:');
    };

    connection.onerror = function (error) {
        // If we lose contact with the server.
        content.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
                                    + 'connection or the server is down.' } ));
    };

    //Handling new messages, there are four types of messages.
        //color, first response when a color is picked by the server
        //messages,  send when user first connects.  The entire history of message for this session.
        //message, single new message, send every time a user sends a message
        //wholesome, if this is false, display an alert to the user.
    connection.onmessage = function (message) {
        // try to parse JSON message. Because we know that the server always returns
        // JSON this should work without any problem but we should make sure that
        // the massage is not chunked or otherwise damaged.
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('Error: Invalid JSON received :: ', message.data);
            return;
        }

        // NOTE: if you're not sure about the JSON structure
        // check the server source code above
        if (json.type === "login") { // first response from the server.
            myName = json.user;
            status.text(myName + ': ')
            input.val("");
            input.removeAttr('disabled').focus();
            password.attr('disabled');
            password.hide();
            passtext.hide();
            loggedIn = true;
            // from now user can start sending messages
        } else if (json.type === 'messages') { // entire message history
            // insert every single message to the chat window
            for (var i=0; i < json.data.length; i++) {
                addMessage(json.data[i].user, json.data[i].text,
                           json.data[i].color, new Date(json.data[i].time));
            }
        } else if (json.type === 'message') { // it's a single message
            input.removeAttr('disabled'); // let the user write another message
            addMessage(json.data);
            console.log(json.data);
        } else if (json.type === 'wholesome'){
          input.removeAttr('disabled'); // let the user write another message
          if(json.data === false) alert("Only wholesome chats are alowed" +
                                       ", please try to be more wholesome!");
        } else {
            console.log('Error: Unexpected JSON received', json);
        }
    };

    /**
     * Send mesage when user presses Enter key
     */
    $('#input, #password').keydown(function(e) {
        
      if(e.keyCode === 13 && loggedIn === false) {  //Log in
        var obj = {
          user: input.val(),
          pass: password.val()
        };
        connection.send(JSON.stringify(obj));
        input.attr('disabled', 'disabled');
        password.attr('disabled', 'hidden');
        passtext.attr('hidden');
        }
      
      if (e.keyCode === 13 && loggedIn === true) {  //Regular messages
            var msg = $(this).val();
            if (!msg) {
                return;
            }
            connection.send(msg);
            $(this).val('');
            // disable the input field to make the user wait until server
            // sends back response
            input.attr('disabled', 'disabled');

            // we know that the first message sent from a user their name
            if (myName === false) {
                myName = msg;
            }
        }
    });

    /**
     * This method is optional. If the server wasn't able to respond to the
     * in 3 seconds then show some error message to notify the user that
     * something is wrong.
     */
    setInterval(function() {
        if (connection.readyState !== 1) {
            status.text('Error');
            input.attr('disabled', 'disabled').val('Unable to comminucate '
                                                 + 'with the WebSocket server.');
        }
    }, 3000);

    /**
     * Add message to the chat window
     */
    function addMessage(message) {
        content.prepend('<p><span>' + message + '</span></p>');
    }
});