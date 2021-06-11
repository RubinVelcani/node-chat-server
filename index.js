const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors'); 
const firebase = require('firebase/app');
const realtimedb = require('firebase/firebase-database')

const firebaseConfig = {
    apiKey: "AIzaSyC_pc-bW2pB9ag66k4aSqyxXt4zMnGnGBg",
    authDomain: "node-chat-98f8f.firebaseapp.com",
    databaseURL: "https://node-chat-98f8f-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "node-chat-98f8f",
    storageBucket: "node-chat-98f8f.appspot.com",
    messagingSenderId: "1044856560352",
    appId: "1:1044856560352:web:4558160f4bda3f5d218e85"
  };

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users.js')

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connect', (socket) => {

    socket.on('join', ({ name, room }, callback) => {
        
        const { error, user } = addUser({ id: socket.id, name, room})

        if(error) return callback(error)

        socket.emit('message', { user: 'admin', text: `${user.name}, welcome to the ${user.room} room`})
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!`})

        socket.join(user.room)

        io.to(user.room).emit('roomData', {room:user.room, users: getUsersInRoom(user.room)})

        callback()

    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('message', { user: user.name, text: message})
        io.to(user.room).emit('roomData', { room: user.room, users:getUsersInRoom(user.room)})

        callback()
    })

    socket.on('disconnecting', () => {
        console.log('User is leaving...')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left.`})
        }
    })
});

app.use(cors()); 
app.use(router);

server.listen(PORT, () => console.log(`Server has started on port: ${PORT}`));