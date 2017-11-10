import Chance from 'chance'
import SimplexNoise from 'simplex-noise'
import { CHUNK_SIZE } from '@/config'
import BlockData from '@/assets/texture/block.json'

const random = seed => {
    let chance = new Chance(seed)
    return () => chance.random()
}

const SEED = 'ION Game 2017'
const HeightNoise = new SimplexNoise(random(SEED + '::HEIGHT'))
const BlockNoise = {}
for (let name in BlockData.frames) {
    BlockNoise[name] = new SimplexNoise(random(SEED + '::' + name.toUpperCase()))
}

const generateChunk = (x, y) => {
    let height = []
    for (let i = 0; i < CHUNK_SIZE; i++) {
        let valueA = HeightNoise.noise2D(((x * CHUNK_SIZE) + i) / 512, 0) * 20
        let valueB = HeightNoise.noise2D(((x * CHUNK_SIZE) + i) / 64, 0) * 10
        height.push(valueA + valueB)
    }
    return new Promise(resolve => {
        let chunkData = []
        for (let j = 0; j < CHUNK_SIZE; j++) {
            for (let i = 0; i < CHUNK_SIZE; i++) {
                let tile
                if ((y * CHUNK_SIZE) + j > height[i]) {
                    let noiseX = ((x * CHUNK_SIZE) + i) / 128
                    let noiseY = ((y * CHUNK_SIZE) + j) / 128
                    let noise = []
                    for (let name in BlockData.frames) {
                        noise.push(BlockNoise[name].noise2D(noiseX, noiseY))
                    }
                    let index = -1
                    tile = noise.reduce((acc, val) => {
                        index++
                        return noise[acc] > val
                            ? acc
                            : index
                    }, 0) + 1
                }
                chunkData.push(tile)
            }
        }
        resolve(chunkData)
    })
}

self.addEventListener('message', evt => {
    generateChunk(evt.data.x, evt.data.y)
        .then(chunk => {
            self.postMessage({
                x: evt.data.x,
                y: evt.data.y,
                chunk
            })
        })
}, false)
