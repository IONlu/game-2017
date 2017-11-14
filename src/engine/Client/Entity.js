const { Common: CommonEntity } = require('../Common/Entity')

exports.Entity = class Entity extends CommonEntity {
    render (t) {
        this.traits.forEach(trait => {
            trait.render(this, t)
        })
    }
}
