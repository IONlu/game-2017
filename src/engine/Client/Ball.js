import CommonBall from '../Common/Ball'
import { Sprite } from 'pixi.js'

export default class Ball extends CommonBall {
    constructor (app) {
        super(app)

        this.sprite = new Sprite(this.app.resources.ball.texture)
        this.sprite.anchor.set(0.5)
        this.sprite.scale.x = 0.5
        this.sprite.scale.y = 0.5

        this.app.stage.addChild(this.sprite)
    }

    render (t) {
        super.render(t)

        this.sprite.position.set(
            this.old.position.x + (t * (this.position.x - this.old.position.x)),
            this.old.position.y + (t * (this.position.y - this.old.position.y))
        )
        this.sprite.rotation = this.old.rotation + (t * (this.rotation - this.old.rotation))
    }

    destroy () {
        super.destroy()
        this.app.stage.removeChild(this.sprite)
    }
}
