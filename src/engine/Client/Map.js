import CommonMap from '../Common/Map'
import { Texture, RenderTexture, Sprite, Container, Graphics, Rectangle, utils, BLEND_MODES } from 'pixi.js'
import { CHUNK_SIZE } from '@/config'
import BlockData from '@/assets/texture/block.json'
import axios from 'axios'
import { height as getTerrainHeight, isTree, isCane, isGift } from '../Common/Terrain'

const TEXTURE_INDEX = Object.keys(BlockData.frames)
const spriteStack = []
const treeStack = []
const caneStack = []
const giftStack = []

export default class Map extends CommonMap {
    constructor (app) {
        super(app)

        this._loadingChunks = {}
        this.trees = []
        this.canes = []
        this.gifts = []

        this.initTileTextures()

        this.initChunkContainer()

        this.mapContainer = new Container()
        this.app.stage.addChild(this.mapContainer)
    }

    drawChunk (x, y) {
        let key = x + ';' + y
        if (!this.chunks.hasOwnProperty(key)) {
            return
        }
        let { chunk, texture, sprite, backgroundTexture, backgroundSprite } = this.chunks[key]
        let screenX = x * 8 * CHUNK_SIZE
        let screenY = y * 8 * CHUNK_SIZE

        if (chunk.isDummy) {
            return
        }

        if (!backgroundTexture) {
            backgroundSprite = spriteStack.pop()
            if (backgroundSprite) {
                this.chunks[key].backgroundSprite = backgroundSprite
                backgroundTexture = this.chunks[key].backgroundTexture = backgroundSprite.texture
            } else {
                backgroundTexture = this.chunks[key].backgroundTexture = RenderTexture.create(8 * CHUNK_SIZE, 8 * CHUNK_SIZE)
                backgroundSprite = this.chunks[key].backgroundSprite = new Sprite(backgroundTexture)
            }
            backgroundSprite.x = screenX
            backgroundSprite.y = screenY
            this.mapContainer.addChild(backgroundSprite)
            this._renderChunkToTexture(x, y, chunk, backgroundTexture, true)
        }

        if (!chunk.isDirty) {
            return
        }
        chunk.isDirty = false

        if (!texture) {
            sprite = spriteStack.pop()
            if (sprite) {
                this.chunks[key].sprite = sprite
                texture = this.chunks[key].texture = sprite.texture
            } else {
                texture = this.chunks[key].texture = RenderTexture.create(8 * CHUNK_SIZE, 8 * CHUNK_SIZE)
                sprite = this.chunks[key].sprite = new Sprite(texture)
            }
            sprite.x = screenX
            sprite.y = screenY
            this.mapContainer.addChild(sprite)
        }

        this._renderChunkToTexture(x, y, chunk, texture)

        // update physics
        this.updatePhysicsBody(x, y)

        /* let physicGraphics = this.chunks[key].physicGraphics
        if (!physicGraphics) {
            physicGraphics = this.chunks[key].physicGraphics = new Graphics()
            this.mapContainer.addChild(physicGraphics)
        }
        physicGraphics.clear()
        this.chunks[key].bodies.forEach(body => {
            if (body.vertices.length > 0) {
                physicGraphics.beginFill(Math.random() * 0xFFFFFF << 0, 0.5)
                physicGraphics.moveTo(body.vertices[0].x, body.vertices[0].y)
                for (let i = 1; i < body.vertices.length; i++) {
                    physicGraphics.lineTo(body.vertices[i].x, body.vertices[i].y)
                }
                physicGraphics.moveTo(body.vertices[0].x, body.vertices[0].y)
            }
        }) */
    }

    darkness (tileX, tileY) {
        let heightDiff = tileY + getTerrainHeight(tileX)
        let darkness = 1
        if (heightDiff > 50) {
            darkness = 0.05
        } else if (heightDiff > 0) {
            darkness = Math.max(0.05, 1 - (heightDiff / 50))
        }
        return darkness
    }

