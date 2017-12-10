export default class Keyboard {
    constructor (node) {
        this.node = node
        this.controllers = []

        this.node.addEventListener('keydown', this._handleKeyDown, true)
        this.node.addEventListener('keyup', this._handleKeyUp, true)
        window.document.addEventListener('blur', this._handleBlur, true)
    }

    bind (controller, mapping) {
        this.unbind(controller)
        let bind = {
            controller,
            mapping: []
        }
        for (let name in mapping) {
            let keyCodes = mapping[name] instanceof Array
                ? mapping[name]
                : [ mapping[name] ]
            keyCodes.forEach(keyCode => {
                bind.mapping[keyCode] = name
            })
        }
        this.controllers.push(bind)
        return this
    }

    unbind (controller) {
        let index = this.controllers.findIndex(bind => {
            return bind.controller === controller
        })
        if (index > -1) {
            this.controllers.splice(index, 1)
        }
    }

    _handleKeyDown = function (evt) {
        if (evt.isTrusted) {
            this.controllers.forEach(({ controller, mapping }) => {
                if (mapping.hasOwnProperty(evt.keyCode)) {
                    controller.start(mapping[evt.keyCode])
                }
            })
        }
    }.bind(this)

    _handleKeyUp = function (evt) {
        if (evt.isTrusted) {
            this.controllers.forEach(({ controller, mapping }) => {
                if (mapping.hasOwnProperty(evt.keyCode)) {
                    controller.stop(mapping[evt.keyCode])
                }
            })
        }
    }.bind(this)

    _handleBlur = function () {
        this.controllers.forEach(({ controller, mapping }) => {
            for (let keyCode in mapping) {
                controller.stop(mapping[keyCode])
            }
        })
    }.bind(this)

    destroy () {
        this.node.removeEventListener('keydown', this._handleKeyDown, true)
        this.node.removeEventListener('keyup', this._handleKeyUp, true)
        window.document.removeEventListener('blur', this._handleBlur, true)
    }
}
