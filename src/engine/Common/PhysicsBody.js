import { Trait } from './Entity'
import { Bodies, Body, World, Events } from 'matter-js'

export default class PhysicsBody extends Trait {
    constructor (app, engine) {
        super()
        this.app = app
        this.engine = engine
        this.body = Bodies.rectangle(0, -1000, 12, 28, {
            inertia: Infinity,
            sleepThreshold: Infinity
        })

        World.add(this.engine.world, this.body)

        this.isColliding = false
        Events.on(this.engine.engine, 'collisionStart', this._handleCollision.bind(this))
        Events.on(this.engine.engine, 'collisionActive', this._handleCollision.bind(this))
    }

    update (entity, updateData) {
        super.update(entity, updateData)

        if (this.app.keyboard.isDown(37)) {
            Body.setVelocity(this.body, {
                x: -4,
                y: this.body.velocity.y
            })
        }
        if (this.app.keyboard.isDown(39)) {
            Body.setVelocity(this.body, {
                x: 4,
                y: this.body.velocity.y
            })
        }
        if (this.app.keyboard.isDown(38) && this.isColliding) {
            Body.setVelocity(this.body, {
                x: this.body.velocity.x,
                y: Math.max(-5, this.body.velocity.y - 5)
            })
        }

        console.log(this.body.velocity.x)

        entity.position.set(this.body.position.x, this.body.position.y)
        entity.rotation = this.body.angle

        if (this.body.velocity.x > 0) {
            entity.sprite.scale.x = Math.abs(entity.sprite.scale.x)
        }
        if (this.body.velocity.x < 0) {
            entity.sprite.scale.x = -Math.abs(entity.sprite.scale.x)
        }
    }

    _handleCollision (evt) {
        this.isColliding = !!evt.pairs.find(collision => {
            return !collision.bodyA.isSensor && !collision.bodyB.isSensor &&
                (collision.bodyA === this.body || collision.bodyB === this.body)
        })
    }

    destruct () {
        Events.off(this.engine.engine, 'collisionStart', this._handleCollision.bind(this))
        Events.off(this.engine.engine, 'collisionActive', this._handleCollision.bind(this))
        World.remove(this.engine.world, this.body)
    }
}
