<template>
    <div class="component-play">
        <div
            class="dialog-container"
            v-if="isConnected && !isLoading && !isPlaying">
            <div class="splash-screen">
                <div class="santa-bonnet"></div>
                <template v-if="!showControls && !showAbout">
                    <div class="welcome-message">
                        <h1>Welcome to the ION XMAS game</h1>
                        <p>
                            This year, join us in our game to explore a giant 2D world together.
                        </p>
                        <p>
                          Use your pickaxe to dig through the ground and rock or switch your tools and use your creative skills to build sky fortresses or underground bunkers.
Join forces with the other players to build even greater structures or toy around with other players.
                        </p>
                        <p>
                            Quickly check the controls, enter your characters' name and go ahead and join the fray.
                        </p>
                    </div>
                    <div class="name-dialog">
                        <label>
                            Enter your name
                        </label>
                        <input
                            ref="name"
                            class="name-input"
                            type="text"
                            @keyup.enter="onNameEnter"
                            maxlength="10"
                            v-focus
                        />
                    </div>
                    <div class="wishes-container">
                        <div class="wish">
                            Best wishes 2018
                        </div>
                        <div class="ion-logo">
                            <img src="../assets/images/ion-logo-white.png" />
                        </div>
                        <div class="wish">
                            Meilleurs voeux 2018
                        </div>
                    </div>
                    <div class="navigation">
                      <div class="button"
                          @click="showAbout=true">
                          About
                      </div>
                        <div class="button"
                            @click="showControls=true">
                            Controls
                        </div>
                        <div class="button"
                            @click="start()">
                            Start ►
                        </div>
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
                                    Keep pressed to destroy / build
                                </div>
                            </div>
                            <div class="control-group-row">
                                <div class="control-keys">
                                    <div class="mouse-scroll"></div>
                                </div>
                                <div class="control-description">
                                    Scale destroy / build area
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="navigation">
                        <div class="button"
                            @click="showControls=false">
                            Back
                        </div>
                    </div>
                </template>
                <template v-if="showAbout">
                  <div class="about">
                    <div>
                      <h3>Programming and Concept</h3>
                    </div>
                    <div>
                      <a href="https://github.com/dattn">Daniel Duton</a>
                    </div>
                    <div><h3>Contributors & Testers</h3></div>
                    <div>
                      <a href="https://github.com/mouratoclaudio">Claudio Mourato</a><br/>
                      Mike Hanff<br/>
                      <a href="https://github.com/m4s0fd1s">Ben Thinnes</a><br/>
                      <a href="https://github.com/cries">Christian Ries</a><br/></div>
                      <a href="https://github.com/jedi-marcus">Marc Morocutti</a><br/>
                    <div>
                      <h3>Textures & Sprites</h3>
                    </div>
                    <div>
                        <a href="https://www.johnsmithlegacy.co.uk/index.php">Texture Pack - John Smith Legacy</a>
                    </div>
                    <div>
                        <a href="https://opengameart.org/content/player-base-from-crosstown-smash-redshrike-mod">Player Sprites - Crosstown Smash Mod</a>
                    </div>
                  </div>
                  <div class="navigation">
                      <div class="button"
                          @click="showAbout=false">
                          Back
                      </div>
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
        position: relative;
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

    .component-play .dialog-container .splash-screen .santa-bonnet {
        position: absolute;
        background-image: url('../assets/images/bonnet.svg');
        background-size: contain;
        background-repeat: no-repeat;
        padding: 1em;
        width: 120px;
        height: 120px;
        top: -60px;
        right: -60px;
        transform: rotate(20deg);
    }

    .component-play .dialog-container .splash-screen .welcome-message {
        padding: 0 20px 20px 20px;
        font-size: 1em;
    }

    .component-play .dialog-container .splash-screen .navigation {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    .component-play .dialog-container .splash-screen .navigation .button {
        display: flex;
        justify-content: center;
        align-items: center;
        border: 1px solid #FFF;
        border-radius: 5px;
        width: 100px;
        cursor: pointer;
        height: 30px;
        text-transform: uppercase;
    }

    .component-play .dialog-container .splash-screen .navigation .button:hover {
        background-color: #FFF;
        color: #000;
    }

    .component-play .dialog-container .splash-screen .controls {
        display: flex;
        justify-content: center;
        flex-direction: column;
    }

    .component-play .dialog-container .splash-screen .about {
        display: flex;
        justify-content: center;
        flex-direction: column;
        font-size: 1.2em;
        padding-bottom: 20px;
    }

      .component-play .dialog-container .splash-screen .about h3 {
        color: white;
        text-shadow: 2px 2px red;
      }

      .component-play .dialog-container .splash-screen .about a {
        text-decoration: none;
        color: white;
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

    .component-play .dialog-container .splash-screen .wishes-container {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
    }

    .component-play .dialog-container .splash-screen .wishes-container .wish {
        font-size: 2em;
        text-transform: uppercase;
        flex: 1;
        animation: color-change 1s infinite;
    }

    .component-play .dialog-container .splash-screen .wishes-container .ion-logo {
        /*background-color: #FFFFFF;*/
        width: 200px;
        padding: 10px;
        border-radius: 5px;
        margin: 0 auto;
    }

    .component-play .dialog-container .splash-screen .wishes-container .ion-logo img {
        width: 200px;
    }

    .component-play .dialog-container .splash-screen .name-dialog {
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }

    .component-play .dialog-container .splash-screen .name-dialog label {
        display: block;
        text-transform: uppercase;
        font-size: 1.1em;
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

    @keyframes color-change {
        0% {
                color: red;
                text-shadow: 2px 2px white;
            }
        50% {
                color: white;
                text-shadow: 2px 2px red;
            }
        100% {
                color: red;
                text-shadow: 2px 2px white;
            }
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
                showControls: false,
                showAbout: false
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
            start () {
                if (this.$refs.name.value && this.$refs.game) {
                    this.$refs.game.join(this.$refs.name.value)
                }
            },
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
