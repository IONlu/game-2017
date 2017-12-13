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

let NEXT_ENTITY_ID = 1

// temporary fix for matterjs not working on nodejs https://github.com/liabru/matter-js/issues/468
global.HTMLElement = class DummyHTMLElement {}

Factory.add('Map', MapEntity)

const game = new GameEngine(new Loop(60))
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
        if (playerData.hasOwnProperty(socket.ENTITY_ID)) {
            console.log(playerData[socket.ENTITY_ID].name + ' has left the game. ID: ' + socket.ENTITY_ID)
            delete playerData[socket.ENTITY_ID]
        }
    })

    socket.on('update', data => {
        if (!playerData.hasOwnProperty(socket.ENTITY_ID)) {
            return
        }
        playerData[socket.ENTITY_ID].data = data
    })

    socket.on('start', name => {
        name = name.slice(0, 10)
        socket.ENTITY_ID = NEXT_ENTITY_ID
        playerData[socket.ENTITY_ID] = {
            name, data: undefined
        }
        socket.emit('start', {
            id: NEXT_ENTITY_ID
        })
        console.log(name + ' has joined the game. ID: ' + NEXT_ENTITY_ID)
        NEXT_ENTITY_ID++
    })

    socket.on('setTiles', data => {
        map.setTiles(data.tiles, data.hasOwnProperty('type')
            ? data.type
            : null
        )
    })
})

// preload map data
map.loadChunksByPosition()
    .then(() => {
        // broadcast positions
        setInterval(() => {
            io.sockets.emit('update', {
                player: playerData,
                chunks: map.getDirtyChunkData()
            })
        }, 100)

        // start listening
        server.listen(PORT)
        console.log('Server is now listening on port ' + PORT)
    })
