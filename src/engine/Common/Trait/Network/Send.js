import { Trait } from '../../Entity'

export default class Send extends Trait {
    constructor (socket) {
        super()
        this.socket = socket
    }

    update (entity, updateData) {
        super.update(entity, updateData)

        this.socket.emit('update', [
            entity.position.x,
            entity.position.y,
            entity.rotation
        ])
    }
}
