import { Trait } from '../../Common/Entity'
import { Text } from 'pixi.js'

export default class PositionDialog extends Trait {
    constructor (app) {
        super()
        this.app = app

        this.sprite = new Text('', {
            fontFamily: 'Hardpixel',
            fontSize: 20,
            fill: 0xFFFFFF,
            align: 'left'
        })
        this.sprite.position.set(10, 10)
        this.app.ui.addChild(this.sprite)
    }

    render (entity, t) {
        super.render(entity, t)
        let text = [
            'X: ' + Math.round(entity.sprite.position.x / 16) + 'm',
            'Y: ' + -Math.round(entity.sprite.position.y / 16) + 'm'
        ].join('\n')

        if (this.sprite.text !== text) {
            this.sprite.text = text
        }
    }

    destroy () {
        super.destroy()
        this.app.ui.removeChild(this.sprite)
    }
}
