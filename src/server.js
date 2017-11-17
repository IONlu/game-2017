import express from 'express'
import socketio from 'socket.io'
import http from 'http'
import path from 'path'
import cors from 'cors'
import Factory from './engine/Common/Factory'
import GameEngine from './engine/Common/GameEngine'
import Loop from './engine/Server/Loop'
import MapEntity from './engine/Server/Map'

const PORT = 4200
const app = express()
const server = http.createServer(app)
const io = socketio(server)

// temporary fix for matterjs not working on nodejs https://github.com/liabru/matter-js/issues/468
global.HTMLElement = class DummyHTMLElement {}

Factory.add('Map', MapEntity)

const game = new GameEngine(new Loop(20))
const map = game.createEntity('Map')

app.use(cors())

// client files
app.use(express.static(path.resolve(__dirname, '../public')))
app.get('/', (req, res, next) => {
    res.sendFile(path.resolve(__dirname, '../public/index.html'))
})

app.get('/chunk/:x/:y', (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    res.header('Expires', '-1')
    res.header('Pragma', 'no-cache')

    map.loadChunk(parseFloat(req.params.x), parseFloat(req.params.y))
        .then(chunk => {
            res.json({
                version: 1,
                data: chunk.tiles
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

// preload map data
map.loadChunksByPosition()
    .then(() => {
        // broadcast positions
        setInterval(() => {
            io.sockets.emit('update', playerData)
        }, 100)

        // start listening
        server.listen(PORT)
        console.log('Server is now listening on port ' + PORT)
    })
