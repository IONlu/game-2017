export default class Keyboard {
    constructor (node, controller) {
        this.node = node
        this.controller = controller
        this.mapping = {}

        this.node.addEventListener('keydown', this._handleKeyDown, true)
        this.node.addEventListener('keyup', this._handleKeyUp, true)
        window.document.addEventListener('blur', this._handleBlur, true)
    }

    map (keyCode, name) {
        this.mapping[keyCode] = name
        return this
    }

    _handleKeyDown = function (evt) {
        if (evt.isTrusted && this.mapping.hasOwnProperty(evt.keyCode)) {
            this.controller.start(this.mapping[evt.keyCode])
        }
    }.bind(this)

    _handleKeyUp = function (evt) {
        if (evt.isTrusted && this.mapping.hasOwnProperty(evt.keyCode)) {
            this.controller.stop(this.mapping[evt.keyCode])
        }
    }.bind(this)

    _handleBlur = function () {
        for (let keyCode in this.mapping) {
            this.controller.stop(this.mapping[keyCode])
        }
    }.bind(this)

    destroy () {
        this.node.removeEventListener('keydown', this._handleKeyDown, true)
        this.node.removeEventListener('keyup', this._handleKeyUp, true)
        window.document.removeEventListener('blur', this._handleBlur, true)
    }
}