    _renderChunkToTexture (x, y, chunk, texture, background = false) {
        for (var i = 0; i < CHUNK_SIZE; i++) {
            for (var j = 0; j < CHUNK_SIZE; j++) {
                let tile = chunk.get(i, j, background)
                let tileX = (x * CHUNK_SIZE) + i
                let tileY = (y * CHUNK_SIZE) + j
                let neighbours = this.getTileNeighbours(tileX, tileY, background)

                let textureIndex = tile || neighbours[6] || neighbours[1]
                let tileTexture = Texture.EMPTY
                if (textureIndex !== 0 && TEXTURE_INDEX[textureIndex - 1]) {
                    let maskIndex = this.getTileMaskIndex(tile, neighbours)
                    tileTexture = this.maskedTextures[TEXTURE_INDEX[textureIndex - 1]][maskIndex]
                }

                let darkness = this.darkness(tileX, tileY)

                let sprite = this.chunkSprites[(j * CHUNK_SIZE) + i]
                if (background) {
                    sprite.tint = utils.rgb2hex([0.5, 0.5, 0.5].map(color => color * darkness))
                    sprite.texture = new Texture(tileTexture, new Rectangle(((i + 1) % 4) * 8, ((j + 1) % 4) * 8, 8, 8))
                } else {
                    sprite.tint = utils.rgb2hex([1, 1, 1].map(color => color * darkness))
                    sprite.texture = new Texture(tileTexture, new Rectangle((i % 4) * 8, (j % 4) * 8, 8, 8))
                }
            }
        }

        this.app.renderer.render(this.chunkContainer, texture)
        texture.requiresUpdate = true
    }

    generateTileMaskTextures () {
        let tileMaskTextures = []
        let mask = new Graphics()

        for (let i = 0; i < 32; i++) {
            mask.beginFill(0x000000, 1)
            mask.drawRect(0, 0, 8, 8)

            mask.beginFill(0xFFFFFF, 1)

            let code = (i >>> 0).toString(2).padStart(5, '0')
            if (code[0] === '0') {
                if (code[1] === '1') {
                    mask.moveTo(0, 0)
                    mask.lineTo(4, 0)
                    mask.lineTo(0, 4)
                    mask.lineTo(0, 0)
                }

                if (code[2] === '1') {
                    mask.moveTo(4, 0)
                    mask.lineTo(8, 0)
                    mask.lineTo(8, 4)
                    mask.lineTo(4, 0)
                }

                if (code[3] === '1') {
                    mask.moveTo(8, 4)
                    mask.lineTo(8, 8)
                    mask.lineTo(4, 8)
                    mask.lineTo(8, 4)
                }

                if (code[4] === '1') {
                    mask.moveTo(0, 4)
                    mask.lineTo(4, 8)
                    mask.lineTo(0, 8)
                    mask.lineTo(0, 4)
                }
            } else {
                mask.moveTo(0, 4)
                if (code[1] === '1') {
                    mask.lineTo(0, 0)
                }
                mask.lineTo(4, 0)
                mask.lineTo(4, 4)
                mask.lineTo(0, 4)

                mask.moveTo(4, 0)
                if (code[2] === '1') {
                    mask.lineTo(8, 0)
                }
                mask.lineTo(8, 4)
                mask.lineTo(4, 4)
                mask.lineTo(4, 0)

                mask.moveTo(8, 4)
                if (code[3] === '1') {
                    mask.lineTo(8, 8)
                }
                mask.lineTo(4, 8)
                mask.lineTo(4, 4)
                mask.lineTo(8, 4)

                mask.moveTo(4, 8)
                if (code[4] === '1') {
                    mask.lineTo(0, 8)
                }
                mask.lineTo(0, 4)
                mask.lineTo(4, 4)
                mask.lineTo(4, 8)
            }

            let texture = this.app.renderer.generateTexture(mask)
            tileMaskTextures.push(texture)
            mask.clear()
        }

        return tileMaskTextures
    }

    getTileMaskIndex (tile, neighbours) {
        let index = 0
        if (tile !== 0) {
            index += 16
            if (neighbours[0] !== 0 || neighbours[1] !== 0 || neighbours[3] !== 0) {
                index += 8
            }
            if (neighbours[1] !== 0 || neighbours[2] !== 0 || neighbours[4] !== 0) {
                index += 4
            }
            if (neighbours[4] !== 0 || neighbours[6] !== 0 || neighbours[7] !== 0) {
                index += 2
            }
            if (neighbours[3] !== 0 || neighbours[5] !== 0 || neighbours[6] !== 0) {
                index += 1
            }
        } else {
            if (neighbours[1] && neighbours[3]) {
                index += 8
            }
            if (neighbours[1] && neighbours[4]) {
                index += 4
            }
            if (neighbours[4] && neighbours[6]) {
                index += 2
            }
            if (neighbours[3] && neighbours[6]) {
                index += 1
            }
        }

        return index
    }

