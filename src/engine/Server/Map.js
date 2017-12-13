import CommonMap from '../Common/Map'
import { generateData } from '../Common/Map/Chunk'
import { CHUNK_SIZE } from '../../config'

export default class Map extends CommonMap {
    constructor (app) {
        super(app)

        this._loadingChunks = {}
    }

    async loadChunk (x, y) {
        let chunk = this.createChunkIfNone(x, y)
        if (!chunk.isDummy) {
            return chunk
        }
        if (!this._loadingChunks.hasOwnProperty(x + ';' + y)) {
            this._loadingChunks[x + ';' + y] = generateData(x, y)
                .then(chunkData => {
                    delete this._loadingChunks[x + ';' + y]
                    return this._handleChunkData(x, y, chunkData)
                })
            this._loadingChunks[x + ';' + y].then(() => {
                this.updatePhysicsBody(x, y)
            })
        }
        return this._loadingChunks[x + ';' + y]
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

    getDirtyChunkData () {
        return Object.keys(this.chunks)
            .filter(key => {
                if (this.chunks[key].chunk.isDummy) {
                    return false
                }
                let isDirty = this.chunks[key].chunk.isDirty
                this.chunks[key].chunk.isDirty = false
                return isDirty
            })
            .map(key => {
                return {
                    version: 1,
                    x: this.chunks[key].x,
                    y: this.chunks[key].y,
                    data: this.chunks[key].chunk.tiles
                }
            })
    }

    setTiles (tiles, type = null) {
        super.setTiles(tiles, type)

        let chunks = {}
        tiles.forEach(tile => {
            let chunkX = Math.floor(tile.x / CHUNK_SIZE)
            let chunkY = Math.floor(tile.y / CHUNK_SIZE)
            if (!chunks.hasOwnProperty(chunkX + ';' + chunkY)) {
                chunks[chunkX + ';' + chunkY] = {
                    x: chunkX,
                    y: chunkY
                }
            }
        })
        for (let key in chunks) {
            this.updatePhysicsBody(chunks[key].x, chunks[key].y)
        }
    }
}
