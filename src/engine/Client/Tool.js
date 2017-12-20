import { Trait } from '../Common/Entity'
import { Graphics, utils } from 'pixi.js'
import Vector from '../Common/Vector'

import BlockData from '@/assets/texture/block.json'
const TEXTURE_INDEX = Object.keys(BlockData.frames)

let spriteStack = []

export default class Tool extends Trait {
    constructor (app, map, socket, gui) {
        super()
        this.app = app
        this.map = map
        this.socket = socket
        this.gui = gui

        this.size = 2
        this.position = new Vector()
        this.touchingTiles = []

        this.sprites = []

        this.mouseDownTime = false
        window.document.addEventListener('wheel', this._handleMouseWheel, true)
        window.document.addEventListener('mousedown', this._handleMouseDown, true)
        window.document.addEventListener('mouseup', this._handleMouseUp, true)
        window.document.addEventListener('blur', this._handleMouseUp, true)
    }

    _handleMouseWheel = function (evt) {
        if (evt.deltaY > 0) {
            this.size += 2
        }
        if (evt.deltaY < 0) {
            this.size -= 2
        }
        this.size = Math.max(2, Math.min(6, this.size))
    }.bind(this)

    getMode () {
        return this.gui.currentItem === 'pickaxe'
            ? 'dig'
            : 'build'
    }

    getTileType () {
        return this.gui.currentItem === 'pickaxe'
            ? 0
            : TEXTURE_INDEX.indexOf(this.gui.currentItem) + 1
    }

    _handleMouseDown = function (evt) {
        if (evt.isTrusted) {
            this.mouseDownTime = performance.now()
        }
    }.bind(this)

    _handleMouseUp = function () {
        this.mouseDownTime = false
    }.bind(this)

    render (entity, deltaTime, time) {
        super.render(entity, deltaTime, time)

        if (
            this.mouseDownTime &&
            this.touchingTiles.length
        ) {
            let progress = (time - this.mouseDownTime) / ((this.touchingTiles.length * 50) + 400)
            if (progress >= 1) {
                this.mouseDownTime = performance.now()
                let type = this.getTileType()
                this.socket.emit('setTiles', {
                    tiles: this.touchingTiles,
                    type
                })
                this.map.setTiles(this.touchingTiles, type)
            } else {
                let invertedProgress = 1 - progress
                let tintColor = this.getMode() === 'dig'
                    ? utils.rgb2hex([ 1, invertedProgress, invertedProgress ])
                    : utils.rgb2hex([ invertedProgress, 1, invertedProgress ])
                this.sprites.forEach(tile => {
                    tile.tint = tintColor
                })
            }
        }

        let targetPosition = this.app.screenToWorldPosition(
            this.app.mousePosition.x,
            this.app.mousePosition.y
        )

        this.position.set(
            targetPosition.x,
            targetPosition.y
        )

        this.initTouchingTiles(entity)
        this.renderRectangles()
    }

    initTouchingTiles (entity) {
        this.touchingTiles = []
        let x = Math.round(this.position.x / 8) - 0.5
        let y = Math.round(this.position.y / 8) - 0.5

        let radius = (this.size / 2)
        let radiusSquared = radius * radius
        for (let i = Math.floor(x - radius); i <= Math.ceil(x + radius); i++) {
            for (let j = Math.floor(y - radius); j <= Math.ceil(y + radius); j++) {
                // mouse distance
                let dx = i - x
                let dy = j - y
                let mouseDistanceSquared = dx * dx + dy * dy

                // player distance
                let mx = (entity.sprite.position.x / 8) - i
                let my = (entity.sprite.position.y / 8) - j
                let playerDistanceSquared = mx * mx + my * my

                if (
                    mouseDistanceSquared <= radiusSquared &&
                    playerDistanceSquared <= 8 * 8
                ) {
                    let hasTile = this.getMode() === 'dig'
                        ? this.map.getTile(i, j) !== 0
                        : this.map.getTile(i, j) === 0
                    if (hasTile) {
                        this.touchingTiles.push({
                            x: i,
                            y: j
                        })
                    }
                }
            }
        }
    }

    renderRectangles (entity) {
        spriteStack = [
            ...spriteStack,
            ...this.sprites
        ]
        this.sprites = []

        this.touchingTiles.forEach(({ x, y }) => {
            let sprite = spriteStack.pop() || this.createSprite()
            sprite.position.set(
                x * 8,
                y * 8
            )
            sprite.visible = true
            this.sprites.push(sprite)
        })

        spriteStack.forEach(sprite => {
            sprite.visible = false
            sprite.tint = 0xFFFFFF
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

        window.document.removeEventListener('wheel', this._handleMouseWheel, true)
        window.document.removeEventListener('mousedown', this._handleMouseDown, true)
        window.document.removeEventListener('mouseup', this._handleMouseUp, true)
        window.document.removeEventListener('blur', this._handleMouseUp, true)

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
