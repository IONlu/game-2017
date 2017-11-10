import Entity from '../Entity'
import Chunk from './Chunk'
import ChunkWorker from './Chunk.worker.js'
import { CHUNK_SIZE } from '@/config'
import { Bodies, World, Body } from 'matter-js'

export default class Map extends Entity {
    constructor (app) {
        super(app)

        this.chunks = {}

        this.initWorkers(4)
    }

    initWorkers (count) {
        this.workers = []
        this.nextWorker = 0
        for (let i = 0; i < count; i++) {
            let worker = new ChunkWorker()
            worker.addEventListener('message', evt => {
                let x = evt.data.x
                let y = evt.data.y

                if (!this.chunks.hasOwnProperty(x + ';' + y)) {
                    return
                }
                this.chunks[x + ';' + y].chunk.load(evt.data.chunk)

                for (let i = x - 1; i < x + 2; i++) {
                    for (let j = y - 1; j < y + 2; j++) {
                        if (this.chunks.hasOwnProperty(i + ';' + j)) {
                            this.chunks[i + ';' + j].chunk.isDirty = true
                        }
                    }
                }

                // physics
                this.updatePhysicsBody(x, y)
            }, false)
            this.workers.push(worker)
        }
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
        this.workers[this.nextWorker].postMessage({ x, y })
        this.nextWorker = (this.nextWorker + 1) % this.workers.length
    }

    getTile (x, y) {
        let chunkX = Math.floor(x / CHUNK_SIZE)
        let chunkY = Math.floor(y / CHUNK_SIZE)
        if (!this.chunks.hasOwnProperty(chunkX + ';' + chunkY)) {
            return undefined
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

    setTile (x, y, tile) {
        let chunkX = Math.floor(x / CHUNK_SIZE)
        let chunkY = Math.floor(y / CHUNK_SIZE)
        if (!this.chunks.hasOwnProperty(chunkX + ';' + chunkY)) {
            return undefined
        }
        let tileData = this.chunks[chunkX + ';' + chunkY].chunk.set((CHUNK_SIZE + (x % CHUNK_SIZE)) % CHUNK_SIZE, (CHUNK_SIZE + (y % CHUNK_SIZE)) % CHUNK_SIZE, tile)
        this.updatePhysicsBody(chunkX, chunkY)
        return tileData
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
