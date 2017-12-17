<template>
    <div class="component-play">
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
        <game
            class="game"
            ref="game"
            @update:loading="onUpdateLoading"
            @update:playing="onUpdatePlaying"
        ></game>
    </div>
</template>

<style>
    .component-play {
        height: 100%;
        width: 100%;
        background-color: #000;
        color: #FFF;
    }

    .component-play .game {
        height: 100%;
        width: 100%;
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
    import GameComponent from './Game'

    export default {
        name: 'Play',

        components: {
            game: GameComponent
        },

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

        methods: {
            onNameEnter (evt) {
                let name = evt.target.value
                if (name && this.$refs.game) {
                    this.$refs.game.join(name)
                }
            },

            onUpdateLoading (loading) {
                this.isLoading = loading
            },

            onUpdatePlaying (playing) {
                this.isPlaying = playing
            }
        }
    }
</script>
