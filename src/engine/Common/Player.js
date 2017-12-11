import Entity from './Entity'
import BodyTrait from './Trait/Body'
import { Bodies as MatterBodies, Body as MatterBody } from 'matter-js'

export default class Player extends Entity {
    constructor (app, options = {}) {
        super(app)

        let startPosition = options.position || {
            x: 0,
            y: 0
        }
        this.position.set(startPosition.x, startPosition.y)

        this.isRunning = false
        this.isJumping = false

        this.addTrait(
            new BodyTrait(
                app.physics.engine,
                MatterBodies.fromVertices(this.position.x, this.position.y, [
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
            ),
            'body'
        )
        this.body.addToWorld(app.physics.world)
    }

    setController (controller) {
        this.controller = controller
    }

    update (updateData) {
        super.update(updateData)

        this.isRunning = false
        this.isJumping = false

        if (this.controller) {
            if (this.controller.is('left') && !this.body.isColliding(BodyTrait.COLLISION_DIRECTION_LEFT)) {
                this.isRunning = true
                MatterBody.setVelocity(this.body.body, {
                    x: Math.max(-4, this.body.body.velocity.x - 1),
                    y: this.body.body.velocity.y
                })
            }
            if (this.controller.is('right') && !this.body.isColliding(BodyTrait.COLLISION_DIRECTION_RIGHT)) {
                this.isRunning = true
                MatterBody.setVelocity(this.body.body, {
                    x: Math.min(4, this.body.body.velocity.x + 1),
                    y: this.body.body.velocity.y
                })
            }
            if ((this.controller.is('jump'))) {
                if (this.body.isColliding(BodyTrait.COLLISION_DIRECTION_BOTTOM)) {
                    MatterBody.setVelocity(this.body.body, {
                        x: this.body.body.velocity.x,
                        y: Math.max(-5, this.body.body.velocity.y - 5)
                    })
                } else {
                    this.isJumping = true
                }
            }
        }
    }
}
