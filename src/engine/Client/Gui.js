import { Sprite, Texture, Rectangle } from 'pixi.js'
import BlockData from '@/assets/texture/block.json'

export default class Gui {
    constructor (app, options = {}) {
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

    destroy () {
        this.container.removeChild(this.itemContainerSprite)

        Object.keys(this.itemSprites).forEach(item => {
            this.container.removeChild(this.itemSprites[item])
        })
    }
}
