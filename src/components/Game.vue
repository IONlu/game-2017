<template>
    <div class="component-game">
        <div
            class="loading"
            v-if="isLoading">
            <div>loading ...</div>
        </div>
        <div
            class="renderer"
            ref="renderer"
        ></div>
    </div>
</template>

<style>
    .component-game {
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #000;
        color: #FFF;
    }

    .component-game .renderer {
        height: 100%;
        width: 100%;
        max-width: 1024px;
        max-height: 768px;
        cursor: crosshair;
        display: flex;
    }

    .component-game .loading {
        position: absolute;
        background-color: #000;
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>

<script>
    import Factory from '../engine/Common/Factory'
    import Loop from '../engine/Client/Loop'
    import GameEngine from '../engine/Client/GameEngine'
    import MapEntity from '../engine/Client/Map'
    import PlayerEntity from '../engine/Client/Player'
    import BallEntity from '../engine/Client/Ball'
    import ToolTrait from '../engine/Client/Tool'
    import UpdateCameraTrait from '../engine/Client/Trait/UpdateCamera'
    import UpdateBackgroundTrait from '../engine/Client/Trait/UpdateBackground'
    import ChunkLoaderTrait from '../engine/Client/Trait/ChunkLoader'
    import AttachTextTrait from '../engine/Client/Trait/AttachText'
    import PositionDialogTrait from '../engine/Client/Trait/PositionDialog'
    import Keyboard from '../engine/Client/Keyboard'
    import Controller from '../engine/Common/Controller'
    import Background from '../engine/Client/Background'
    import SnowEntity from '../engine/Client/Snow'
    import Gui from '../engine/Client/Gui'

    import BlockImage from '../assets/texture/block.png'
    import PlayerImage from '../assets/texture/player.png'
    import BallImage from '../assets/texture/ball.png'
    import BackgroundLayer1 from '../assets/background/layer1.png'
    import BackgroundLayer2 from '../assets/background/layer2.png'
    import BackgroundLayer3 from '../assets/background/layer3.png'
    import SnowImage from '../assets/particles/snow.png'
    import PickaxeImage from '../assets/items/pickaxe.png'
    import ItemContainerImage from '../assets/gui/item-container.png'
    import TreeImage from '../assets/texture/tree.png'
    import Gift1Image from '../assets/texture/gift/gift1.png'
    import Gift2Image from '../assets/texture/gift/gift2.png'
    import Gift3Image from '../assets/texture/gift/gift3.png'
    import Gift4Image from '../assets/texture/gift/gift4.png'
    import Gift5Image from '../assets/texture/gift/gift5.png'
    import Gift6Image from '../assets/texture/gift/gift6.png'
    import Cane1Image from '../assets/texture/cane/cane1.png'
    import Cane2Image from '../assets/texture/cane/cane2.png'
    import Cane3Image from '../assets/texture/cane/cane3.png'
    import Cane4Image from '../assets/texture/cane/cane4.png'

    import io from 'socket.io-client'

    export default {
        name: 'Game',

        data () {
            return {
                isLoading: true,
                isPlaying: false,
                isConnected: false
            }
        },

        directives: {
            focus: {
                inserted: function (el) {
                    el.focus()
                }
            }
        },

        watch: {
            isLoading (loading) {
                this.$emit('update:loading', loading)
            },

            isPlaying (playing) {
                this.$emit('update:playing', playing)
            },

            isConnected (connected) {
                this.$emit('update:connected', connected)
            }
        },

        mounted () {
            this.$socket = io.connect(
                process.env.SERVER_BASE_URL ||
                ('//' + location.hostname + (location.port ? ':' + location.port : ''))
            )

            this.$socket.on('connect', () => {
                this.isConnected = true
            })

            this.$socket.on('disconnect', () => {
                this.isConnected = false

                if (this.$player) {
                    this.$game.destroyEntity(this.$player)
                    this.$player = null
                }

                if (this.$gui) {
                    this.$gui.destroy()
                    this.$gui = null
                }

                this.isPlaying = false
            })

            Factory.add('Map', MapEntity)
            Factory.add('Player', PlayerEntity)
            Factory.add('Ball', BallEntity)
            Factory.add('Snow', SnowEntity)

            this.$game = new GameEngine(new Loop(60), this.$refs.renderer)
            this.$game.camera.scale.set(2)

            this.$game.add('block', BlockImage)
            this.$game.add('player', PlayerImage)
            this.$game.add('ball', BallImage)
            this.$game.add('bg_layer1', BackgroundLayer1)
            this.$game.add('bg_layer2', BackgroundLayer2)
            this.$game.add('bg_layer3', BackgroundLayer3)
            this.$game.add('snow', SnowImage)
            this.$game.add('item_container', ItemContainerImage)
            this.$game.add('pickaxe', PickaxeImage)
            this.$game.add('tree', TreeImage)

            this.$game.add('gift1', Gift1Image)
            this.$game.add('gift2', Gift2Image)
            this.$game.add('gift3', Gift3Image)
            this.$game.add('gift4', Gift4Image)
            this.$game.add('gift5', Gift5Image)
            this.$game.add('gift6', Gift6Image)

            this.$game.add('cane1', Cane1Image)
            this.$game.add('cane2', Cane2Image)
            this.$game.add('cane3', Cane3Image)
            this.$game.add('cane4', Cane4Image)

            this.$controller = new Controller()

            this.$keyboard = new Keyboard(document.body)
            this.$keyboard.bind(this.$controller, {
                left: [ 37, 65 ],
                right: [ 39, 68 ],
                jump: [ 87, 38, 32 ],
                ball: [ 66 ]
            })

            this.$controller.on('start', name => {
                this.$socket.emit('controller.start', name)
            })
            this.$controller.on('stop', name => {
                this.$socket.emit('controller.stop', name)
            })

            this.$game.load()
                .then(() => {
                    // init snow
                    this.$snow = this.$game.createEntity('Snow', {
                        container: this.$game.createLayer(0)
                    })

                    // init map
                    this.$map = this.$game.createEntity('Map')

                    // init background
                    this.$background = new Background(this.$game)

                    this.$snow.start()

                    // start playing
                    this.$socket.on('start', ({ id, position, colorIndex }) => {
                        this.$player = this.$game.createEntity('Player', {
                            position,
                            colorIndex,
                            bindSpriteDirectionToMouse: true
                        })
                        this.$player.SERVER_ENTITY_ID = id

                        this.$map.loadChunksByPosition(position.x, position.y)
                            .then(() => {
                                this.$player.addTrait(new UpdateCameraTrait(this.$game.camera))
                                this.$player.addTrait(new UpdateBackgroundTrait(this.$background))
                                this.$player.addTrait(new ChunkLoaderTrait(this.$map))
                                this.$player.addTrait(new PositionDialogTrait(this.$game))

                                this.$player.setController(this.$controller)

                                // add Gui
                                this.$gui = new Gui(this.$game, {
                                    container: this.$game.createLayer()
                                })

                                this.$tool = new ToolTrait(this.$game, this.$map, this.$socket, this.$gui)
                                this.$player.addTrait(this.$tool)

                                this.isPlaying = true
                            })
                    })

                    // remote entities
                    let remotePlayers = {}
                    let balls = {}
                    this.$socket.on('update', data => {
                        Object.keys(remotePlayers).forEach(key => {
                            let SERVER_ENTITY_ID = parseInt(key, 10)
                            if (this.$player && SERVER_ENTITY_ID === this.$player.SERVER_ENTITY_ID) {
                                return
                            }
                            if (!data.player.hasOwnProperty(key)) {
                                this.$game.destroyEntity(remotePlayers[key])
                                delete remotePlayers[key]
                            }
                        })
                        Object.keys(data.player).forEach(key => {
                            let SERVER_ENTITY_ID = parseInt(key, 10)
                            if (this.$player && SERVER_ENTITY_ID === this.$player.SERVER_ENTITY_ID) {
                                this.$player.body.importState(data.player[key].data, 0.25)
                                return
                            }
                            if (!remotePlayers.hasOwnProperty(key)) {
                                remotePlayers[key] = this.$game.createEntity('Player', {
                                    colorIndex: data.player[key].colorIndex
                                })
                                remotePlayers[key].addTrait(new AttachTextTrait(this.$game, data.player[key].name))
                            }
                            remotePlayers[key].body.importState(data.player[key].data)
                            remotePlayers[key].isRunning = data.player[key].isRunning
                            remotePlayers[key].isJumping = data.player[key].isJumping
                        })

                        data.chunks.forEach(chunk => {
                            if (this.$map.hasChunk(chunk.x, chunk.y)) {
                                this.$map._handleChunkData(chunk.x, chunk.y, chunk.data)
                            }
                        })

                        Object.keys(balls).forEach(key => {
                            if (!data.balls.hasOwnProperty(key)) {
                                this.$game.destroyEntity(balls[key])
                                delete balls[key]
                            }
                        })
                        Object.keys(data.balls).forEach(key => {
                            if (!balls.hasOwnProperty(key)) {
                                balls[key] = this.$game.createEntity('Ball')
                            }
                            balls[key].body.importState(data.balls[key].data)
                        })

                        if (this.$map) {
                            let entities = []
                            if (this.$player) {
                                entities.push(this.$player)
                            }
                            for (let key in remotePlayers) {
                                entities.push(remotePlayers[key])
                            }
                            for (let key in balls) {
                                entities.push(balls[key])
                            }
                            this.$map.setEntities(entities)
                        }
                    })
                })
                .then(() => {
                    this.isLoading = false
                    this.$nextTick(() => {
                        this.$game.start()
                    })
                })
        },

        methods: {
            join (name) {
                if (name) {
                    this.$socket.emit('start', name.slice(0, 10))
                }
            }
        },

        beforeDestroy () {
            this.$game.stop()
            this.$socket.close()
        }
    }
</script>
