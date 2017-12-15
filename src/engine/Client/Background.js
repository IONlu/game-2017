import { extras, Texture, Graphics } from 'pixi.js'

export default class Background {
    constructor (app) {
        this.app = app
        this.container = this.app.createLayer(0)

        this.width = this.app.containerNode.clientWidth
        this.height = this.app.containerNode.clientHeight

        this.scrollSpeed = {
            1: 0.25,
            2: 0.075,
            3: 0.025
        }

        this.fillColor = {
            1: 0x6b9027,
            2: 0x000000,
            3: 0x000000
        }

        for (let i = 3; i >= 1; i--) {
            this['layer' + i] = new extras.TilingSprite(
                new Texture(this.app.resources['bg_layer' + i].texture),
                this.width,
                this.app.resources['bg_layer' + i].texture.height * 0.5
            )

            this['layer' + i].tileScale.x = 0.5
            this['layer' + i].tileScale.y = 0.5
            this['layer' + i].tilePosition.x = 0
            this['layer' + i].position.y = 0

            this.container.addChild(this['layer' + i])

            this['fillrect' + i] = new Graphics()
            this['fillrect' + i].beginFill(this.fillColor[i], 1)
            this['fillrect' + i].drawRect(0, 0, this.width, this.height)
            this['fillrect' + i].position.y = this['layer' + i].position.y + this['layer' + i].height

            this.container.addChild(this['fillrect' + i])
        }
    }

    setPosition (x, y) {
        for (let i = 3; i >= 1; i--) {
            this['layer' + i].tilePosition.x = -Math.round((x * this.scrollSpeed[i]))
            this['layer' + i].position.y = -Math.round((y * this.scrollSpeed[i] / 10))
            this['fillrect' + i].position.y = this['layer' + i].position.y + this['layer' + i].height
        }
    }
}
