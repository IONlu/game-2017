exports.Keyboard = class Keyboard {
    constructor (node) {
        this.node = node
        this.current = []
        this.mirror = []

        this.node.addEventListener('keydown', this._handleKeyDown.bind(this), true)
        this.node.addEventListener('keyup', this._handleKeyUp.bind(this), true)
    }

    update () {
        this.mirror = [ ...this.current ]
    }

    isDown (key) {
        return this.mirror.indexOf(key) > -1
    }

    _handleKeyDown (event) {
        var code = event.keyCode
        var index = this.current.indexOf(code)
        if (index === -1) {
            this.current.push(code)
        }
    }

    _handleKeyUp (event) {
        var code = event.keyCode
        var index = this.current.indexOf(code)
        if (index > -1) {
            this.current.splice(index, 1)
        }
    }
}
