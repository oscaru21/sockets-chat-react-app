const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');

const { addUser, removeUser, getUser, getUsersInRoom} = require('./users');


const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', function(socket){
    socket.on('join', function({ name, room }, callback){
        const {error, user} = addUser({ id: socket.id, name, room});
        if(error){
            return callback(error);
        }

        socket.emit('message', {user: 'admin', text: `${user.name} welcome to the room ${user.room}.`});
        socket.broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name} has joined!`});

        socket.join(user.room);

        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});

        callback();
    });

    socket.on('sendMessage', function(message, callback){
        const user = getUser(socket.id);
        io.to(user.room).emit('message', {user: user.name, text: message});
        callback();
    });

    socket.on('disconnect', function(){
        const user = removeUser(socket.id);

        io.to(user.room).emit('message', {user: 'admin', text: `${user.name} has left`});
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
    });
});

app.use(router);
app.use(cors());

server.listen(PORT, function(){
    console.log(`server running in port ${PORT}`);
});
