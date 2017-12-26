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
import BallEntity from './engine/Common/Ball'
import Controller from './engine/Common/Controller'
import { height as getTerrainHeight } from './engine/Common/Terrain'
import ChunkLoaderTrait from './engine/Server/Trait/ChunkLoader'

const PORT = 4200
const app = express()
const server = http.createServer(app)
const io = socketio(server)

// temporary fix for matterjs not working on nodejs https://github.com/liabru/matter-js/issues/468
global.HTMLElement = class DummyHTMLElement {}

Factory.add('Map', MapEntity)
Factory.add('Player', PlayerEntity)
Factory.add('Ball', BallEntity)

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
    let startX = (Math.random() - 0.5) * 10000
    let startY = (-getTerrainHeight(startX / 8) * 8) - 14

    let player = game.createEntity('Player', {
        position: {
            x: startX,
            y: startY
        },
        colorIndex: Math.floor(Math.random() * 14)
    })
    player.PLAYER_NAME = name.slice(0, 10)
    player.setController(new Controller())
    player.addTrait(new ChunkLoaderTrait(map))

    players.push(player)

    map.setEntities([ ...players, ...balls ])

    return player
}

const destroyPlayer = entity => {
    let index = players.indexOf(entity)
    if (index > -1) {
        players.splice(index, 1)
    }

    game.destroyEntity(entity)

    map.setEntities([ ...players, ...balls ])
}

const playerData = () => {
    let data = {}
    players.forEach(entity => {
        data[entity.ENTITY_ID] = {
            name: entity.PLAYER_NAME,
            colorIndex: entity.colorIndex,
            isRunning: entity.isRunning,
            isJumping: entity.isJumping,
            data: entity.body.exportState()
        }
    })
    return data
}

let balls = []
const createBall = (x) => {
    let startX = x
    let startY = (-getTerrainHeight(startX / 8) * 8) - 100

    if (balls.length >= 100) {
        destroyBall(balls[0])
    }
    let ball = game.createEntity('Ball', {
        position: {
            x: startX,
            y: startY
        }
    })

    balls.push(ball)

    map.setEntities([ ...players, ...balls ])

    return ball
}

const destroyBall = entity => {
    let index = balls.indexOf(entity)
    if (index > -1) {
        balls.splice(index, 1)
    }

    game.destroyEntity(entity)

    map.setEntities([ ...players, ...balls ])
}

const ballsData = () => {
    let data = {}
    balls.forEach(entity => {
        data[entity.ENTITY_ID] = {
            data: entity.body.exportState()
        }
    })
    return data
}

const log = (message) => {
    console.log(message)
}

const _handleDisconnect = socket => {
    if (socket.entity) {
        let PLAYER_NAME = socket.entity.PLAYER_NAME
        let ENTITY_ID = socket.entity.ENTITY_ID
        destroyPlayer(socket.entity)
        socket.entity = null
        if (players.length === 0) {
            game.stop()
        }
        log(PLAYER_NAME + ' has left the game. ID: ' + ENTITY_ID + ' / Player Count: ' + players.length)
    }
}

// handle socket io connections
io.on('connection', socket => {
    socket.on('disconnect', () => {
        _handleDisconnect(socket)
    })

    socket.on('controller.start', data => {
        if (socket.entity) {
            switch (data) {
                case 'ball':
                    createBall(socket.entity.body.body.position.x)
                    break

                default:
                    socket.entity.controller.start(data)
                    break
            }
        }
    })

    socket.on('controller.stop', data => {
        if (socket.entity) {
            socket.entity.controller.stop(data)
        }
    })

    socket.on('start', name => {
        _handleDisconnect(socket)
        socket.entity = createPlayer(name)

        if (players.length === 1) {
            game.start()
        }

        map.loadChunksByPosition(socket.entity.body.body.position.x, socket.entity.body.body.position.y)
            .then(() => {
                socket.emit('start', {
                    id: socket.entity.ENTITY_ID,
                    position: {
                        x: socket.entity.body.body.position.x,
                        y: socket.entity.body.body.position.y
                    },
                    colorIndex: socket.entity.colorIndex
                })
            })

        log(socket.entity.PLAYER_NAME + ' has joined the game. ID: ' + socket.entity.ENTITY_ID + ' / Player Count: ' + players.length)
    })

    socket.on('setTiles', data => {
        map.setTiles(data.tiles, data.hasOwnProperty('type')
            ? data.type
            : 0
        )
    })
})

setInterval(() => {
    io.sockets.emit('update', {
        player: playerData(),
        balls: ballsData(),
        chunks: map.resetDirtyChunkData()
    })
}, 50)

// start listening
server.listen(PORT)
log('Server is now listening on port ' + PORT)
