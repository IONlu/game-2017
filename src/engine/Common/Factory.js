class Factory {
    constructor () {
        this.classNameMap = {}
    }

    add (className, classDef) {
        this.classNameMap[className] = classDef
    }

    create (className) {
        var classDef = this.classNameMap[className]

        // http://stackoverflow.com/a/8843181/907375
        return new (Function.bind.apply(classDef, [
            null,
            ...([...arguments].slice(1))
        ]))()
    }
}

export default new Factory()
