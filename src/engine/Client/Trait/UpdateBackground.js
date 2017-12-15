import { Trait } from '../../Common/Entity'

export default class UpdateBackground extends Trait {
    constructor (background) {
        super()
        this.background = background
    }

    render (entity, t) {
        super.render(entity, t)

        this.background.setPosition(entity.sprite.x, entity.sprite.y)
    }
}
