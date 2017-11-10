import GameEngineCommon from '../Common/GameEngine'
import Keyboard from './Keyboard'
import Camera from './Camera'
import * as PIXI from 'pixi.js'

export default class GameEngine extends GameEngineCommon {
    constructor (loop, containerNode) {
        super(loop)

        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST

        this.loader = new PIXI.loaders.Loader()
        this.resources = {}

        this.containerNode = containerNode || document.body
        this.layers = new PIXI.Container()

        this.renderer = PIXI.autoDetectRenderer(
            this.containerNode.clientWidth,
            this.containerNode.clientHeight, {
                antialias: true,
                transparent: false,
                resolution: 1,
                backgroundColor: 0x87CEEB
            }
        )
        this.containerNode.appendChild(this.renderer.view)

        this.stage = this.createLayer()
        this.camera = new Camera(this)

        // TODO: bind to game node
        this.keyboard = new Keyboard(document.body)

        this.loop.on('render', this.render.bind(this))

        this.viewBoxGraphics = new PIXI.Graphics()
        this.stage.addChild(this.viewBoxGraphics)

        this.mousePosition = new PIXI.Point()
        window.document.body.addEventListener('mousemove', this._handleMouseMove.bind(this))
    }

    createLayer (index) {
        var layer = new PIXI.Container()
        if (typeof index !== 'undefined') {
            this.layers.addChildAt(layer, index)
        } else {
            this.layers.addChild(layer)
        }
        return layer
    }

    update () {
        this.keyboard.update()

        super.update()
    }

    render (delta) {
        this.camera.placeContainer(this.stage)

        this.entities.forEach(entity => {
            if (entity.render) {
                entity.render(delta)
            }
        })

        this.renderer.render(this.layers)
    }

    add (...args) {
        this.loader.add(...args)
        return this
    }

    load () {
        return new Promise(resolve => {
            this.loader.load((loader, resources) => {
                this.resources = {
                    ...this.resources,
                    ...resources
                }
                resolve(resources)
            })
        })
    }

    screenToWorldPosition (x, y) {
        let viewBox = this.camera.viewBox()
        return new PIXI.Point(
            (x / this.stage.scale.x) + viewBox.x,
            (y / this.stage.scale.y) + viewBox.y
        )
    }

    _handleMouseMove ({ clientX, clientY, target }) {
        this.mousePosition = new PIXI.Point(
            clientX - this.containerNode.offsetLeft,
            clientY - this.containerNode.offsetTop
        )
    }
}
