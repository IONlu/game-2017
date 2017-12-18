<template>
    <div class="component-play">
        <div
            class="dialog-container"
            v-if="isConnected && !isLoading && !isPlaying">
            <div class="splash-screen">
                <template v-if="!showControls">
                    <div class="welcome-message">
                        <h1>Welcome to this year's ION XMAS Game</h1>
                        <p>
                            Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat,
                            vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio
                            dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi.
                        </p>
                        <p>
                            Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut
                            laoreet dolore magna aliquam erat volutpat.
                        </p>
                        <p>
                            Enjoy, your ION Team.
                        </p>
                    </div>
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
                    <div class="button"
                        @click="showControls=true">
                        Controls
                    </div>
                </template>
                <template v-if="showControls">
                    <div class="controls">
                        <div class="control-group">
                            <div class="control-group-label">
                                <h3>Movement</h3>
                            </div>
                            <div class="control-group-row">
                                <div class="control-keys">
                                    <div class="key">A</div>
                                    <div class="key">D</div>
                                    <div class="key">←</div>
                                    <div class="key">→</div>
                                </div>
                                <div class="control-description">
                                    Move left / right
                                </div>
                            </div>
                            <div class="control-group-row">
                                <div class="control-keys">
                                    <div class="key">W</div>
                                    <div class="key">↑</div>
                                    <div class="key space">space</div>
                                </div>
                                <div class="control-description">
                                    Jump
                                </div>
                            </div>

                        </div>
                        <div class="control-group">
                            <div class="control-group-label">
                                <h3>Gameplay</h3>
                            </div>
                            <div class="control-group-row">
                                <div class="control-keys">
                                    <div class="mouse-left"></div>
                                </div>
                                <div class="control-description">
                                    Destroy
                                </div>
                            </div>
                            <div class="control-group-row">
                                <div class="control-keys">
                                    <div class="mouse-scroll"></div>
                                </div>
                                <div class="control-description">
                                    Scale destroy area
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="button"
                        @click="showControls=false">
                        Back
                    </div>
                </template>
            </div>
        </div>
        <game
            class="game"
            ref="game"
            @update:loading="onUpdateLoading"
            @update:playing="onUpdatePlaying"
            @update:connected="onUpdateConnected"
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

    .component-play .dialog-container .splash-screen {
        display: flex;
        flex-direction: column;
        border: 1px solid #FFF;
        background-color: rgba(0, 0, 0, 0.8);
        padding: 1em;
        text-align: center;
        width: 800px;
        height: auto;
        font-size: 1.1em;
    }

    .component-play .dialog-container .splash-screen .welcome-message {
        padding-bottom: 30px;
    }

    .component-play .dialog-container .splash-screen .button {
        display: flex;
        justify-content: center;
        align-items: center;
        border: 1px solid #FFF;
        border-radius: 5px;
        width: 100px;
        cursor: pointer;
        height: 30px;
    }

    .component-play .dialog-container .splash-screen .button:hover {
        background-color: #FFF;
        color: #000;
    }

    .component-play .dialog-container .splash-screen .controls {
        display: flex;
        justify-content: center;
        flex-direction: column;
    }

    .component-play .dialog-container .splash-screen .controls .control-group {
        display: flex;
        justify-content: center;
        flex-direction: column;
        margin-bottom: 20px;
    }

    .component-play .dialog-container .splash-screen .controls .control-group .control-group-label {
        flex: 1;
    }

    .component-play .dialog-container .splash-screen .controls .control-group .control-group-row {
        display: flex;
        flex-direction: row;
        justify-content: space-evenly;
        align-items: center;
        margin-bottom: 10px;
    }

    .component-play .dialog-container .splash-screen .controls .control-group .control-keys {
        display: flex;
        justify-content: flex-end;
        flex-direction: row;
        flex: 0 40%;
    }

    .component-play .dialog-container .splash-screen .controls .control-group .control-description {
        display: flex;
        justify-content: flex-start;
        flex: 0 40%;
    }

    .component-play .dialog-container .splash-screen .controls .control-group .control-keys .key {
        display: flex;
        border: 1px solid #FFF;
        border-radius: 5px;
        width:50px;
        height: 50px;
        padding: 2px 0 0 10px;
        margin: 5px;
        box-sizing: border-box;
    }

    .component-play .dialog-container .splash-screen .controls .control-group .control-keys .key.space {
        width: 110px;
    }

    .component-play .dialog-container .splash-screen .controls .control-group .control-keys .mouse-left {
        background-image: url('../assets/icons/left-mouse.svg');
        background-repeat: no-repeat;
        background-size: contain;
        padding: 1em;
        height: 50px;
        box-sizing: border-box;
    }

    .component-play .dialog-container .splash-screen .controls .control-group .control-keys .mouse-scroll {
        background-image: url('../assets/icons/scroll-mouse.svg');
        background-repeat: no-repeat;
        background-size: contain;
        padding: 1em;
        height: 50px;
        box-sizing: border-box;
    }

    .component-play .dialog-container .splash-screen .name-dialog {
        padding-bottom: 30px;
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }

    .component-play .dialog-container .splash-screen .name-dialog label {
        display: block;
        text-transform: uppercase;
        font-size: 1.3em;
    }

    .component-play .dialog-container .splash-screen .name-input {
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
                isPlaying: false,
                isConnected: false,
                showControls: false
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
            },

            onUpdateConnected (connected) {
                this.isConnected = connected
            }
        }
    }
</script>
