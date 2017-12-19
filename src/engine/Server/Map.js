import CommonMap from '../Common/Map'
import { generateData } from '../Common/Map/Chunk'
import { CHUNK_SIZE } from '../../config'

export default class Map extends CommonMap {
    constructor (app) {
        super(app)

        this._loadingChunks = {}
        this._dirtyChunkData = {}
        this.entities = []
    }

    setEntities (entities) {
        this.entities = entities
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

    update (updateData) {
        super.update(updateData)
        this.updateDirtyChunkData()
        this.loadUnloadPhysicsBodies()
        this.updateDirtyPhysicsBodies()
        this.resetDirtyTags()
    }

    updateDirtyChunkData () {
        Object.keys(this.chunks)
            .forEach(key => {
                let chunk = this.chunks[key].chunk
                if (!chunk.isDummy && chunk.isDirty) {
                    this._dirtyChunkData[key] = {
                        x: this.chunks[key].x,
                        y: this.chunks[key].y,
                        data: this.chunks[key].chunk.tiles
                    }
                }
            })
    }

    loadUnloadPhysicsBodies () {
        let { inside, outside } = this.getChunksByDistance(
            this.entities.map(entity => {
                return {
                    x: entity.position.x,
                    y: entity.position.y
                }
            }),
            1000
        )
        inside.forEach(chunk => {
            this.loadPhysics(chunk.x, chunk.y)
        })
        outside.forEach(chunk => {
            this.unloadPhysics(chunk.x, chunk.y)
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
