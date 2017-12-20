import Entity from './Entity'
import BodyTrait from './Trait/Body'
import { Bodies as MatterBodies, Body as MatterBody } from 'matter-js'

export default class Player extends Entity {
    constructor (app, options = {}) {
        super(app)

        this.colorIndex = (options.colorIndex % 14) || 0
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
                    friction: 0,
                    restitution: 0.1
                })
            ),
            'body'
        )
        this.body.addToWorld(app.physics.world)
    }

    setController (controller) {
        this.controller = controller
        this.isRunning = false
        this.isJumping = false
    }

    update (updateData) {
        if (this.controller) {
            this.controller.update(updateData)
        }

        super.update(updateData)

        if (this.controller) {
            this.isRunning = false
            this.isJumping = false
            if (
                this.controller.is('left') &&
                !this.body.isColliding(BodyTrait.COLLISION_DIRECTION_LEFT)
            ) {
                this.isRunning = true
                MatterBody.setVelocity(this.body.body, {
                    x: Math.max(-3, this.body.body.velocity.x - 0.5),
                    y: this.body.body.velocity.y
                })
            }

            if (
                this.controller.is('right') &&
                !this.body.isColliding(BodyTrait.COLLISION_DIRECTION_RIGHT)
            ) {
                this.isRunning = true
                MatterBody.setVelocity(this.body.body, {
                    x: Math.min(3, this.body.body.velocity.x + 0.5),
                    y: this.body.body.velocity.y
                })
            }

            if (
                !this.controller.is('right') &&
                !this.controller.is('left')
            ) {
                if (this.body.body.velocity.x >= 0) {
                    MatterBody.setVelocity(this.body.body, {
                        x: Math.max(0, this.body.body.velocity.x - 0.5),
                        y: this.body.body.velocity.y
                    })
                } else {
                    MatterBody.setVelocity(this.body.body, {
                        x: Math.min(0, this.body.body.velocity.x + 0.5),
                        y: this.body.body.velocity.y
                    })
                }
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
