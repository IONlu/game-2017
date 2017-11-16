import Entity from '../Entity'
import Chunk from './Chunk'
import { CHUNK_SIZE } from '@/config'
import { Bodies, World, Body } from 'matter-js'
import axios from 'axios'

export default class Map extends Entity {
    constructor (app) {
        super(app)

        this.chunks = {}
    }

    loadChunk (x, y) {
        if (this.chunks.hasOwnProperty(x + ';' + y)) {
            return this.chunks[x + ';' + y]
        }
        this.chunks[x + ';' + y] = {
            x,
            y,
            chunk: new Chunk(CHUNK_SIZE)
        }
        axios.get('//localhost:4200/chunk/' + x + '/' + y)
            .then(response => {
                this._handleChunkData(x, y, response.data.data)
            })
    }

    _handleChunkData (x, y, chunkData) {
        if (!this.chunks.hasOwnProperty(x + ';' + y)) {
            return
        }
        this.chunks[x + ';' + y].chunk.load(chunkData)

        for (let i = x - 1; i < x + 2; i++) {
            for (let j = y - 1; j < y + 2; j++) {
                if (this.chunks.hasOwnProperty(i + ';' + j)) {
                    this.chunks[i + ';' + j].chunk.isDirty = true
                }
            }
        }

        // physics
        this.updatePhysicsBody(x, y)
    }

    getTile (x, y) {
        let chunkX = Math.floor(x / CHUNK_SIZE)
        let chunkY = Math.floor(y / CHUNK_SIZE)
        if (!this.chunks.hasOwnProperty(chunkX + ';' + chunkY)) {
            return null
        }
        return this.chunks[chunkX + ';' + chunkY].chunk.get((CHUNK_SIZE + (x % CHUNK_SIZE)) % CHUNK_SIZE, (CHUNK_SIZE + (y % CHUNK_SIZE)) % CHUNK_SIZE)
    }

    getTileNeighbours (x, y) {
        let neighbours = []
        for (let j = y - 1; j < y + 2; j++) {
            for (let i = x - 1; i < x + 2; i++) {
                if (i !== x || j !== y) {
                    neighbours.push(this.getTile(i, j))
                }
            }
        }
        return neighbours
    }

    setTile (x, y, tile = null) {
        let chunkX = Math.floor(x / CHUNK_SIZE)
        let chunkY = Math.floor(y / CHUNK_SIZE)
        if (!this.chunks.hasOwnProperty(chunkX + ';' + chunkY)) {
            return null
        }
        let tileData = this.chunks[chunkX + ';' + chunkY].chunk.set((CHUNK_SIZE + (x % CHUNK_SIZE)) % CHUNK_SIZE, (CHUNK_SIZE + (y % CHUNK_SIZE)) % CHUNK_SIZE, tile)
        this.updatePhysicsBody(chunkX, chunkY)
        return tileData
    }

    dig (x, y, toolsize) {
        let radius = toolsize / 2
        for (let i = Math.floor(x - radius); i < Math.ceil(x + radius); i++) {
            for (let j = Math.floor(y - radius); j < Math.ceil(y + radius); j++) {
                let dx = i - x
                let dy = j - y
                let distance = Math.floor(Math.sqrt(dx * dx + dy * dy))
                if (distance < radius) {
                    this.setTile(i, j)
                }
            }
        }
    }

    updatePhysicsBody (x, y) {
        let bodies = []
        let screenX = x * 8 * CHUNK_SIZE
        let screenY = y * 8 * CHUNK_SIZE
        let body = Bodies.rectangle(screenX + ((CHUNK_SIZE / 2) * 8), screenY + ((CHUNK_SIZE / 2) * 8), CHUNK_SIZE * 8, CHUNK_SIZE * 8, {
            isSensor: true
        })
        bodies.push(body)

        for (let j = 0; j < CHUNK_SIZE; j++) {
            let start = -1
            for (let i = 0; i < CHUNK_SIZE; i++) {
                if (start === -1) {
                    if (this.chunks[x + ';' + y].chunk.get(i, j)) {
                        start = i
                    }
                } else {
                    if (!this.chunks[x + ';' + y].chunk.get(i, j)) {
                        let body = Bodies.rectangle(
                            screenX + (start * 8) + (4 * (i - start)),
                            screenY + (j * 8) + 4,
                            8 * (i - start),
                            8
                        )
                        bodies.push(body)
                        start = -1
                    }
                }
            }
            if (start !== -1) {
                let body = Bodies.rectangle(
                    screenX + (start * 8) + (4 * (CHUNK_SIZE - start)),
                    screenY + (j * 8) + 4,
                    8 * (CHUNK_SIZE - start),
                    8
                )
                bodies.push(body)
            }
        }
        if (this.chunks[x + ';' + y].bodyGroup) {
            World.remove(this.app.physics.world, this.chunks[x + ';' + y].bodyGroup)
        }
        let bodyGroup = this.chunks[x + ';' + y].bodyGroup = Body.create({
            parts: bodies,
            isStatic: true
        })
        World.add(this.app.physics.world, bodyGroup)
    }
}
