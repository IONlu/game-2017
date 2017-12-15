import { extras, Texture } from 'pixi.js'

export default class Background {
    constructor (app) {
        this.app = app
        this.container = this.app.createLayer(0)

        this.scrollSpeed = {
            1: 0.25,
            2: 0.075,
            3: 0.025
        }

        for (let i = 3; i >= 1; i--) {
            this['layer' + i] = new extras.TilingSprite(
                new Texture(this.app.resources['bg_layer' + i].texture),
                this.app.containerNode.clientWidth,
                this.app.resources['bg_layer' + i].texture.height
            )

            this['layer' + i].tileScale.x = 0.5
            this['layer' + i].tileScale.y = 0.5
            this['layer' + i].tilePosition.x = 0
            this['layer' + i].position.y = 0

            this.container.addChild(this['layer' + i])
        }
    }

    setPosition (x, y) {
        for (let i = 3; i >= 1; i--) {
            this['layer' + i].tilePosition.x = -Math.round((x * this.scrollSpeed[i]))
            this['layer' + i].position.y = -Math.round((y * this.scrollSpeed[i] / 10))
        }
    }
}
