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
        if (!chunk.isEmpty) {
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

    loadChunksByPosition (x = 0, y = 0, distance = 10000) {
        // bounding box
        var chunkX = Math.floor((x - distance) / (8 * CHUNK_SIZE))
        var chunkX2 = Math.ceil((x + distance) / (8 * CHUNK_SIZE)) + 1
        var chunkY = Math.floor((y - distance) / (8 * CHUNK_SIZE))
        var chunkY2 = Math.ceil((y + distance) / (8 * CHUNK_SIZE)) + 1

        // load chunks
        let chunksPromise = []
        for (let x = chunkX; x < chunkX2; x++) {
            for (let y = chunkY; y < chunkY2; y++) {
                chunksPromise.push(this.loadChunk(x, y))
            }
        }
        return Promise.all(chunksPromise)
    }
}
