import { Trait } from '../../Common/Entity'

export default class ChunkLoader extends Trait {
    constructor (map) {
        super()
        this.map = map
    }

    update (entity, updateData) {
        super.update(entity, updateData)

        this.map.loadChunksByPosition(entity.position.x, entity.position.y)
        this.map.unloadChunksByPosition(entity.position.x, entity.position.y)
    }
}
