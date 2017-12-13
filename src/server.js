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
import Controller from './engine/Common/Controller'
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

let players = []
const createPlayer = (name) => {
    let startX = (Math.random() - 0.5) * 100
    let startY = (-getTerrainHeight(startX / 8) * 8) - 14

    let player = game.createEntity('Player', {
        position: {
            x: startX,
            y: startY
        }
    })
    player.PLAYER_NAME = name.slice(0, 10)
    player.setController(new Controller())

    players.push(player)

    return player
}

const destroyEntity = entity => {
    let index = players.indexOf(entity)
    if (index > -1) {
        players.splice(index, 1)
    }

    game.destroyEntity(entity)
}

const playerData = () => {
    let data = {}
    players.forEach(entity => {
        data[entity.ENTITY_ID] = {
            name: entity.PLAYER_NAME,
            data: [
                entity.body.body.position.x,
                entity.body.body.position.y,
                entity.body.body.angle
            ]
        }
    })
    return data
}

// handle socket io connections
io.on('connection', socket => {
    socket.on('disconnect', () => {
        if (socket.entity) {
            destroyEntity(socket.entity)
        }
    })

    socket.on('controller.start', data => {
        if (socket.entity) {
            console.log(socket.entity.PLAYER_NAME, 'start', data)
            socket.entity.controller.start(data)
        }
    })

    socket.on('controller.stop', data => {
        if (socket.entity) {
            socket.entity.controller.stop(data)
        }
    })

    socket.on('start', name => {
        socket.entity = createPlayer(name)

        socket.emit('start', {
            id: socket.entity.ENTITY_ID,
            position: {
                x: socket.entity.body.body.position.x,
                y: socket.entity.body.body.position.y
            }
        })

        console.log(socket.entity.PLAYER_NAME + ' has joined the game. ID: ' + socket.entity.ENTITY_ID)
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
                player: playerData(),
                chunks: map.getDirtyChunkData()
            })
        }, 100)

        game.start()

        // start listening
        server.listen(PORT)
        console.log('Server is now listening on port ' + PORT)
    })
