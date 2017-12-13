import PhysicsEngine from './PhysicsEngine'
import Factory from './Factory'

var nextEntityID = 1

export default class GameEngine {
    constructor (loop) {
        this.loop = loop
        this.physics = new PhysicsEngine()
        this.entities = []

        this.states = []
        this.maxStateCount = 100
        this.updateStep = 0

        this.isRunning = false

        this.loop.on('update', this.update.bind(this))
    }

    createEntity (entityName, options = {}) {
        var ID = nextEntityID
        nextEntityID++

        var entity = Factory.create(entityName, this, options)

        entity.ID = ID
        entity.name = entityName
        entity.label = entityName + '_' + ID

        this.entities.push(entity)
        return entity
    }

    destroyEntity (entity) {
        entity.destroy()

        // remove entity from entites array
        var index = this.entities.indexOf(entity)
        if (index > -1) {
            this.entities.splice(index, 1)
        }
    }

    update () {
        this.updateStep++
        var updateData = {
            step: this.updateStep
        }

        this.entities.forEach(entity => {
            if (entity.handleUpdate) {
                entity.handleUpdate(updateData)
            }
        })
        this.physics.update(updateData)
    }

    start () {
        this.isRunning = true
        this.loop.start()
    }

    stop () {
        this.loop.stop()
        this.isRunning = false
    }

    destroy () {
        this.stop()
    }
}
