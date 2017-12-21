import { Trait } from '../../Common/Entity'
import Vector from '../../Common/Vector'
import { Sprite, Texture, Rectangle } from 'pixi.js'
import BlockData from '@/assets/texture/block.json'

let arrowSpriteStack = []

export default class Gui extends Trait {
    constructor (app, options = {}) {
        super()
        this.app = app
        this.container = options.container || this.app.stage
        this.width = this.app.containerNode.clientWidth
        this.height = this.app.containerNode.clientHeight

        this.itemContainerSprite = new Sprite(this.app.resources.item_container.texture)
        this.itemContainerSprite.anchor.set(0.5)
        this.itemContainerSprite.position.set(this.width - 50, 50)
        this.itemContainerSprite.scale.x = 2
        this.itemContainerSprite.scale.y = 2
        this.itemContainerSprite.interactive = true
        this.itemContainerSprite.click = this._handleContainerClick.bind(this)

        this.container.addChild(this.itemContainerSprite)

        this.currentItem = 'pickaxe'
        this.itemSprites = {}
        this.initPickaxeSprite()
        this.initBlockSprites()

        this.remotePlayers = []
        this.arrowSprites = []
    }

    setRemotePlayers (remotePlayers) {
        this.remotePlayers = remotePlayers
    }

    _handleContainerClick (e) {
        let items = Object.keys(this.itemSprites)
        let index = items.indexOf(this.currentItem)
        this.itemSprites[items[index]].visible = false
        index = (index + 1) % items.length
        this.itemSprites[items[index]].visible = true
        this.currentItem = items[index]
    }

    initPickaxeSprite () {
        let sprite = new Sprite(this.app.resources.pickaxe.texture)
        sprite.anchor.set(0.5)
        sprite.position.set(this.width - 50, 50)
        sprite.scale.x = 1.5
        sprite.scale.y = 1.5
        sprite.visible = this.currentItem === 'pickaxe'
        this.itemSprites.pickaxe = sprite
        this.container.addChild(sprite)
    }

    initBlockSprites () {
        Object.keys(BlockData.frames).forEach(name => {
            let sprite = new Sprite(new Texture(
                this.app.resources.block.texture,
                new Rectangle(
                    BlockData.frames[name].frame.x,
                    BlockData.frames[name].frame.y,
                    32, 32
                )
            ))
            sprite.anchor.set(0.5)
            sprite.position.set(this.width - 50, 50)
            sprite.scale.x = 1.5
            sprite.scale.y = 1.5
            sprite.visible = this.currentItem === name
            this.itemSprites[name] = sprite
            this.container.addChild(sprite)
        })
    }

    render (entity, deltaTime, time) {
        super.render(entity, deltaTime, time)
        this.unloadArrowSprites()

        let absoluteScreenAngle = (new Vector(
            Math.abs(this.width),
            Math.abs(this.height)
        )).angle()
        let halfHeight = this.height / 2
        let halfWidth = this.width / 2
        let viewBox = this.app.camera.viewBox()

        this.remotePlayers.forEach(({ position }) => {
            if (
                position.x >= viewBox.x &&
                position.x <= viewBox.x + viewBox.width &&
                position.y >= viewBox.y &&
                position.y <= viewBox.y + viewBox.height
            ) {
                return
            }

            let arrow = arrowSpriteStack.pop() || (() => {
                let sprite = new Sprite(this.app.resources.arrow.texture)
                sprite.anchor.set(0.5, 0)
                return sprite
            })()
            this.arrowSprites.push(arrow)
            this.container.addChild(arrow)

            arrow.visible = true

            let vec = (new Vector(
                position.x - entity.position.x,
                position.y - entity.position.y
            )).normalize()
            arrow.rotation = vec.angle()

            let absolutePlayerAngle = (new Vector(
                Math.abs(position.x - entity.position.x),
                Math.abs(position.y - entity.position.y)
            )).angle()
            if (absolutePlayerAngle < absoluteScreenAngle) {
                vec.divide(Math.abs(vec.x)).multiply(halfWidth)
            } else {
                vec.divide(Math.abs(vec.y)).multiply(halfHeight)
            }
            arrow.position.set(
                halfWidth + vec.x,
                halfHeight + vec.y
            )
        })
    }

    unloadArrowSprites () {
        arrowSpriteStack = [
            ...arrowSpriteStack,
            ...this.arrowSprites.map(sprite => {
                sprite.visible = false
                this.container.removeChild(sprite)
                return sprite
            })
        ]
        this.arrowSprites = []
    }

    destroy () {
        this.unloadArrowSprites()

        this.container.removeChild(this.itemContainerSprite)

        Object.keys(this.itemSprites).forEach(item => {
            this.container.removeChild(this.itemSprites[item])
        })

        super.destroy()
    }
}
