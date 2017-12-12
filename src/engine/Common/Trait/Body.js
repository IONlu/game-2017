import { Trait } from '../Entity'
import {
    World as MatterWorld,
    Events as MatterEvents,
    Body as MatterBody
} from 'matter-js'

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
            if (Math.abs(collision.tangent.x) > 0) {
                this.colliding |= collision.penetration.y < 0
                    ? BodyTrait.COLLISION_DIRECTION_BOTTOM
                    : BodyTrait.COLLISION_DIRECTION_TOP
            }
            if (Math.abs(collision.tangent.y) > 0) {
                this.colliding |= collision.penetration.x < 0
                    ? BodyTrait.COLLISION_DIRECTION_RIGHT
                    : BodyTrait.COLLISION_DIRECTION_LEFT
            }
        })

        this.collisionData = collisions
    }.bind(this)

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
