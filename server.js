const express = require("express")
const { WebSocketServer } = require("ws")
const fs = require("fs")
const cors = require("cors")
const crypto = require("crypto")
const readline = require('readline');
const path = require('path');
const http = require('http')

const app = express()
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true })

app.use(express.json())
app.use(express.static(path.join("pub")))

const { randomUUID } = crypto
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
})

app.get('/wss', (req, res) => {
    res.status(426).send("Upgrade Required");
});

server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    if (pathname === '/wss') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

server.listen(3000, () => {
    console.log("✅ Site rodando em http://localhost:3000");
    console.log("💬 WebSocket aguardando em /wss");
});

app.use(express.json())
app.use(cors())
app.use(express.static(path.join(__dirname, "../client/")));

console.log(randomUUID())

var messages = []
var bans = []
var pals = ["fuck", "drug"]
var limit = 35
var boted = false
var apisKey = [{ apikey: "dda285d7-6685-4c74-8982-7b3019e962a3", id: "21776262863526673427"}, { apikey: "987367d3-3814-43be-8230-5c4d343657a8", id: "826417298252835626354" }, { apikey: "649c1176-441b-4160-b7ff-9ff08ee68b1e", id: "32653746372859482416"}]

// rl(terminal)

function ad(text) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(json({ user: "Server", message: text.trim().replace(/-/g, " "), type: "message-user", image: "https://ui-avatars.com/api/?background=121212&name=Server%20Geral&rounded=true&color=fff" }))
            //{ user: nameuser || "user", message: nome.value, type: "message-user", image: `https://ui-avatars.com/api/?background=random&name=${nameuser}&rounded=true`}
        }
    })
    messages.push({ user: "Server", message: text.trim().replace(/-/g, " "), type: "message-user", image: "https://ui-avatars.com/api/?background=121212&name=Server%20Geral&rounded=true&color=fff" })
}
rl.on("line", (input) => {
    const commandR = input.trim().split(" ")
    const parameters = commandR[1]
    const command = commandR[0]

    if (command === "historic") {
        if (parameters === "remove") {
            messages = []
            console.log("Historico removido")
            ad("O historico foi removido!")
        }
        if (parameters === "read") {
            messages.forEach(msg => {
                console.log(`${msg.user}:${msg.message} \n`)
            })
            console.log("Todas as mensagens, max: " + limit)
            ad("O historico está sendo visto por: Admin")
        }
    } if (command === "admim" || command === "op") {
        // comming
    } if (command === "say") {
        if (!parameters) {console.log("O parametro não pode estar vazio ou falso"); return}

        ad(parameters)
    } if (command === "limitmessage") {
        if (parameters) {
            limit = parameters
            ad("O limite de mensagens foi atualizado para: " + parameters)
        }
    }else {
        console.log("Erro na referencia do comando, verifique a existencia ou a ortografia")
    }
})

// wss
function json(string) { return JSON.stringify(string)}

wss.on("connection", (ws) => {
    console.log("Novo cliente conectado!")
    const ruuid = randomUUID()
    ws.send(json({ userget: "User account get", type: "getaccount", userinfo: 200, id: ruuid, origin: "localhost:3000", messages, onlines: wss.clients.sizenode }))

    if (messages) {
        ws.send(json({ type: "historic", array: messages, limitmessages: limit, users: {} }))
    }
    

    ws.on("message", (e) => {
        const dats = e.toString()

        const obj = JSON.parse(dats)

        if (messages.length > limit) {
            messages.shift()
        }

        var objs = obj.type === "message-user" || obj.type === "message-bot" || obj.type === "status" || obj.type === "badge-bot"
        
        if (objs) {
            messages.push(obj)
        }

        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                if (objs) {
                    client.send(JSON.stringify(obj))
                }
                if (obj.type === "online") {
                    client.send(JSON.stringify({ clients: wss.clients.size, guests: [], type: "online"}))
                }
                if (obj.type === "typing") {
                    client.send(JSON.stringify({ type: "typing", user: obj.user, isTyping: obj.isTyping }))
                }
            }
        });
    })
})

// express.js

app.post("/profiles/add/", (req, res) => {
    const { name, password, email } = req.body
    const uuid = randomUUID()

    fs.readFile("./json/users.json", (err, data) => {
        if (err) { return }

        var json = []

        if (data) {
            json = JSON.parse(data)
        }

        const user = {
            name,
            password,
            email,
            account: {
                verified: true,
                id: uuid,
                role: "user",
                friends: []
            }
        }

        const find = json.find(u => u.email === email)
        if (find) {
            return res.status(200).json({ message: "Perfil Já Criado!", profile: find });
        }

        json.push(user)

        fs.writeFile("./json/users.json", JSON.stringify(json, null, 2), "utf8", (err) => {
            if (err) { return }

            res.status(201).json({ message: "Perfil criado!", profile: user });
            console.log("Novo cliente resistrado!")
        })
    })
})
var setinterval = null

function verifybotonline() {
    if (setinterval) {
        clearInterval(setinterval)
    }
    setinterval = setInterval(() => {
        boted = false
    }, 10000)
}
app.post("/bot/send/ping", (req, res) => {
    res.status(200).json({ message: "Are responded" })
    boted = true
    verifybotonline()
})

app.post("/bot/send/message/badge", (req, res) => {
    const { message, bot, origin } = req.body

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send({ })
        }
    })

    verifybotonline()
})
app.get("/bot/verifyauth", (req, res) => {
    const apikey = req.query.apikey

    const find = apisKey.find(key => key.apikey === apikey)

    if (find) {
        return res.status(200).json({ 
            message: "Measured!", 
            botAlive: true, 
            botFinal: find, 
            badge: "APP ✓" 
        });
    } else {
        return res.status(401).json({ 
            message: "Invalid API Key", 
            botAlive: false 
        });
    }
})

console.log("Servidor iniciado!")
