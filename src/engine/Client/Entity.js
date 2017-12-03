import CommonEntity from '../Common/Entity'

export default class Entity extends CommonEntity {
    render (t) {}

    handleRender (dtime, time) {
        this.render(dtime, time)
        this.traits.forEach(trait => {
            trait.render(this, dtime, time)
        })
    }
}