    initChunkContainer () {
        this.chunkContainer = new Container()
        this.chunkSprites = []
        for (let y = 0; y < CHUNK_SIZE; y++) {
            for (let x = 0; x < CHUNK_SIZE; x++) {
                let sprite = new Sprite()
                this.chunkSprites.push(sprite)
                sprite.position.x = x * 8
                sprite.position.y = y * 8
                this.chunkContainer.addChild(sprite)
            }
        }
    }

    initTileTextures () {
        this.tileMaskTextures = this.generateTileMaskTextures()

        let container = new Container()
        let sprites = []
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                let sprite = new Sprite()
                sprite.width = 8
                sprite.height = 8
                sprite.position.set(x * 8, y * 8)
                sprite.mask = new Sprite(Texture.WHITE)
                sprite.addChild(sprite.mask)
                container.addChild(sprite)
                sprites.push(sprite)
            }
        }

        const setTexture = name => {
            let texture = this.app.resources.block.texture
            sprites.forEach((sprite, index) => {
                sprite.texture = new Texture(
                    texture,
                    new Rectangle(
                        BlockData.frames[name].frame.x + ((index % 4) * 8),
                        BlockData.frames[name].frame.y + (Math.floor(index / 4) * 8),
                        8, 8
                    )
                )
            })
        }

        const setMaskTexture = texture => {
            sprites.forEach(sprite => {
                sprite.mask.texture = texture
            })
        }

        this.maskedTextures = {}
        for (let name in BlockData.frames) {
            setTexture(name)
            this.maskedTextures[name] = []
            this.tileMaskTextures.forEach(maskTexture => {
                setMaskTexture(maskTexture)
                this.maskedTextures[name].push(this.app.renderer.generateTexture(container))
            })
        }
    }

    render (t) {
        let viewBox = this.app.camera.viewBox()

        Object.keys(this.chunks).forEach(key => {
            let { x, y, chunk } = this.chunks[key]

            let chunkBox = {
                x: x * 8 * CHUNK_SIZE,
                y: y * 8 * CHUNK_SIZE,
                width: 8 * CHUNK_SIZE,
                height: 8 * CHUNK_SIZE
            }
            let visible = chunkBox.x < viewBox.x + viewBox.width &&
                chunkBox.x + chunkBox.width > viewBox.x &&
                chunkBox.y < viewBox.y + viewBox.height &&
                chunkBox.y + chunkBox.height > viewBox.y

            // draw chunks if dirty
            if (visible && chunk.isDirty) {
                this.drawChunk(x, y)
            }

            // hide chunks outside of viewport
            if (this.chunks[key].sprite) {
                this.chunks[key].sprite.visible = visible
            }
        })

        // draw Trees, canes and gifts
        this.trees.forEach(tree => {
            tree.visible = false
            treeStack.push(tree)
        })
        this.trees = []
        this.canes.forEach(cane => {
            cane.visible = false
            caneStack.push(cane)
        })
        this.canes = []
        this.gifts.forEach(gift => {
            gift.visible = false
            giftStack.push(gift)
        })
        this.gifts = []
        for (let i = Math.floor(viewBox.x) - 100; i < Math.ceil(viewBox.x + viewBox.width + 100); i++) {
            if (i % 44 === 0) {
                if (isTree(i / 8)) {
                    let tree = treeStack.pop() || (() => {
                        let sprite = new Sprite(this.app.resources.tree.texture)
                        sprite.anchor.set(0.5, 0.9)
                        sprite.blendMode = BLEND_MODES.OVERLAY
                        this.mapContainer.addChildAt(sprite, 0)
                        return sprite
                    })()
                    tree.visible = true
                    tree.position.set(i, -(getTerrainHeight(i / 8) * 8))
                    this.trees.push(tree)
                }
            }

            if (i % 81 === 0) {
                if (isCane(i / 8)) {
                    let cane = caneStack.pop() || (() => {
                        let sprite = new Sprite(this.app.resources.cane1.texture)
                        sprite.anchor.set(0.5, 0.8)
                        sprite.scale.set(0.3)
                        sprite.blendMode = BLEND_MODES.OVERLAY
                        this.mapContainer.addChildAt(sprite, 0)
                        return sprite
                    })()
                    cane.texture = this.app.resources['cane' + ((Math.abs(i) % 4) + 1)].texture
                    cane.visible = true
                    cane.position.set(i, -(getTerrainHeight(i / 8) * 8))
                    this.canes.push(cane)
                }
            }

            if (i % 61 === 0) {
                if (isGift(i / 8)) {
                    let gift = giftStack.pop() || (() => {
                        let sprite = new Sprite(this.app.resources.gift1.texture)
                        sprite.anchor.set(0.5, 0.8)
                        sprite.scale.set(0.3)
                        sprite.blendMode = BLEND_MODES.OVERLAY
                        this.mapContainer.addChildAt(sprite, 0)
                        return sprite
                    })()
                    gift.texture = this.app.resources['gift' + ((Math.abs(i) % 6) + 1)].texture
                    gift.visible = true
                    gift.position.set(i, -(getTerrainHeight(i / 8) * 8))
                    this.gifts.push(gift)
                }
            }
        }
    }

    handleRender (t) {
        this.render(t)
    }

    loadChunk (x, y) {
        this.createChunkIfNone(x, y)
        if (!this._loadingChunks.hasOwnProperty(x + ';' + y)) {
            this._loadingChunks[x + ';' + y] = axios.get((process.env.SERVER_BASE_URL ||
                ('//' + location.hostname + (location.port ? ':' + location.port : ''))) + '/chunk/' + x + '/' + y)
                .then(response => {
                    delete this._loadingChunks[x + ';' + y]
                    return this._handleChunkData(x, y, response.data.data)
                })
        }
        return this._loadingChunks[x + ';' + y]
    }

    async loadChunksByPosition (x, y, maxDistance = 1000) {
        // bounding box
        var chunkX1 = Math.floor((x - maxDistance) / (8 * CHUNK_SIZE))
        var chunkX2 = Math.ceil((x + maxDistance) / (8 * CHUNK_SIZE))
        var chunkY1 = Math.floor((y - maxDistance) / (8 * CHUNK_SIZE))
        var chunkY2 = Math.ceil((y + maxDistance) / (8 * CHUNK_SIZE))

        let maxDistanceSquared = maxDistance * maxDistance

        // load chunks
        let chunksPromise = []
        for (let chunkX = chunkX1; chunkX <= chunkX2; chunkX++) {
            for (let chunkY = chunkY1; chunkY <= chunkY2; chunkY++) {
                let centerX = (chunkX + 0.5) * (8 * CHUNK_SIZE)
                let centerY = (chunkY + 0.5) * (8 * CHUNK_SIZE)
                let dx = centerX - x
                let dy = centerY - y
                let distanceSquared = (dx * dx) + (dy * dy)
                if (distanceSquared <= maxDistanceSquared) {
                    let chunk = this.getChunk(chunkX, chunkY)
                    if (chunk.isDummy) {
                        chunksPromise.push(this.loadChunk(chunkX, chunkY))
                    }
                }
            }
        }
        return Promise.all(chunksPromise)
    }

    async unloadChunksByPosition (x, y, maxDistance = 4000) {
        let { outside } = this.getChunksByDistance([{ x, y }], maxDistance)
        outside.forEach(chunk => {
            this.unloadChunk(chunk.x, chunk.y)
        })
    }

    unloadChunk (x, y) {
        if (this.chunks.hasOwnProperty(x + ';' + y)) {
            if (this.chunks[x + ';' + y].sprite) {
                spriteStack.push(this.chunks[x + ';' + y].sprite)
                this.mapContainer.removeChild(this.chunks[x + ';' + y].sprite)
            }
            if (this.chunks[x + ';' + y].backgroundSprite) {
                spriteStack.push(this.chunks[x + ';' + y].backgroundSprite)
                this.mapContainer.removeChild(this.chunks[x + ';' + y].backgroundSprite)
            }
            if (this.chunks[x + ';' + y].physicGraphics) {
                this.mapContainer.removeChild(this.chunks[x + ';' + y].physicGraphics)
            }
        }
        super.unloadChunk(x, y)
    }
}
