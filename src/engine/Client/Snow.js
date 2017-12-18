import { Emitter } from 'pixi-particles'
import Entity from '../Common/Entity'
import ParticleConfig from '../../particles/snow.json'

export default class Snow extends Entity {
    constructor (app, options = {}) {
        super(app, options)
        this.container = options.container || this.app.stage
        this.emitter = new Emitter(
            this.container,
            [ this.app.resources.snow.texture ],
            ParticleConfig
        )
    }

    start () {
        this.emitter.emit = true
    }

    stop () {
        this.emitter.emit = false
    }

    render (dtime, time) {
        super.render(dtime, time)
        this.emitter.update(dtime * 0.02)
    }
}
