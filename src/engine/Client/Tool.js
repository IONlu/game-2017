import { Trait } from '../Common/Entity'
import { Graphics, Point } from 'pixi.js'

let spriteStack = []

export default class Tool extends Trait {
    constructor (app) {
        super()
        this.app = app
        this.size = 3
        this.position = new Point()

        this.sprites = []

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

        this.renderRectangles()
    }

    renderRectangles () {
        spriteStack = [
            ...spriteStack,
            ...this.sprites
        ]
        this.sprites = []

        let x = (this.position.x / 8) - 0.5
        let y = (this.position.y / 8) - 0.5

        let radius = (this.size / 2)
        let radiusSquared = radius * radius
        for (let i = Math.floor(x - radius); i <= Math.ceil(x + radius); i++) {
            for (let j = Math.floor(y - radius); j <= Math.ceil(y + radius); j++) {
                let dx = i - x
                let dy = j - y
                let distanceSquared = dx * dx + dy * dy
                if (distanceSquared <= radiusSquared) {
                    let sprite = spriteStack.pop() || this.createSprite()
                    sprite.position.set(
                        i * 8,
                        j * 8
                    )
                    sprite.visible = true
                    this.sprites.push(sprite)
                }
            }
        }

        spriteStack.forEach(sprite => {
            sprite.visible = false
        })
    }

    createSprite () {
        let sprite = new Graphics()
        sprite.beginFill(0xFFFFFF, 0.5)
        sprite.drawRect(0, 0, 8, 8)
        this.app.stage.addChild(sprite)
        return sprite
    }

    destroy () {
        super.destroy()
        spriteStack = [
            ...spriteStack,
            ...this.sprites
        ]
        this.sprites = []
        spriteStack.forEach(sprite => {
            sprite.visible = false
        })
    }
}
