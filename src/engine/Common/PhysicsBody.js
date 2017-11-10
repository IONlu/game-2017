import { Trait } from './Entity'
import { Bodies, Body, World, Events } from 'matter-js'

export default class PhysicsBody extends Trait {
    constructor (app, engine) {
        super()
        this.app = app
        this.engine = engine
        this.body = Bodies.fromVertices(0, -1000, [
            { x: -6, y: -14 },
            { x: 6, y: -14 },
            { x: 6, y: 10 },
            { x: 2, y: 14 },
            { x: -2, y: 14 },
            { x: -6, y: 10 }
        ], {
            inertia: Infinity,
            sleepThreshold: Infinity,
            mass: 2,
            friction: 0.002
        })

        World.add(this.engine.world, this.body)

        this.isCollidingLeft = false
        this.isCollidingRight = false
        this.isCollidingBottom = false

        Events.on(this.engine.engine, 'collisionStart', this._handleCollision.bind(this))
        Events.on(this.engine.engine, 'collisionActive', this._handleCollision.bind(this))
    }

    update (entity, updateData) {
        super.update(entity, updateData)

        if (this.app.keyboard.isDown(37) && !this.isCollidingLeft) {
            Body.setVelocity(this.body, {
                x: Math.max(-4, this.body.velocity.x - 1),
                y: this.body.velocity.y
            })
        }
        if (this.app.keyboard.isDown(39) && !this.isCollidingRight) {
            Body.setVelocity(this.body, {
                x: Math.min(4, this.body.velocity.x + 1),
                y: this.body.velocity.y
            })
        }
        if ((this.app.keyboard.isDown(38) || this.app.keyboard.isDown(32)) && this.isCollidingBottom) {
            Body.setVelocity(this.body, {
                x: this.body.velocity.x,
                y: Math.max(-5, this.body.velocity.y - 5)
            })
        }

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
        let collisions = evt.pairs.filter(collision => {
            if (collision.bodyA !== this.body && collision.bodyB !== this.body) {
                return false
            }
            return !collision.bodyA.isSensor && !collision.bodyB.isSensor
        })

        this.isCollidingLeft = false
        this.isCollidingRight = false
        this.isCollidingBottom = false

        collisions.forEach(({ collision }) => {
            if (Math.abs(collision.tangent.x) > 0) {
                this.isCollidingBottom = true
            }
            if (Math.abs(collision.tangent.y) > 0 && this.body.velocity.x > 0) {
                this.isCollidingRight = true
            }
            if (Math.abs(collision.tangent.y) > 0 && this.body.velocity.x < 0) {
                this.isCollidingLeft = true
            }
        })
    }

    destruct () {
        Events.off(this.engine.engine, 'collisionStart', this._handleCollision.bind(this))
        Events.off(this.engine.engine, 'collisionActive', this._handleCollision.bind(this))
        World.remove(this.engine.world, this.body)
    }
}
