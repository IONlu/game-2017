<template>
    <div class="component-play">
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
    }

    .component-play .renderer {
        height: 100%;
        width: 100%;
        max-width: 1024px;
        max-height: 768px;
        cursor: crosshair;
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

    import PhysicsBody from '../engine/Common/PhysicsBody'
    import PhysicsBodyBall from '../engine/Common/PhysicsBodyBall'

    import BlockImage from '../assets/texture/block.png'
    import PlayerImage from '../assets/texture/player.png'
    import BallImage from '../assets/texture/ball.png'

    import io from 'socket.io-client'

    export default {
        name: 'GamePlay',

        mounted () {
            let socket = io.connect('http://localhost:4200')

            Factory.add('Map', MapEntity)
            Factory.add('Player', PlayerEntity)
            Factory.add('Ball', BallEntity)

            this.$game = new GameEngine(new Loop(20), this.$refs.renderer)
            this.$game.camera.scale.set(2)

            this.$game.add('block', BlockImage)
            this.$game.add('player', PlayerImage)
            this.$game.add('ball', BallImage)

            this.$game.load().then(() => {
                this.$map = this.$game.createEntity('Map')

                this.$player = this.$game.createEntity('Player')
                this.$player.addTrait(new PhysicsBody(this.$game, this.$game.physics))
                this.$player.addTrait(new NetworkSendTrait(socket))
                this.$player.addTrait(new UpdateCameraTrait(this.$game.camera))

                for (let i = 0; i < 10; i++) {
                    let ball = this.$game.createEntity('Ball')
                    ball.addTrait(new PhysicsBodyBall(this.$game, this.$game.physics))
                }

                this.$tool = new ToolTrait(this.$game)
                this.$player.addTrait(this.$tool)

                this.$game.start()

                // remote players
                let remotePlayers = {}
                socket.on('update', playerData => {
                    Object.keys(remotePlayers).forEach(key => {
                        if (key === socket.id) {
                            return
                        }
                        if (!playerData.hasOwnProperty(key)) {
                            this.$game.destroyEntity(remotePlayers[key])
                            delete remotePlayers[key]
                        }
                    })
                    Object.keys(playerData).forEach(key => {
                        if (key === socket.id) {
                            return
                        }
                        if (!remotePlayers.hasOwnProperty(key)) {
                            remotePlayers[key] = this.$game.createEntity('Player')
                        } else {
                            remotePlayers[key].position.set(playerData[key][0], playerData[key][1])
                            remotePlayers[key].rotation = playerData[key][2]
                        }
                    })
                })
            })
        },

        methods: {
            onClick () {
                this.$map.dig(this.$tool.position.x / 8, this.$tool.position.y / 8, this.$tool.size)
            }
        },

        beforeDestroy () {

        }
    }
</script>
