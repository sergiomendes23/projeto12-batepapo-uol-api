import express from 'express';
import cors from 'cors';
import dayjs from 'dayjs';

const server = express();
server.use(cors());
server.use(express.json());

const participantes = [{name: 'João'}, {name: 'maria'}];
const formatoHora = dayjs().format('hh:mm:ss');
const messages = [
    {from: 'maria', 
    to: 'Todos', 
    text: 'entra na sala...', 
    type: 'status', 
    time: 'HH:MM:SS'}
];


server.post('/participants', function (req, res) {
    const {name}  = req.body;
    const participantesNovos = participantes.find((participante) => participante.name === name);

    if( name === '') {
        res.status(422).send('O nome de usuário não pode estar vazio');
        return;
    }

    if(participantesNovos) {
        res
        .status(409)
        .send('Já existe um usuário com esse nome. Por favor, escolha outro');
        return;
    }

    participantes.push({
        name,
        formatoHora: Date.now()
    });
    res.sendStatus(201);    
})

server.get('/participants', function (req, res) {
    res.send(participantes)
})

server.post('/messages', function (req, res) {
    const { to, text, type } = req.body
    const { user: from } = req.headers

    if(to === "" || text === ""){
        res.status(422).send('O nome de usuário não pode estar vazio');
    }
    if(type !== 'message' && type !== "private_message"){
        res.sendStatus(422)
        return;
    }

    const mensagem = {
        to,
        text,
        type,
        from,
        formatoHora
    }
    res.send(mensagem)
})

server.get('/messages', function (req, res) {
    const {limit} = req.query;
    let ultimasMenssagens = messages;

    if(limit) {
        ultimasMenssagens = messages.slice(-limit);
    }
    res.send(ultimasMenssagens);
})

server.listen(5000);