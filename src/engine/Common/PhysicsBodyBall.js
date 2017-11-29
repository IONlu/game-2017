import { Trait } from './Entity'
import { Bodies, World, Body } from 'matter-js'

export default class PhysicsBody extends Trait {
    constructor (app, engine, x = 0, y = 0) {
        super()
        this.app = app
        this.engine = engine
        this.body = Bodies.circle((Math.random() * 1000) - 500, (Math.random() * 1000) - 1500, 8, {
            restitution: 0.4,
            mass: 0.1
        })
        Body.setPosition(this.body, {
            x, y
        })

        World.add(this.engine.world, this.body)
    }

    update (entity, updateData) {
        super.update(entity, updateData)

        entity.position.set(this.body.position.x, this.body.position.y)
        entity.rotation = this.body.angle
    }

    destruct () {
        World.remove(this.engine.world, this.body)
    }
}
