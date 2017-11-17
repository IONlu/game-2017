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
                <input type="text" @keyup.enter="onNameEnter" />
            </div>
        </div>
        <div
            class="renderer"
            ref="renderer"
            @click="onClick"
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
        font-family: Arial, Helvetica, sans-serif;
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
</style>

<script>
    import Factory from '../engine/Common/Factory'
    import Loop from '../engine/Client/Loop'
    import GameEngine from '../engine/Client/GameEngine'
    import MapEntity from '../engine/Client/Map'
    import PlayerEntity from '../engine/Client/Player'
    import BallEntity from '../engine/Client/Ball'
    import ToolTrait from '../engine/Client/Tool'
    import NetworkSendTrait from '../engine/Common/Trait/Network/Send'
    import UpdateCameraTrait from '../engine/Client/Trait/UpdateCamera'
    import ChunkLoaderTrait from '../engine/Client/Trait/ChunkLoader'

    import PhysicsBody from '../engine/Common/PhysicsBody'
    import PhysicsBodyBall from '../engine/Common/PhysicsBodyBall'

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

        mounted () {
            this.$socket = io.connect(
                process.env.SERVER_BASE_URL ||
                ('//' + location.hostname + (location.port ? ':' + location.port : ''))
            )

            Factory.add('Map', MapEntity)
            Factory.add('Player', PlayerEntity)
            Factory.add('Ball', BallEntity)

            this.$game = new GameEngine(new Loop(20), this.$refs.renderer)
            this.$game.camera.scale.set(2)

            this.$game.add('block', BlockImage)
            this.$game.add('player', PlayerImage)
            this.$game.add('ball', BallImage)

            this.$game.load()
                .then(() => {
                    this.$map = this.$game.createEntity('Map')

                    for (let i = 0; i < 10; i++) {
                        let ball = this.$game.createEntity('Ball')
                        ball.addTrait(new PhysicsBodyBall(this.$game, this.$game.physics))
                    }

                    // remote players
                    let remotePlayers = {}
                    this.$socket.on('update', data => {
                        Object.keys(remotePlayers).forEach(key => {
                            if (key === this.$socket.id) {
                                return
                            }
                            if (!data.player.hasOwnProperty(key)) {
                                this.$game.destroyEntity(remotePlayers[key])
                                delete remotePlayers[key]
                            }
                        })
                        Object.keys(data.player).forEach(key => {
                            if (key === this.$socket.id) {
                                return
                            }
                            if (!remotePlayers.hasOwnProperty(key)) {
                                remotePlayers[key] = this.$game.createEntity('Player')
                            } else {
                                remotePlayers[key].position.set(data.player[key][0], data.player[key][1])
                                remotePlayers[key].rotation = data.player[key][2]
                            }
                        })

                        data.chunks.forEach(chunk => {
                            this.$map._handleChunkData(chunk.x, chunk.y, chunk.data)
                        })
                    })

                    // preload chunks
                    return this.$map.loadChunksByPosition(0, 0)
                })
                .then(() => {
                    this.isLoading = false
                    this.$nextTick(() => {
                        this.$game.start()
                    })
                })
        },

        methods: {
            onClick () {
                this.$socket.emit('dig', [
                    this.$tool.position.x / 8,
                    this.$tool.position.y / 8,
                    this.$tool.size
                ])
                this.$map.dig(this.$tool.position.x / 8, this.$tool.position.y / 8, this.$tool.size)
            },

            onNameEnter () {
                this.$player = this.$game.createEntity('Player')
                this.$player.addTrait(new PhysicsBody(this.$game, this.$game.physics))
                this.$player.addTrait(new NetworkSendTrait(this.$socket))
                this.$player.addTrait(new UpdateCameraTrait(this.$game.camera))
                this.$player.addTrait(new ChunkLoaderTrait(this.$map))
                this.$tool = new ToolTrait(this.$game)
                this.$player.addTrait(this.$tool)

                this.isPlaying = true
            }
        },

        beforeDestroy () {
            this.$socket.close()
        }
    }
</script>
