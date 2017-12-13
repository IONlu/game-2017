import { Trait } from '../Entity'
import {
    World as MatterWorld,
    Events as MatterEvents,
    Body as MatterBody,
    Vector as MatterVector
} from 'matter-js'

const lerp = (a, b, n) => {
    return (1 - n) * a + n * b
}

const BodyTrait = class Body extends Trait {
    constructor (engine, body) {
        super()
        this.engine = engine
        this.body = body
        this.world = null
        this.colliding = 0

        MatterEvents.on(this.engine, 'collisionStart', this._handleCollision)
        MatterEvents.on(this.engine, 'collisionActive', this._handleCollision)
    }

    addToWorld (world) {
        if (world !== this.world) {
            this.removeFromWorld()
            this.world = world
            MatterWorld.add(world, this.body)
        }
        return this
    }

    removeFromWorld () {
        if (this.world) {
            MatterWorld.remove(this.world, this.body)
            this.world = null
        }
        return this
    }

    setPosition (x, y) {
        MatterBody.setPosition(this.body, {
            x, y
        })
        return this
    }

    update (entity, updateData) {
        this.colliding = 0
        super.update(entity, updateData)

        entity.position.set(this.body.position.x, this.body.position.y)
        entity.rotation = this.body.angle
    }

    isColliding (direction) {
        if (!direction) {
            return this.colliding > 0
        }
        return (this.colliding & direction) > 0
    }

    _handleCollision = function (evt) {
        let collisions = evt.pairs.filter(collision => {
            if (collision.bodyA !== this.body && collision.bodyB !== this.body) {
                return false
            }
            return !collision.bodyA.isSensor && !collision.bodyB.isSensor
        })

        collisions.forEach(({ collision }) => {
            let collisionVector = collision.bodyA === this.body
                ? MatterVector.neg(collision.normal)
                : MatterVector.clone(collision.normal)
            if (
                Math.abs(collisionVector.x) >= Math.abs(collisionVector.y)
            ) {
                this.colliding |= collisionVector.x > 0
                    ? BodyTrait.COLLISION_DIRECTION_RIGHT
                    : BodyTrait.COLLISION_DIRECTION_LEFT
            }
            if (
                Math.abs(collisionVector.y) >= Math.abs(collisionVector.x)
            ) {
                this.colliding |= collisionVector.y > 0
                    ? BodyTrait.COLLISION_DIRECTION_BOTTOM
                    : BodyTrait.COLLISION_DIRECTION_TOP
            }
        })

        this.collisionData = collisions
    }.bind(this)

    exportState () {
        return {
            angle: this.body.angle,
            angularVelocity: this.body.angularVelocity,
            position: this.body.position,
            velocity: this.body.velocity
        }
    }

    importState (state, interpolate = 1) {
        MatterBody.setAngle(this.body, lerp(this.body.angle, state.angle, interpolate))
        MatterBody.setAngularVelocity(this.body, lerp(this.body.angularVelocity, state.angularVelocity, interpolate))
        MatterBody.setPosition(this.body, {
            x: lerp(this.body.position.x, state.position.x, interpolate),
            y: lerp(this.body.position.y, state.position.y, interpolate)
        })
        MatterBody.setVelocity(this.body, {
            x: lerp(this.body.velocity.x, state.velocity.x, interpolate),
            y: lerp(this.body.velocity.y, state.velocity.y, interpolate)
        })
    }

    destroy () {
        this.removeFromWorld()
        MatterEvents.off(this.engine, 'collisionStart', this._handleCollision)
        MatterEvents.off(this.engine, 'collisionActive', this._handleCollision)
        super.destroy()
    }
}

BodyTrait.COLLISION_DIRECTION_TOP = 1
BodyTrait.COLLISION_DIRECTION_RIGHT = 2
BodyTrait.COLLISION_DIRECTION_BOTTOM = 4
BodyTrait.COLLISION_DIRECTION_LEFT = 8

export default BodyTrait
