<template>
    <div id="app">
        <router-view></router-view>
    </div>
</template>

<style>
    html, body, #app {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }
</style>

<script>
    export default {
        name: 'app'
    }
</script>
