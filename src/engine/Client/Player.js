import CommonPlayer from '../Common/Player'
import { Sprite, Texture, Rectangle } from 'pixi.js'

export default class Player extends CommonPlayer {
    constructor (app, options = {}) {
        super(app, options)

        this.animations = {
            default: [ 3 ],
            run: [ 41, 42, 43, 44 ],
            jump: [ 43 ]
        }
        this.initAnimationTextures()
        this.currentAnimation = 'default'
        this.bindSpriteDirectionToMouse = options.bindSpriteDirectionToMouse || false

        this.sprite = new Sprite(this.animationTextures[this.currentAnimation][0])
        this.sprite.anchor.set(0.5)
        this.sprite.scale.x = 0.5
        this.sprite.scale.y = 0.5

        this.app.stage.addChild(this.sprite)
    }

    initAnimationTextures () {
        this.animationTextures = {}
        for (let name in this.animations) {
            this.animationTextures[name] = this.animations[name].map(index => {
                return new Texture(
                    this.app.resources.player.texture,
                    new Rectangle(
                        (index % 20) * 48, (Math.floor(index / 20) * 56) + (6 * 56 * this.colorIndex),
                        48, 56
                    )
                )
            })
        }
    }

    update (updateData) {
        super.update(updateData)

        this.currentAnimation = 'default'
        if (this.isJumping) {
            this.currentAnimation = 'jump'
        } else if (this.isRunning) {
            this.currentAnimation = 'run'
        }
    }

    render (dtime, time) {
        super.render(dtime, time)

        if (!this.old) {
            return
        }

        this.sprite.position.set(
            this.old.position.x + (dtime * (this.position.x - this.old.position.x)),
            this.old.position.y + (dtime * (this.position.y - this.old.position.y))
        )
        this.sprite.rotation = this.old.rotation + (dtime * (this.rotation - this.old.rotation))

        // update texture
        this.sprite.texture = this.animationTextures[this.currentAnimation][Math.floor(time / 200) % this.animationTextures[this.currentAnimation].length]

        // update sprite direction
        this.updateSpriteDirection()
    }

    updateSpriteDirection () {
        if (this.bindSpriteDirectionToMouse) {
            // turn sprite in mouse direction
            let targetPosition = this.app.screenToWorldPosition(
                this.app.mousePosition.x,
                this.app.mousePosition.y
            )
            if (targetPosition.x - this.sprite.position.x > 0) {
                this.sprite.scale.x = Math.abs(this.sprite.scale.x)
            }
            if (targetPosition.x - this.sprite.position.x < 0) {
                this.sprite.scale.x = -Math.abs(this.sprite.scale.x)
            }
        } else {
            if (this.body.body.velocity.x > 0) {
                this.sprite.scale.x = Math.abs(this.sprite.scale.x)
            } else if (this.body.body.velocity.x < 0) {
                this.sprite.scale.x = -Math.abs(this.sprite.scale.x)
            }
        }
    }

    destroy () {
        super.destroy()
        this.app.stage.removeChild(this.sprite)
    }
}
