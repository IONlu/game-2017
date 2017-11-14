const { Trait } = require('../Common/Entity')
const { Graphics, Point } = require('pixi.js')

exports.Tool = class Tool extends Trait {
    constructor (app) {
        super()
        this.app = app
        this.size = 3
        this.position = new Point()
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

        let dx = targetPosition.x - entity.sprite.position.x
        let dy = targetPosition.y - entity.sprite.position.y
        let distance = Math.sqrt(dx * dx + dy * dy)

        let toolX = targetPosition.x
        let toolY = targetPosition.y
        if (distance + ((this.size / 2) * 8) > (8 * 8)) {
            toolX = ((dx / distance) * ((8 - (this.size / 2)) * 8)) + entity.sprite.position.x
            toolY = ((dy / distance) * ((8 - (this.size / 2)) * 8)) + entity.sprite.position.y
        }
        this.position = new Point(toolX, toolY)

        this.sprite.position.set(toolX, toolY)
    }
}
