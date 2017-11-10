export default class Chunk {
    constructor (size) {
        this.size = size
        this.length = size * size
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
