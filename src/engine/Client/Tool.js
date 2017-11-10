import Entity from './Entity'
import { Graphics } from 'pixi.js'

export default class Tool extends Entity {
    constructor (app) {
        super(app)

        this.size = 3
        this.sprite = new Graphics()
        this.updateToolSprite()

        this.app.stage.addChild(this.sprite)
    }

    updateToolSprite () {
        this.sprite.clear()
        this.sprite.lineStyle(1, 0x000000)
        this.sprite.drawCircle(0, 0, this.size * 4)
    }

    render (t) {
        super.render(t)

        let targetPosition = this.app.screenToWorldPosition(
            this.app.mousePosition.x,
            this.app.mousePosition.y
        )

        this.sprite.position.set(targetPosition.x, targetPosition.y)
    }
}
