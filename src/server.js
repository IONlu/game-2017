const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const path = require('path')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

// client files
app.use(express.static(path.join(__dirname, '..', 'dist')))
app.get('/', (req, res, next) => {
    res.sendFile([ __dirname, 'index.html' ])
})

let playerData = {}

// handle socket io connections
io.on('connection', socket => {
    socket.on('disconnect', () => {
        if (playerData.hasOwnProperty(socket.id)) {
            delete playerData[socket.id]
        }
    })

    socket.on('update', data => {
        playerData[socket.id] = data
    })
})

// broadcast positions
setInterval(() => {
    io.sockets.emit('update', playerData)
}, 100)

server.listen(4200)
