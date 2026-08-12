const WebSocket = require('ws');

// Configurações do Bot
const SERVER_URL = 'http://26.160.61.212:3000';
const WS_URL = 'ws://26.160.61.212:3000/wss';
const API_KEY = 'dda285d7-6685-4c74-8982-7b3019e962a3'; // Chave cadastrada no servidor

let ws;

// 1. Função para Autenticar o Bot
async function autenticarBot() {
    try {
        const response = await fetch(`${SERVER_URL}/bot/verifyauth?apikey=${API_KEY}`);
        const data = await response.json();

        if (response.ok && data.botAlive) {
            console.log('✅ Bot autenticado com sucesso! Badge:', data.badge);
            iniciarPing();
            conectarWebSocket();
        } else {
            console.error('❌ Falha na autenticação do bot:', data.message);
        }
    } catch (error) {
        console.error('Erro ao tentar autenticar:', error.message);
    }
}

// 2. Mantém o servidor ciente de que o bot está online (a cada 5 segundos)
function iniciarPing() {
    setInterval(async () => {
        try {
            await fetch(`${SERVER_URL}/bot/send/ping`, { method: 'POST' });
            // console.log("Ping enviado ao servidor!");
        } catch (error) {
            console.error('Erro ao enviar ping:', error.message);
        }
    }, 5000); // 5 segundos (menor que o limite de 10s do servidor)
}

// 3. Conexão WebSocket para enviar e receber mensagens
function conectarWebSocket() {
    ws = new WebSocket(WS_URL);

    ws.on('open', () => {
        console.log('🌐 Bot conectado ao WebSocket!');

        // Exemplo: Enviar uma mensagem assim que conectar
        enviarMensagem('Olá a todos! O bot está online.');
    });

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data.toString());
            console.log('📩 Mensagem recebida no chat:', msg);

            // Exemplo de resposta automática se alguém disser "oi bot"
            if (msg.type === 'message-user' && msg.message.toLowerCase() === 'oi bot') {
                enviarMensagem(`Olá, @${msg.user}! Como posso ajudar?`);
            }
        } catch (err) {
            console.error('Erro ao processar mensagem recebida:', err);
        }
    });

    ws.on('close', () => {
        console.log('🔌 Conexão WebSocket fechada. Tentando reconectar em 3s...');
        setTimeout(conectarWebSocket, 3000);
    });

    ws.on('error', (err) => {
        console.error('Erro no WebSocket:', err.message);
    });
}

// Função auxiliar para enviar mensagem ao chat
function enviarMensagem(texto) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const payload = {
            user: 'MeuBot',
            message: texto,
            type: 'message-bot',
            image: 'https://ui-avatars.com/api/?background=0D8ABC&name=Bot&rounded=true&color=fff'
        };
        ws.send(JSON.stringify(payload));
    }
}

// Inicia o bot
autenticarBot();
