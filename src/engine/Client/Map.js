import CommonMap from '../Common/Map'
import { Texture, RenderTexture, Sprite, Container, Graphics, Rectangle } from 'pixi.js'
import { CHUNK_SIZE } from '@/config'
import BlockData from '@/assets/texture/block.json'
import axios from 'axios'

const TEXTURE_INDEX = Object.keys(BlockData.frames)

export default class Map extends CommonMap {
    constructor (app) {
        super(app)

        this._loadingChunks = {}

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
        let { chunk, texture, sprite } = this.chunks[key]
        if (!chunk.isDirty) {
            return
        }
        chunk.isDirty = false

        let screenX = x * 8 * CHUNK_SIZE
        let screenY = y * 8 * CHUNK_SIZE

        if (!texture) {
            texture = this.chunks[key].texture = RenderTexture.create(8 * CHUNK_SIZE, 8 * CHUNK_SIZE)
            sprite = this.chunks[key].sprite = new Sprite(texture)
            sprite.x = screenX
            sprite.y = screenY
            this.mapContainer.addChild(sprite)
        }

        for (var i = 0; i < CHUNK_SIZE; i++) {
            for (var j = 0; j < CHUNK_SIZE; j++) {
                let tile = chunk.get(i, j)
                let neighbours = this.getTileNeighbours((x * CHUNK_SIZE) + i, (y * CHUNK_SIZE) + j)

                let textureIndex = tile || neighbours[6] || neighbours[1]
                let tileTexture = Texture.EMPTY
                if (textureIndex !== null && TEXTURE_INDEX[textureIndex - 1]) {
                    let maskIndex = this.getTileMaskIndex(tile, neighbours)
                    tileTexture = this.maskedTextures[TEXTURE_INDEX[textureIndex - 1]][maskIndex]
                }

                let sprite = this.chunkSprites[(j * CHUNK_SIZE) + i]
                sprite.texture = new Texture(tileTexture, new Rectangle((i % 4) * 8, (j % 4) * 8, 8, 8))
            }
        }

        this.app.renderer.render(this.chunkContainer, texture)
        texture.requiresUpdate = true

        // update physics
        this.updatePhysicsBody(x, y)
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
        if (tile !== null) {
            index += 16
            if (neighbours[0] !== null || neighbours[1] !== null || neighbours[3] !== null) {
                index += 8
            }
            if (neighbours[1] !== null || neighbours[2] !== null || neighbours[4] !== null) {
                index += 4
            }
            if (neighbours[4] !== null || neighbours[6] !== null || neighbours[7] !== null) {
                index += 2
            }
            if (neighbours[3] !== null || neighbours[5] !== null || neighbours[6] !== null) {
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

    async loadChunksByPosition (x, y, MaxDistance = 1000) {
        // bounding box
        var chunkX = Math.floor((x - MaxDistance) / (8 * CHUNK_SIZE))
        var chunkX2 = Math.ceil((x + MaxDistance) / (8 * CHUNK_SIZE)) + 1
        var chunkY = Math.floor((y - MaxDistance) / (8 * CHUNK_SIZE))
        var chunkY2 = Math.ceil((y + MaxDistance) / (8 * CHUNK_SIZE)) + 1

        // load chunks
        let chunksPromise = []
        for (let x = chunkX; x < chunkX2; x++) {
            for (let y = chunkY; y < chunkY2; y++) {
                let chunk = this.getChunk(x, y)
                if (chunk.isDummy) {
                    chunksPromise.push(this.loadChunk(x, y))
                }
            }
        }
        return Promise.all(chunksPromise)
    }

    async unloadChunksByPosition (x, y, minDistance = 2000) {
        let minDistanceSquared = minDistance * minDistance
        Object.keys(this.chunks).forEach(key => {
            let { x: chunkX, y: chunkY } = this.chunks[key]
            let centerX = (chunkX + 0.5) * (8 * CHUNK_SIZE)
            let centerY = (chunkY + 0.5) * (8 * CHUNK_SIZE)
            let dx = centerX - x
            let dy = centerY - y
            let distanceSquared = (dx * dx) + (dy * dy)
            if (distanceSquared >= minDistanceSquared) {
                console.log('unload', chunkX, chunkY)
            }
        })
    }
}
