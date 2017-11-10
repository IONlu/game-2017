<template>
    <div
        class="component-play"
        @click="onClick"
    ></div>
</template>

<style>
    .component-play {
        height: 100%;
        width: 100%;
    }
</style>

<script>
    import Factory from '../engine/Common/Factory'
    import Loop from '../engine/Client/Loop'
    import GameEngine from '../engine/Client/GameEngine'
    import MapEntity from '../engine/Client/Map'
    import PlayerEntity from '../engine/Client/Player'

    import PhysicsBody from '../engine/Common/PhysicsBody'

    import BlockImage from '../assets/texture/block.png'
    import PlayerImage from '../assets/texture/player.png'

    export default {
        name: 'GamePlay',

        mounted () {
            Factory.add('Map', MapEntity)
            Factory.add('Player', PlayerEntity)

            this.$game = new GameEngine(new Loop(20), this.$el)
            this.$game.camera.scale.set(2)

            this.$game.add('block', BlockImage)
            this.$game.add('player', PlayerImage)

            this.$game.load().then(() => {
                this.$map = this.$game.createEntity('Map')
                this.$player = this.$game.createEntity('Player')
                this.$player.addTrait(new PhysicsBody(this.$game, this.$game.physics))
                this.$game.start()
            })

            /* let lastPosition
            let isMoving = false
            document.addEventListener('mousedown', evt => {
                isMoving = true
                lastPosition = {
                    x: evt.clientX,
                    y: evt.clientY
                }
            })

            document.addEventListener('mousemove', evt => {
                if (!isMoving) {
                    return
                }
                this.$game.stage.position.x += evt.clientX - lastPosition.x
                this.$game.stage.position.y += evt.clientY - lastPosition.y
                lastPosition = {
                    x: evt.clientX,
                    y: evt.clientY
                }
            })

            document.addEventListener('mouseup', evt => {
                isMoving = false
                this.$game.stage.position.x += evt.clientX - lastPosition.x
                this.$game.stage.position.y += evt.clientY - lastPosition.y
            })

            document.addEventListener('wheel', evt => {
                this.$game.stage.scale.x -= this.$game.stage.scale.x * (evt.deltaY / 100)
                this.$game.stage.scale.y -= this.$game.stage.scale.y * (evt.deltaY / 100)
            }) */
        },

        methods: {
            onClick ({ clientX, clientY }) {
                let viewBox = this.$game.camera.viewBox()
                let x = (clientX / this.$game.stage.scale.x) + viewBox.x
                let y = (clientY / this.$game.stage.scale.y) + viewBox.y
                this.$map.setTile(Math.floor(x / 8), Math.floor(y / 8))
            }
        },

        beforeDestroy () {

        }
    }
</script>
