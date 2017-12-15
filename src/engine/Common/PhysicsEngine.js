import { Engine, Events } from 'matter-js'

var stateProps = [
    'angle', 'anglePrev',
    'position', 'positionPrev',
    'velocity'
]

export default class PhysicsEngine {
    constructor () {
        this.engine = Engine.create({
            enableSleeping: true
        })
        this.world = this.engine.world

        Events.on(this.engine, 'collisionStart', this._handleCollisions.bind(this))
        Events.on(this.engine, 'collisionActive', this._handleCollisions.bind(this))

        this.world.gravity.x = 0
        this.world.gravity.y = 1
    }

    update () {
        Engine.update(this.engine, 1000 / 60)
    }

    _handleCollisions (ev) {
        ev.pairs.forEach(collision => {
            var dataA = collision.bodyA.userData || {}
            var dataB = collision.bodyB.userData || {}
            if (dataA.entity && dataA.entity.onCollision) {
                dataA.entity.onCollision(dataB.entity || null, collision)
            }
            if (dataB.entity && dataB.entity.onCollision) {
                dataB.entity.onCollision(dataA.entity || null, collision)
            }
        })
    }

    getState (entity) {
        if (!entity.physicsBody) {
            return null
        }

        var state = {}
        stateProps.forEach(prop => {
            state[prop] = entity.physicsBody[prop]
        })

        return {
            ...entity.physicsBody
        }
    }
}
