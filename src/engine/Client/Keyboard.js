export default class Keyboard {
    constructor (node) {
        this.node = node
        this.current = []
        this.mirror = []

        this.node.addEventListener('keydown', this._handleKeyDown, true)
        this.node.addEventListener('keyup', this._handleKeyUp, true)
        window.document.addEventListener('blur', this._handleBlur, true)
    }

    update () {
        this.mirror = [ ...this.current ]
    }

    isDown (key) {
        return this.mirror.indexOf(key) > -1
    }

    _handleKeyDown = function (evt) {
        if (evt.isTrusted) {
            var code = evt.keyCode
            var index = this.current.indexOf(code)
            if (index === -1) {
                this.current.push(code)
            }
        }
    }.bind(this)

    _handleKeyUp = function (evt) {
        if (evt.isTrusted) {
            var code = evt.keyCode
            var index = this.current.indexOf(code)
            if (index > -1) {
                this.current.splice(index, 1)
            }
        }
    }.bind(this)

    _handleBlur = function () {
        this.current = []
        this.mirror = []
    }.bind(this)

    destroy () {
        this.node.removeEventListener('keydown', this._handleKeyDown, true)
        this.node.removeEventListener('keyup', this._handleKeyUp, true)
        window.document.removeEventListener('blur', this._handleBlur, true)
    }
}
