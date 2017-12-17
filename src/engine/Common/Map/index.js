import Entity from '../Entity'
import { CHUNK_SIZE } from '../../../config'
import { Bodies, World } from 'matter-js'
import Chunk from './Chunk'

export default class Map extends Entity {
    constructor (app) {
        super(app)

        this.chunks = {}
    }

    _handleChunkData (x, y, chunkData) {
        let chunk = this.getChunk(x, y)
        chunk.load(chunkData)
        chunk.isDummy = false
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

    getTile (x, y, background = false) {
        let chunkX = Math.floor(x / CHUNK_SIZE)
        let chunkY = Math.floor(y / CHUNK_SIZE)
        return this.getChunk(chunkX, chunkY).get(
            (CHUNK_SIZE + (x % CHUNK_SIZE)) % CHUNK_SIZE,
            (CHUNK_SIZE + (y % CHUNK_SIZE)) % CHUNK_SIZE,
            background
        )
    }

    getTileNeighbours (x, y, background = false) {
        let neighbours = []
        for (let j = y - 1; j < y + 2; j++) {
            for (let i = x - 1; i < x + 2; i++) {
                if (i !== x || j !== y) {
                    neighbours.push(this.getTile(i, j, background))
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

    updatePhysicsBody (chunkX, chunkY) {
        let chunkKey = chunkX + ';' + chunkY
        let offset = {
            x: chunkX * 8 * CHUNK_SIZE,
            y: chunkY * 8 * CHUNK_SIZE
        }

        let rectangles = this.chunks[chunkKey].chunk.getRectangles()
        let bodies = rectangles.map(rectangle => {
            let width = (rectangle[2] - rectangle[0]) * 8
            let height = (rectangle[3] - rectangle[1]) * 8
            return Bodies.rectangle(
                (rectangle[0] * 8) + (width / 2) + offset.x,
                (rectangle[1] * 8) + (height / 2) + offset.y,
                width,
                height,
                {
                    isStatic: true,
                    friction: 1
                }
            )
        })

        if (this.chunks[chunkKey].bodies) {
            this.chunks[chunkKey].bodies.forEach(body => {
                World.remove(this.app.physics.world, body)
            })
        }

        this.chunks[chunkKey].bodies = bodies.filter(body => body)
        this.chunks[chunkKey].bodies.forEach(body => {
            World.add(this.app.physics.world, body)
        })
    }

    createChunkIfNone (x, y) {
        if (this.chunks.hasOwnProperty(x + ';' + y)) {
            return this.chunks[x + ';' + y].chunk
        }
        let chunk = new Chunk(CHUNK_SIZE, true)
        this.chunks[x + ';' + y] = {
            x,
            y,
            chunk
        }
        return this.chunks[x + ';' + y].chunk
    }

    unload (x, y) {
        if (!this.chunks.hasOwnProperty(x + ';' + y)) {
            return
        }
        if (this.chunks[x + ';' + y].bodyGroup) {
            World.remove(this.app.physics.world, this.chunks[x + ';' + y].bodyGroup)
        }
        delete this.chunks[x + ';' + y]
    }
}
