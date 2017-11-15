import { Point } from 'pixi.js'

export default class Camera {
    constructor (app) {
        this.app = app
        this.position = new Point(0, 0)
        this.scale = new Point(1, 1)
    }

    viewBox () {
        let width = this.app.renderer.width / this.scale.x
        let height = this.app.renderer.height / this.scale.y
        let x = this.position.x - (width / 2)
        let y = this.position.y - (height / 2)
        return { x, y, width, height }
    }

    placeContainer (container) {
        container.scale.set(this.scale.x, this.scale.y)
        container.position.set(-this.position.x * this.scale.x, -this.position.y * this.scale.y)

        let viewBox = this.viewBox()
        container.pivot.x = -viewBox.width / 2
        container.pivot.y = -viewBox.height / 2
    }
}
