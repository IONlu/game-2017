export default class Vector {
    constructor (x = 0, y = 0) {
        this.x = x
        this.y = y
    }

    clone () {
        return new Vector(this.x, this.y)
    }

    copy (vector) {
        this.x = vector.x
        this.y = vector.y
    }

    equals (vector) {
        return this.x === vector.x && this.y === vector.y
    }

    set (x, y) {
        this.x = x
        this.y = y
    }
}
