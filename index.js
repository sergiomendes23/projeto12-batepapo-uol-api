import express from 'express';
import cors from 'cors';
import dayjs from 'dayjs';
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from 'joi';

const server = express();
server.use(cors());
server.use(express.json());
dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);

let db;

mongoClient.connect().then(() => {
    db = mongoClient.db('batepapo-uol');
})

const userSchema = joi.object({
    name: joi.string().required(),
})

const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid('message', 'private_message')

})


server.post('/participants', async function (req, res) {
    const {name}  = req.body;
    const validacao = userSchema.validate(req.body)
    const participantesNovos = await db.collection('participantes').findOne({name});

    if(validacao.error) {
        res.status(422).send('O nome de usuário não pode estar vazio');
        return;
    }

    if(participantesNovos) {
        res
        .status(409)
        .send('Já existe um usuário com esse nome. Por favor, escolha outro');
        return;
    }

    try{
        await db.collection('messages').insertOne({
            from: name,
            to: 'Todos',
            text: 'entra na sala...', 
            type: 'status', 
            time: dayjs(Date.now()).format('hh:mm:ss')
        
        })
        await db.collection('participantes').insertOne({
            name,
            lastStatus: Date.now()
        })
        return res.sendStatus(201);    
    }catch(error){
        return res.sendStatus(400);
    }
})

server.get('/participants', async function (req, res) {
    const usuarios = await db.collection('participantes').find().toArray();
    
    res.send(usuarios);
})

server.post('/messages', async function (req, res) {
    const { to, text, type } = req.body;
    const { user: from } = req.headers;
    const usuarioAtivo = await db.collection('participantes').findOne({name: from})
    const validacao = messageSchema.validate({ to, text, type });

    if(!usuarioAtivo || validacao.error){
        res.status(422).send('O nome de usuário não pode estar vazio');
    }

    const mensagem = {
        to,
        text,
        type,
        from,
        time: dayjs(Date.now()).format('hh:mm:ss')
    }
    await db.collection('messages').insertOne(mensagem)
    return res.sendStatus(201);
})

server.get('/messages', async function (req, res) {
    const mensagens = await db.collection('messages').find().toArray();
    const {limit} = req.query;
    const {user} = req.headers;
    let ultimasMensagens = mensagens
        ultimasMensagens = ultimasMensagens.filter((value) => {
        return(
            value.type === 'status' ||
            value.type === 'message' ||
            (value.type === 'private_message' &&
            (value.to === user || value.from === user))
        )
    })


    if(limit) {
        ultimasMensagens = ultimasMensagens.slice(-limit);
    }
    res.send(ultimasMensagens);
})

server.listen(5000);