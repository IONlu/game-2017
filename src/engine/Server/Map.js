import CommonMap from '../Common/Map'
import { generateData } from '../Common/Map/Chunk'
import { CHUNK_SIZE } from '../../config'
import schemapack from 'schemapack'
import Redis from 'ioredis'

const redis = new Redis()
const chunkSchema = schemapack.build([ 'uint8' ])

export default class Map extends CommonMap {
    constructor (app) {
        super(app)

        this._loadingChunks = {}
        this._dirtyChunkData = {}
    }

    async loadChunk (x, y) {
        let chunk = this.createChunkIfNone(x, y)
        if (!chunk.isDummy) {
            return chunk
        }
        let key = x + ';' + y
        if (!this._loadingChunks.hasOwnProperty(key)) {
            this._loadingChunks[key] = redis.getBuffer('chunk:' + key)
                .then(result => {
                    if (!result) {
                        return generateData(x, y)
                    }
                    return chunkSchema.decode(result)
                }, () => {
                    return generateData(x, y)
                })
                .then(chunkData => {
                    delete this._loadingChunks[key]
                    return this._handleChunkData(x, y, chunkData)
                })
        }
        return this._loadingChunks[key]
    }

    loadChunksByPosition (x = 0, y = 0, maxDistance = 1000) {
        // bounding box
        var chunkX1 = Math.floor((x - maxDistance) / (8 * CHUNK_SIZE))
        var chunkX2 = Math.ceil((x + maxDistance) / (8 * CHUNK_SIZE))
        var chunkY1 = Math.floor((y - maxDistance) / (8 * CHUNK_SIZE))
        var chunkY2 = Math.ceil((y + maxDistance) / (8 * CHUNK_SIZE))

        let maxDistanceSquared = maxDistance * maxDistance

        // load chunks
        let chunksPromise = []
        for (let chunkX = chunkX1; chunkX <= chunkX2; chunkX++) {
            for (let chunkY = chunkY1; chunkY <= chunkY2; chunkY++) {
                let centerX = (chunkX + 0.5) * (8 * CHUNK_SIZE)
                let centerY = (chunkY + 0.5) * (8 * CHUNK_SIZE)
                let dx = centerX - x
                let dy = centerY - y
                let distanceSquared = (dx * dx) + (dy * dy)
                if (distanceSquared <= maxDistanceSquared) {
                    chunksPromise.push(this.loadChunk(chunkX, chunkY))
                }
            }
        }
        return Promise.all(chunksPromise)
    }

    update (updateData) {
        super.update(updateData)
        this.updateDirtyChunkData()
        this.updateDirtyPhysicsBodies()
        this.resetDirtyTags()
    }

    updateDirtyChunkData () {
        Object.keys(this.chunks)
            .forEach(key => {
                let chunk = this.chunks[key].chunk
                if (!chunk.isDummy && chunk.isDirty) {
                    redis.set('chunk:' + key, chunkSchema.encode(this.chunks[key].chunk.tiles))
                    this._dirtyChunkData[key] = {
                        x: this.chunks[key].x,
                        y: this.chunks[key].y,
                        data: this.chunks[key].chunk.tiles
                    }
                }
            })
    }

    resetDirtyChunkData () {
        let chunkData = this._dirtyChunkData
        this._dirtyChunkData = {}
        return Object.keys(chunkData).map(key => chunkData[key])
    }

    updateDirtyPhysicsBodies () {
        Object.keys(this.chunks)
            .forEach(key => {
                let chunk = this.chunks[key].chunk
                if (!chunk.isDummy && chunk.isDirty) {
                    this.updatePhysicsBody(this.chunks[key].x, this.chunks[key].y)
                }
            })
    }

    resetDirtyTags () {
        Object.keys(this.chunks)
            .forEach(key => {
                let chunk = this.chunks[key].chunk
                if (!chunk.isDummy && chunk.isDirty) {
                    chunk.isDirty = false
                }
            })
    }
}
