import { CHUNK_SIZE } from '../../../config'
import { tile as getTileType } from '../Terrain.js'

export default class Chunk {
    constructor (size, isDummy = false) {
        this.size = size
        this.length = size * size
        this.isDummy = isDummy
        this.clear()
    }

    _getIndexFromPosition (x, y) {
        if (x >= this.size || y >= this.size) {
            throw new Error(`[${x},${y}] is out of range`)
        }
        return x + (y * this.size)
    }

    clear () {
        this.tiles = new Array(this.length)
        this.isDirty = true
    }

    load (tiles) {
        tiles = tiles.slice(0, this.length)
        this.tiles = [
            ...tiles,
            new Array(this.length - tiles.length)
        ]
        this.isDirty = true
    }

    set (x, y, tileData) {
        this.tiles[this._getIndexFromPosition(x, y)] = tileData
        this.isDirty = true
        return tileData
    }

    get (x, y) {
        return this.tiles[this._getIndexFromPosition(x, y)]
    }
}

export const generateData = (x, y) => {
    return new Promise(resolve => {
        let chunkData = []
        for (let j = 0; j < CHUNK_SIZE; j++) {
            for (let i = 0; i < CHUNK_SIZE; i++) {
                chunkData.push(getTileType((x * CHUNK_SIZE) + i, (y * CHUNK_SIZE) + j))
            }
        }
        resolve(chunkData)
    })
}
