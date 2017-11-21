import CommonEntity from '../Common/Entity'

export default class Entity extends CommonEntity {
    render (t) {}

    handleRender (t) {
        this.render(t)
        this.traits.forEach(trait => {
            trait.render(this, t)
        })
    }
}
