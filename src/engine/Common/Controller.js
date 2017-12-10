import EventEmitter from 'events'

export default class Controller extends EventEmitter {
    constructor () {
        super()
        this.current = []
        this.mirror = []
    }

    update () {
        this.mirror = [ ...this.current ]
    }

    is (name) {
        return this.mirror.indexOf(name) > -1
    }

    start (name) {
        var index = this.current.indexOf(name)
        if (index === -1) {
            this.current.push(name)
            this.emit('start', name)
        }
    }

    stop (name) {
        var index = this.current.indexOf(name)
        if (index > -1) {
            this.current.splice(index, 1)
            this.emit('stop', name)
        }
    }
}
