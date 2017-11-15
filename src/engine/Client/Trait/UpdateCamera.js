import { Trait } from '../../Common/Entity'

export default class UpdateCamera extends Trait {
    constructor (camera) {
        super()
        this.camera = camera
    }

    render (entity, t) {
        super.render(entity, t)

        this.camera.position.set(entity.sprite.x, entity.sprite.y)
    }
}
