import express from 'express'
import socketio from 'socket.io'
import http from 'http'
import path from 'path'
import cors from 'cors'
import Factory from './engine/Common/Factory'
import GameEngine from './engine/Common/GameEngine'
import Loop from './engine/Server/Loop'
import MapEntity from './engine/Server/Map'
import PlayerEntity from './engine/Common/Player'
import { height as getTerrainHeight } from './engine/Common/Terrain'

const PORT = 4200
const app = express()
const server = http.createServer(app)
const io = socketio(server)

// temporary fix for matterjs not working on nodejs https://github.com/liabru/matter-js/issues/468
global.HTMLElement = class DummyHTMLElement {}

Factory.add('Map', MapEntity)
Factory.add('Player', PlayerEntity)

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

const createPlayer = () => {
    let startX = (Math.random() - 0.5) * 10000
    let startY = (-getTerrainHeight(startX / 8) * 8) - 14

    return game.createEntity('Player', {
        position: {
            x: startX,
            y: startY
        }
    })
}

const destroyEntity = entity => {
    game.destroyEntity(entity)
}

let playerData = {}

// handle socket io connections
io.on('connection', socket => {
    socket.on('disconnect', () => {
        if (socket.entity) {
            if (playerData.hasOwnProperty(socket.entity.ENTITY_ID)) {
                console.log(playerData[socket.entity.ENTITY_ID].name + ' has left the game. ID: ' + socket.entity.ENTITY_ID)
                delete playerData[socket.entity.ENTITY_ID]
            }
            destroyEntity(socket.entity)
        }
    })

    socket.on('update', data => {
        if (socket.entity && playerData.hasOwnProperty(socket.entity.ENTITY_ID)) {
            playerData[socket.entity.ENTITY_ID].data = data
        }
    })

    socket.on('start', name => {
        name = name.slice(0, 10)
        socket.entity = createPlayer()
        playerData[socket.entity.ENTITY_ID] = {
            name, data: undefined
        }
        socket.emit('start', {
            id: socket.entity.ENTITY_ID
        })
        console.log(name + ' has joined the game. ID: ' + socket.entity.ENTITY_ID)
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
