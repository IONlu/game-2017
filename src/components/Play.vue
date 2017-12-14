<template>
    <div class="component-play">
        <div
            class="loading"
            v-if="isLoading">
            <div>loading ...</div>
        </div>
        <div
            class="dialog-container"
            v-if="!isLoading && !isPlaying">
            <div class="name-dialog">
                <label>
                    Enter your name
                </label>
                <input
                    class="name-input"
                    type="text"
                    @keyup.enter="onNameEnter"
                    maxlength="10"
                    v-focus
                />
            </div>
        </div>
        <div
            class="renderer"
            ref="renderer"
        ></div>
    </div>
</template>

<style>
    .component-play {
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #000;
        color: #FFF;
    }

    .component-play .renderer {
        height: 100%;
        width: 100%;
        max-width: 1024px;
        max-height: 768px;
        cursor: crosshair;
    }

    .component-play .loading {
        position: absolute;
        background-color: #000;
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .component-play .dialog-container {
        position: absolute;
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .component-play .dialog-container .name-dialog {
        border: 1px solid #FFF;
        background-color: rgba(0, 0, 0, 0.7);
        padding: 1em;
        text-align: center;
    }

    .component-play .dialog-container .name-dialog label {
        display: block;
        text-transform: uppercase;
    }

    .component-play .dialog-container .name-input {
        border: 0;
        background-color: #FFFFFF;
        display: block;
        padding: 0.1em;
        text-align: center;
        margin-top: 0.5em;
        font-family: inherit;
        font-size: 2em;
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
    import ChunkLoaderTrait from '../engine/Client/Trait/ChunkLoader'
    import AttachTextTrait from '../engine/Client/Trait/AttachText'
    import PositionDialogTrait from '../engine/Client/Trait/PositionDialog'
    import Keyboard from '../engine/Client/Keyboard'
    import Controller from '../engine/Common/Controller'

    import BlockImage from '../assets/texture/block.png'
    import PlayerImage from '../assets/texture/player.png'
    import BallImage from '../assets/texture/ball.png'

    import io from 'socket.io-client'

    export default {
        name: 'GamePlay',

        data () {
            return {
                isLoading: true,
                isPlaying: false
            }
        },

        directives: {
            focus: {
                inserted: function (el) {
                    el.focus()
                }
            }
        },

        mounted () {
            this.$socket = io.connect(
                process.env.SERVER_BASE_URL ||
                ('//' + location.hostname + (location.port ? ':' + location.port : ''))
            )

            Factory.add('Map', MapEntity)
            Factory.add('Player', PlayerEntity)
            Factory.add('Ball', BallEntity)

            this.$game = new GameEngine(new Loop(60), this.$refs.renderer)
            this.$game.camera.scale.set(2)

            this.$game.add('block', BlockImage)
            this.$game.add('player', PlayerImage)
            this.$game.add('ball', BallImage)

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
                    this.$map = this.$game.createEntity('Map')

                    // start playing
                    this.$socket.on('start', ({ id, position }) => {
                        this.$player = this.$game.createEntity('Player', {
                            position
                        })

                        this.$player.addTrait(new UpdateCameraTrait(this.$game.camera))
                        this.$player.addTrait(new ChunkLoaderTrait(this.$map))
                        this.$player.addTrait(new PositionDialogTrait(this.$game))

                        this.$tool = new ToolTrait(this.$game, this.$map, this.$socket)
                        this.$player.addTrait(this.$tool)

                        this.$player.SERVER_ENTITY_ID = id

                        this.$player.setController(this.$controller)

                        this.isPlaying = true
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
                                remotePlayers[key] = this.$game.createEntity('Player')
                                remotePlayers[key].addTrait(new AttachTextTrait(this.$game, data.player[key].name))
                            }
                            remotePlayers[key].body.importState(data.player[key].data)
                        })

                        data.chunks.forEach(chunk => {
                            this.$map._handleChunkData(chunk.x, chunk.y, chunk.data)
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
                    })

                    // preload chunks
                    return this.$map.loadChunksByPosition()
                })
                .then(() => {
                    this.isLoading = false
                    this.$nextTick(() => {
                        this.$game.start()
                    })
                })
        },

        methods: {
            onNameEnter (evt) {
                let name = evt.target.value
                if (name) {
                    this.$socket.emit('start', name.slice(0, 10))
                }
            }
        },

        beforeDestroy () {
            this.$socket.close()
        }
    }
</script>
