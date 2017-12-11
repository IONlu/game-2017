import Vector from './Vector'

export class Trait {
    update (entity, updateData) {
    }

    render (entity, t) {
    }

    destroy () {
    }
}

export default class Entity {
    constructor (app) {
        this.app = app
        this.position = new Vector(0, 0)
        this.rotation = 0
        this.traits = []
    }

    addTrait (trait, name) {
        this.traits.push(trait)
        if (name) {
            this[name] = trait
        }
    }

    update (updateData) {
        this.old = {
            position: this.position.clone(),
            rotation: this.rotation
        }
    }

    handleUpdate (updateData) {
        this.update(updateData)
        this.traits.forEach(trait => {
            trait.update(this, updateData)
        })
    }

    render (t) {}

    handleRender (dtime, time) {
        this.render(dtime, time)
        this.traits.forEach(trait => {
            trait.render(this, dtime, time)
        })
    }

    destroy () {
        while (this.traits.length) {
            let trait = this.traits.pop()
            trait.destroy()
            this[trait.constructor.name] = undefined
        }
    }
}
