import Chance from 'chance'
import SimplexNoise from 'simplex-noise'
import BlockData from '../../assets/texture/block.json'

const SEED = 'ION Game 2017'

let index = 0
const BLOCK_TYPES = Object.keys(BlockData.frames).reduce((acc, type) => {
    index++
    acc[type] = index
    return acc
}, {})

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
for (let name in BLOCK_TYPES) {
    BlockNoise[name] = new SimplexNoise(random(SEED + '::' + name.toUpperCase()))
}

// init dungeon noise
const DungeonNoise = [
    new SimplexNoise(random(SEED + '::DUNGEON_A')),
    new SimplexNoise(random(SEED + '::DUNGEON_B')),
    new SimplexNoise(random(SEED + '::DUNGEON_C')),
    new SimplexNoise(random(SEED + '::DUNGEON_D'))
]

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

// get dungeon info
export const isDungeon = (x, y) => {
    let valueA = DungeonNoise[0].noise2D((x + offset('D')) / 2000, (y + offset('D')) / 2000) * 300
    let valueB = DungeonNoise[1].noise2D((x + offset('E')) / 1111, (y + offset('E')) / 1111) * 111
    let valueC = DungeonNoise[2].noise2D((x + offset('F')) / 50, (y + offset('F')) / 50) * 50
    return DungeonNoise[3].noise2D((x + offset('G')) / 800, (y + offset('G')) / 800) * 50 < 20 &&
        (
            Math.abs(valueA) < 1 || Math.abs(valueB + valueC) < 10
        )
}

// check if there is a tile
export const isTile = (x, y, background = false) => {
    return -y <= height(x) &&
        (
            background ||
            !isDungeon(x, y)
        )
}

// get tile type by x / y
let renderBlockTypes = [ 'clay', 'dirt', 'gravel', 'sand', 'red_sand', 'stone' ]
export const tile = (x, y, background = false) => {
    if (!isTile(x, y, background)) {
        return 0
    }

    let noise = renderBlockTypes.map(name => {
        return BlockNoise[name].noise2D(
            (x / 512) + offset(name),
            (y / 512) + offset(name)
        )
    })

    let renderTypeIndex = 0
    for (let i = 1; i < renderBlockTypes.length; i++) {
        if (noise[i] > noise[renderTypeIndex]) {
            renderTypeIndex = i
        }
    }
    let blockType = renderBlockTypes[renderTypeIndex]

    if (blockType === 'dirt') {
        for (let i = x - 1; i <= x + 1; i++) {
            if (
                !isTile(i, y - 1, background) &&
                isTile(x, y + 1, background)
            ) {
                return BLOCK_TYPES['grass']
            }
        }
    }

    return BLOCK_TYPES[blockType]
}

const TreeNoise = new SimplexNoise(random(SEED + '::TREE'))
export const isTree = x => {
    return TreeNoise.noise2D(x, 0) > 0.5
}

const GiftNoise = new SimplexNoise(random(SEED + '::GIFT'))
export const isGift = x => {
    return GiftNoise.noise2D(x, 0) > 0.5
}

const CaneNoise = new SimplexNoise(random(SEED + '::CANE'))
export const isCane = x => {
    return CaneNoise.noise2D(x, 0) > 0.5
}
