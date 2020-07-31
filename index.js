const express = require("express");
const WebSocket = require("ws");
const http = require("http");
const { v4: uuidv4 } = require('uuid');
const app = express();

const port = process.env.PORT || 9000;

//initialize a http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

let users = {};

const sendTo = (connection, message) => {
    connection.send(JSON.stringify(message));
};

const sendToAll = (clients, type, { id, name: userName }) => {
    Object.values(clients).forEach(client => {
        if (client.name !== userName) {
            client.send(
                JSON.stringify({
                    type,
                    user: { id, userName }
                })
            );
        }
    });
};

wss.on("connection", ws => {
    ws.on("message", msg => {
        let data;
        //accepting only JSON messages
        try {
            data = JSON.parse(msg);
            console.log(data)
        } catch (e) {
            console.log("Invalid JSON");
            data = {};
        }
        const { type, name } = data;
        //Handle message by type
        switch (type) {
            //when a user tries to login
            case "login":
                //Check if username is available
                if (users[name]) {
                    sendTo(ws, {
                        type: "login",
                        success: false,
                        message: "Username is unavailable"
                    });
                } else {
                    const id = uuidv4();

                    users[name] = ws;
                    ws.name = name;
                    ws.id = id;

                    const loggedIn = Object.values(
                        users
                    ).map(({id, name: userName}) => ({id, userName}));
                    sendTo(ws, {
                        type: "login",
                        success: true,
                        users: loggedIn
                    });
                    sendToAll(users, "updateUsers", ws);
                }
                break;
            case "offer":
                //Check if user to send offer to exists
                const offerRecipient = users[name];
                if (!!offerRecipient) {
                    sendTo(offerRecipient, {
                        type: "offer",
                        offer: 'offer',
                        name: ws.name
                    });
                } else {
                    sendTo(ws, {
                        type: "error",
                        message: `User ${name} does not exist!`
                    });
                }
                break;
            case "answer":
                //Check if user to send answer to exists
                const answerRecipient = users[name];
                if (!!answerRecipient) {
                    sendTo(answerRecipient, {
                        type: "answer",
                        answer: 'answer',
                    });
                } else {
                    sendTo(ws, {
                        type: "error",
                        message: `User ${name} does not exist!`
                    });
                }
                break;
            default:
                sendTo(ws, {
                    type: "error",
                    message: "Command not found: " + type
                });
                break;
        }
    });
    //send immediate a feedback to the incoming connection
    ws.send(
        JSON.stringify({
            type: "connect",
            message: "Well hello there, I am a WebSocket server"
        })
    );
});

//start our server
server.listen(port, () => {
    console.log(`Signalling Server running on port: ${port}`);
});