import { generateData } from './Chunk'

self.addEventListener('message', evt => {
    generateData(evt.data.x, evt.data.y)
        .then(chunk => {
            self.postMessage({
                x: evt.data.x,
                y: evt.data.y,
                chunk
            })
        })
}, false)
