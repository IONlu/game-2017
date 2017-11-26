import Entity from '../Entity'
import { CHUNK_SIZE } from '../../../config'
import { Bodies, World, Body } from 'matter-js'
import Chunk from './Chunk'

export default class Map extends Entity {
    constructor (app) {
        super(app)

        this.chunks = {}
    }

    _handleChunkData (x, y, chunkData) {
        let chunk = this.getChunk(x, y)
        chunk.load(chunkData)
        this.forceNeighbourChunkUpdate(x, y)
        return chunk
    }

    forceNeighbourChunkUpdate (x, y) {
        for (let i = x - 1; i < x + 2; i++) {
            for (let j = y - 1; j < y + 2; j++) {
                if (i !== x || j !== y) {
                    this.getChunk(i, j).isDirty = true
                }
            }
        }
    }

    hasChunk (x, y) {
        return this.chunks.hasOwnProperty(x + ';' + y)
    }

    getChunk (x, y) {
        return this.createChunkIfNone(x, y)
    }

    getTile (x, y) {
        let chunkX = Math.floor(x / CHUNK_SIZE)
        let chunkY = Math.floor(y / CHUNK_SIZE)
        return this.getChunk(chunkX, chunkY).get(
            (CHUNK_SIZE + (x % CHUNK_SIZE)) % CHUNK_SIZE,
            (CHUNK_SIZE + (y % CHUNK_SIZE)) % CHUNK_SIZE
        )
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

    setTile (x, y, type = null) {
        let chunkX = Math.floor(x / CHUNK_SIZE)
        let chunkY = Math.floor(y / CHUNK_SIZE)
        this.forceNeighbourChunkUpdate(chunkX, chunkY)
        return this.getChunk(chunkX, chunkY).set(
            (CHUNK_SIZE + (x % CHUNK_SIZE)) % CHUNK_SIZE,
            (CHUNK_SIZE + (y % CHUNK_SIZE)) % CHUNK_SIZE,
            type
        )
    }

    setTiles (tiles, type = null) {
        tiles.forEach(({ x, y }) => {
            this.setTile(x, y, type)
        })
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

    createChunkIfNone (x, y) {
        if (this.chunks.hasOwnProperty(x + ';' + y)) {
            return this.chunks[x + ';' + y].chunk
        }
        this.chunks[x + ';' + y] = {
            x,
            y,
            chunk: new Chunk(CHUNK_SIZE)
        }
        return this.chunks[x + ';' + y].chunk
    }
}
