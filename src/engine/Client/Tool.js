import { Trait } from '../Common/Entity'
import { Graphics } from 'pixi.js'

export default class Tool extends Trait {
    constructor (app) {
        super()
        this.app = app
        this.size = 3
        this.sprite = new Graphics()
        this.updateToolSprite()

        this.app.stage.addChild(this.sprite)

        window.document.body.addEventListener('wheel', this._handleMouseWheel.bind(this))
    }

    _handleMouseWheel (evt) {
        if (evt.deltaY > 0) {
            this.size++
        }
        if (evt.deltaY < 0) {
            this.size--
        }
        this.size = Math.max(1, Math.min(4, this.size))
        this.updateToolSprite()
    }

    updateToolSprite () {
        this.sprite.clear()
        this.sprite.lineStyle(0.5, 0x000000)
        this.sprite.drawCircle(0, 0, this.size * 4)
    }

    render (entity, t) {
        super.render(entity, t)

        let targetPosition = this.app.screenToWorldPosition(
            this.app.mousePosition.x,
            this.app.mousePosition.y
        )

        this.sprite.position.set(targetPosition.x, targetPosition.y)
    }
}
