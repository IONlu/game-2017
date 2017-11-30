import { CHUNK_SIZE } from '../../../config'
import { tile as getTileType } from '../Terrain.js'

export default class Chunk {
    constructor (size, isDummy = false) {
        this.size = size
        this.length = size * size
        this.isDummy = isDummy
        this.clear()
    }

    _getIndexFromPosition (x, y, background = false) {
        if (x >= this.size || y >= this.size) {
            throw new Error(`[${x},${y}] is out of range`)
        }
        let index = (x + (y * this.size)) * 2
        if (!background) {
            index += 1
        }
        return index
    }

    clear () {
        this.tiles = new Array(this.length)
        this.isDirty = true
    }

    load (tiles) {
        tiles = tiles.slice(0, this.length * 2)
        this.tiles = [
            ...tiles,
            new Array((this.length * 2) - tiles.length)
        ]
        this.isDirty = true
    }

    set (x, y, tileData, background = false) {
        this.tiles[this._getIndexFromPosition(x, y, background)] = tileData
        this.isDirty = true
        return tileData
    }

    get (x, y, background = false) {
        return this.tiles[this._getIndexFromPosition(x, y, background)]
    }
}

export const generateData = (x, y) => {
    return new Promise(resolve => {
        let chunkData = []
        for (let j = 0; j < CHUNK_SIZE; j++) {
            for (let i = 0; i < CHUNK_SIZE; i++) {
                let tileX = (x * CHUNK_SIZE) + i
                let tileY = (y * CHUNK_SIZE) + j
                chunkData.push(getTileType(tileX, tileY, true))
                chunkData.push(getTileType(tileX, tileY))
            }
        }
        resolve(chunkData)
    })
}
