import Vector from './Vector'

let NEXT_ENTITY_ID = 1
let entities = {}

export class Trait {
    update (entity, updateData) {
    }

    render (entity, t) {
    }

    destroy () {
    }
}

export const getById = (id) => {
    return entities.hasOwnProperty(id)
        ? entities[id]
        : undefined
}

export default class Entity {
    constructor (app) {
        this.ENTITY_ID = NEXT_ENTITY_ID
        NEXT_ENTITY_ID++
        entities[this.ENTITY_ID] = this

        this.app = app
        this.position = new Vector(0, 0)
        this.rotation = 0
        this.traits = []

        this.old = {
            position: this.position.clone(),
            rotation: this.rotation
        }

        this.destroyed = false
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
        if (this.destroyed) {
            return
        }
        this.update(updateData)
        this.traits.forEach(trait => {
            trait.update(this, updateData)
        })
    }

    render (t) {}

    handleRender (dtime, time) {
        if (this.destroyed) {
            return
        }
        this.render(dtime, time)
        this.traits.forEach(trait => {
            trait.render(this, dtime, time)
        })
    }

    destroy () {
        this.destroyed = true

        delete entities[this.ENTITY_ID]
        while (this.traits.length) {
            let trait = this.traits.pop()
            trait.destroy()
            this[trait.constructor.name] = undefined
        }
    }
}
