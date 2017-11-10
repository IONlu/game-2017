import CommonEntity from '../Common/Entity'

export default class Entity extends CommonEntity {
    render (t) {
        this.traits.forEach(trait => {
            trait.render(this, t)
        })
    }
}
