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