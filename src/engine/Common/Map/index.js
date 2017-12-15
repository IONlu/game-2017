import Entity from '../Entity'
import { CHUNK_SIZE } from '../../../config'
import { Bodies, World } from 'matter-js'
import Chunk from './Chunk'
import { polygon as PolygonTools } from 'polygon-tools'

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

    updatePhysicsBody (x, y) {
        let bodies = []
        let screenX = x * 8 * CHUNK_SIZE
        let screenY = y * 8 * CHUNK_SIZE

        let rectangles = []

        for (let j = 0; j < CHUNK_SIZE; j++) {
            let start = -1
            for (let i = 0; i < CHUNK_SIZE; i++) {
                if (start === -1) {
                    if (!this.chunks[x + ';' + y].chunk.get(i, j)) {
                        start = i
                    }
                } else {
                    if (this.chunks[x + ';' + y].chunk.get(i, j)) {
                        rectangles.push([
                            [ screenX + (start * 8), screenY + (j * 8) ],
                            [ screenX + (start * 8) + 8 * (i - start), screenY + (j * 8) ],
                            [ screenX + (start * 8) + 8 * (i - start), screenY + (j * 8) + 8 ],
                            [ screenX + (start * 8), screenY + (j * 8) + 8 ]
                        ])
                        start = -1
                    }
                }
            }
            if (start !== -1) {
                rectangles.push([
                    [ screenX + (start * 8), screenY + (j * 8) ],
                    [ screenX + (start * 8) + 8 * (CHUNK_SIZE - start), screenY + (j * 8) ],
                    [ screenX + (start * 8) + 8 * (CHUNK_SIZE - start), screenY + (j * 8) + 8 ],
                    [ screenX + (start * 8), screenY + (j * 8) + 8 ]
                ])
            }
        }

        if (rectangles.length) {
            let triangles = PolygonTools.triangulate([
                [ screenX, screenY ],
                [ screenX + (CHUNK_SIZE * 8), screenY ],
                [ screenX + (CHUNK_SIZE * 8), screenY + (CHUNK_SIZE * 8) ],
                [ screenX, screenY + (CHUNK_SIZE * 8) ]
            ], rectangles)
            triangles.forEach(triangle => {
                let body = Bodies.fromVertices(
                    ...PolygonTools.centroid(triangle),
                    triangle.map(vec => {
                        return {
                            x: vec[0],
                            y: vec[1]
                        }
                    }),
                    {
                        isStatic: true,
                        friction: 1
                    }
                )
                bodies.push(body)
            })
        }

        if (this.chunks[x + ';' + y].bodyGroup) {
            this.chunks[x + ';' + y].bodyGroup.forEach(body => {
                World.remove(this.app.physics.world, body)
            })
        }

        this.chunks[x + ';' + y].bodyGroup = bodies
        bodies.forEach(body => {
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
