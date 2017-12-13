import EventEmitter from 'events'

export default class Loop extends EventEmitter {
    constructor (fps) {
        super()

        this.delta = 1000 / fps
        this.isRunning = false
        this.handle = null
        this.lastFrameTime = null
    }

    start () {
        this.isRunning = true
        this.lastFrameTime = Date.now()
        this._nextFrame()
    }

    stop () {
        this._cancelNext()
        this.lastFrameTime = null
        this.isRunning = false
    }

    _nextFrame () {
        this._cancelNext()

        let now = Date.now()
        let delay = Math.max(0, this.lastFrameTime + this.delta - now)

        this.handle = setTimeout(() => {
            this.lastFrameTime += this.delta
            this.emit('update')

            // start next frame
            this._nextFrame()
        }, delay)
    }

    _cancelNext () {
        if (this.handle) {
            clearTimeout(this.handle)
        }
    }
}
