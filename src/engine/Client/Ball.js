import Entity from './Entity'
import { Sprite, Texture } from 'pixi.js'

export default class Player extends Entity {
    constructor (app) {
        super(app)

        this.sprite = new Sprite(new Texture(this.app.resources.ball.texture))
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
}
