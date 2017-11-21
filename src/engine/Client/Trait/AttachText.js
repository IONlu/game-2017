import { Trait } from '../../Common/Entity'
import { Text } from 'pixi.js'

export default class AttachText extends Trait {
    constructor (app, text) {
        super()
        this.app = app
        this.text = text

        this.sprite = new Text(text, {
            fontFamily: 'Hardpixel',
            fontSize: 20,
            fill: 0xFFFFFF,
            align: 'center'
        })
        this.sprite.scale.set(0.5)
        this.app.stage.addChild(this.sprite)
    }

    render (entity, t) {
        super.render(entity, t)

        this.sprite.position.set(
            entity.sprite.x - (this.sprite.width / 2),
            entity.sprite.y - (entity.sprite.height / 2) - this.sprite.height - 2
        )
    }

    destroy () {
        super.destroy()
        this.app.stage.removeChild(this.sprite)
    }
}
