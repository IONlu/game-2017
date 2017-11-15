import express from 'express'
import socketio from 'socket.io'
import http from 'http'
import path from 'path'
import { generateData } from './engine/Common/Map/Chunk'

const app = express()
const server = http.createServer(app)
const io = socketio(server)

// client files
app.use(express.static(path.resolve(__dirname, '../public')))
app.get('/', (req, res, next) => {
    res.sendFile(path.resolve(__dirname, '../public/index.html'))
})

app.get('/chunk/:x/:y', (req, res, next) => {
    generateData(parseFloat(req.params.x), parseFloat(req.params.y))
        .then(chunkData => {
            res.json({
                version: 1,
                data: chunkData
            })
        })
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
