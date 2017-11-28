import Chance from 'chance'
import SimplexNoise from 'simplex-noise'
import BlockData from '../../assets/texture/block.json'

const SEED = 'ION Game 2017'

const random = seed => {
    let chance = new Chance(seed)
    return () => chance.random()
}

let offsetMap = {}
const offset = seed => {
    if (!offsetMap.hasOwnProperty(seed)) {
        offsetMap[seed] = (random(SEED + '::OFFSET_' + seed)() - 0.5) * 10000
    }
    return offsetMap[seed]
}

// init height noise
const HeightNoise = [
    new SimplexNoise(random(SEED + '::HEIGHT_A')),
    new SimplexNoise(random(SEED + '::HEIGHT_B')),
    new SimplexNoise(random(SEED + '::HEIGHT_C'))
]

// init block noise
const BlockNoise = {}
for (let name in BlockData.frames) {
    BlockNoise[name] = new SimplexNoise(random(SEED + '::' + name.toUpperCase()))
}

// get height for a given x position (cached)
let heightMap = {}
export const height = x => {
    if (!heightMap.hasOwnProperty(x)) {
        let valueA = HeightNoise[0].noise2D((x + offset('A')) / 4000, offset('A')) * 300
        let valueB = HeightNoise[1].noise2D((x + offset('B')) / 1500, offset('B')) * 100
        let valueC = HeightNoise[2].noise2D((x + offset('C')) / 123, offset('C')) * 10
        heightMap[x] = valueA + valueB + valueC
    }
    return heightMap[x]
}

// get tile type by x / y
export const tile = (x, y) => {
    if (-y > height(x)) {
        return undefined
    }

    let noise = []
    for (let name in BlockData.frames) {
        noise.push(BlockNoise[name].noise2D(
            (x / 512) + offset(name),
            (y / 512) + offset(name)
        ))
    }
    let type = -1
    return noise.reduce((acc, val) => {
        type++
        return noise[acc] > val
            ? acc
            : type
    }, 0) + 1
}
