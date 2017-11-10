import { Point } from 'pixi.js'

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
        this.position = new Point(0, 0)
        this.rotation = 0
        this.traits = []
    }

    addTrait (trait) {
        this.traits.push(trait)
        this[trait.constructor.name] = trait
    }

    update (updateData) {
        this.old = {
            position: new Point(this.position.x, this.position.y),
            rotation: this.rotation
        }

        this.traits.forEach(trait => {
            trait.update(this, updateData)
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
