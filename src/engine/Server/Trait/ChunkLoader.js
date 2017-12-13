import { Trait } from '../../Common/Entity'

export default class ChunkLoader extends Trait {
    constructor (map) {
        super()
        this.map = map
    }

    update (entity, updateData) {
        super.update(entity, updateData)

        this.map.loadChunksByPosition(entity.body.body.position.x, entity.body.body.position.y)
    }
}
