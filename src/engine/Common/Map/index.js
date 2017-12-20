import Entity from '../Entity'
import { CHUNK_SIZE } from '../../../config'
import { Bodies, World } from 'matter-js'
import Chunk from './Chunk'

export default class Map extends Entity {
    constructor (app) {
        super(app)

        this.chunks = {}
        this.entities = []
    }

    setEntities (entities) {
        this.entities = entities
    }

    _handleChunkData (x, y, chunkData) {
        let chunk = this.getChunk(x, y)
        chunk.load(chunkData)
        chunk.isDummy = false
        this.forceNeighbourChunkUpdate(x, y)
        return chunk
    }

    update (updateData) {
        super.update(updateData)
        this.loadUnloadPhysicsBodies(this.entities, CHUNK_SIZE * 8)
    }

    forceNeighbourChunkUpdate (x, y) {
        for (let i = x - 1; i < x + 2; i++) {
            for (let j = y - 1; j < y + 2; j++) {
                if (i !== x || j !== y) {
                    this.forceChunkUpdate(i, j)
                }
            }
        }
    }

    forceChunkUpdate (x, y) {
        if (this.hasChunk(x, y)) {
            this.getChunk(x, y).isDirty = true
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

    setTile (x, y, type = 0) {
        let chunkX = Math.floor(x / CHUNK_SIZE)
        let chunkY = Math.floor(y / CHUNK_SIZE)
        let tileX = (CHUNK_SIZE + (x % CHUNK_SIZE)) % CHUNK_SIZE
        let tileY = (CHUNK_SIZE + (y % CHUNK_SIZE)) % CHUNK_SIZE

        // update neighbours if necessary
        if (tileX === 0) {
            this.forceChunkUpdate(chunkX - 1, chunkY)
        }
        if (tileY === 0) {
            this.forceChunkUpdate(chunkX, chunkY - 1)
        }
        if (tileX === CHUNK_SIZE - 1) {
            this.forceChunkUpdate(chunkX + 1, chunkY)
        }
        if (tileY === CHUNK_SIZE - 1) {
            this.forceChunkUpdate(chunkX, chunkY + 1)
        }

        return this.getChunk(chunkX, chunkY)
            .set(tileX, tileY, type)
    }

    setTiles (tiles, type = 0) {
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

        if (!this.chunks[chunkKey].hasOwnProperty('physicsLoaded')) {
            this.chunks[chunkKey].physicsLoaded = false
        }

        let physicsLoaded = this.chunks[chunkKey].physicsLoaded
        this.unloadPhysics(chunkX, chunkY)
        this.chunks[chunkKey].bodies = bodies.filter(body => body)
        if (physicsLoaded) {
            this.loadPhysics(chunkX, chunkY)
        }
    }

    unloadPhysics (chunkX, chunkY) {
        let chunkKey = chunkX + ';' + chunkY
        if (!this.chunks.hasOwnProperty(chunkKey)) {
            return
        }
        let chunk = this.chunks[chunkKey]
        if (chunk.physicsLoaded && chunk.bodies) {
            chunk.physicsLoaded = false
            chunk.bodies.forEach(body => {
                World.remove(this.app.physics.world, body)
            })
        }
    }

    loadPhysics (chunkX, chunkY) {
        let chunkKey = chunkX + ';' + chunkY
        if (!this.chunks.hasOwnProperty(chunkKey)) {
            return
        }
        let chunk = this.chunks[chunkKey]
        if (!chunk.physicsLoaded && chunk.bodies) {
            chunk.physicsLoaded = true
            chunk.bodies.forEach(body => {
                World.add(this.app.physics.world, body)
            })
        }
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

    unloadChunk (x, y) {
        if (!this.chunks.hasOwnProperty(x + ';' + y)) {
            return
        }
        if (this.chunks[x + ';' + y].bodies) {
            this.chunks[x + ';' + y].bodies.forEach(body => {
                World.remove(this.app.physics.world, body)
            })
        }
        delete this.chunks[x + ';' + y]
    }

    getChunksByDistance (positions, maxDistance) {
        let inside = []
        let outside = []
        let maxDistanceSquared = maxDistance * maxDistance
        Object.keys(this.chunks).forEach(key => {
            let chunk = this.chunks[key]
            let centerX = (chunk.x + 0.5) * (8 * CHUNK_SIZE)
            let centerY = (chunk.y + 0.5) * (8 * CHUNK_SIZE)
            for (let i = 0; i < positions.length; i++) {
                let dx = centerX - positions[i].x
                let dy = centerY - positions[i].y
                let distanceSquared = (dx * dx) + (dy * dy)
                if (distanceSquared <= maxDistanceSquared) {
                    inside.push(chunk)
                    return
                }
            }
            outside.push(chunk)
        })
        return { inside, outside }
    }

    loadUnloadPhysicsBodies (entities, distance) {
        let { inside, outside } = this.getChunksByDistance(
            entities.map(entity => {
                return {
                    x: entity.position.x,
                    y: entity.position.y
                }
            }),
            distance
        )
        inside.forEach(chunk => {
            this.loadPhysics(chunk.x, chunk.y)
        })
        outside.forEach(chunk => {
            this.unloadPhysics(chunk.x, chunk.y)
        })
    }
}
