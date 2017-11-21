<template>
    <div id="app">
        <router-view></router-view>
    </div>
</template>

<style>
    @font-face {
        font-family: 'Hardpixel';
        src: url('assets/fonts/Hardpixel.eot');
        src: url('assets/fonts/Hardpixel.eot?#iefix') format('embedded-opentype'),
            url('assets/fonts/Hardpixel.woff') format('woff'),
            url('assets/fonts/Hardpixel.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
    }

    html, body, #app {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    #app {
        font-family: Hardpixel, sans-serif;
    }
</style>

<script>
    export default {
        name: 'app'
    }
</script>
