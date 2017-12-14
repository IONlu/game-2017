import Entity from './Entity'
import BodyTrait from './Trait/Body'
import { Bodies as MatterBodies } from 'matter-js'

export default class Player extends Entity {
    constructor (app, options = {}) {
        super(app)

        let startPosition = options.position || {
            x: 0,
            y: 0
        }
        this.position.set(startPosition.x, startPosition.y)

        this.addTrait(
            new BodyTrait(
                app.physics.engine,
                MatterBodies.circle(this.position.x, this.position.y, 8, {
                    restitution: 0.5,
                    mass: 0.05
                })
            ),
            'body'
        )
        this.body.addToWorld(app.physics.world)
    }
}
