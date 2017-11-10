import express from 'express'
// import socketio from 'socket.io'
import http from 'http'
import path from 'path'

const app = express()
const server = http.createServer(app)
// const io = socketio(server)

app.use(express.static(path.join([ __dirname, '..', 'dist' ])))
app.get('/', (req, res, next) => {
    res.sendFile([ __dirname, 'index.html' ])
})

server.listen(4200)
