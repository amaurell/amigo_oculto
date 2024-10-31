const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const DATA_PATH = './data.json';
const SORTEADOS_PATH = './sorteados.json';




// Função para ler arquivos JSON
function readJSON(path) {
    if (fs.existsSync(path)) {
        return JSON.parse(fs.readFileSync(path, 'utf-8'));
    }
    return [];
}

// Função para gravar em arquivos JSON
function writeJSON(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

// Página inicial de cadastro e login
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});
app.get('/registro', (req, res) => {
    res.sendFile(__dirname + '/views/registro.html');
});

// Cadastro de usuários
app.post('/cadastrar', (req, res) => {
   
    const { email, sugestao, senha } = req.body;
    const users = readJSON(DATA_PATH);
  

  
      
    
    // Verificação de email repetido
    if (users.find(user => user.email === email)) {
        // return res.send('Erro: Email já cadastrado.');
        return res.sendFile(__dirname + '/views/msg_emailjacadastrado.html');
     
       
    }

    // Adicionar usuário ao banco de dados
  
    users.push({ email, sugestao, senha });
    writeJSON(DATA_PATH, users);
    // res.send('Cadastro realizado com sucesso.');
    return res.sendFile(__dirname + '/views/msg_sucesso.html');
});

// Login do usuário
app.post('/login', (req, res) => {
   
    
    const { email, senha } = req.body;
    const users = readJSON(DATA_PATH);

    const user = users.find(u => u.email === email && u.senha === senha);
    
    // COLOCAR O EMAIL DA PESSOAS QUE IRÁ FAZER O SORTEIO
    if (!user && email !== 'usuario@dominio') {
        // return res.send('Erro: Usuário ou senha inválidos.');
        return res.sendFile(__dirname + '/views/msg_erro.html');
    }

    if (email === 'admin@admin') {
        return res.redirect('/admin');
    }

    // Página do usuário após o sorteio
    const sorteados = readJSON(SORTEADOS_PATH);
    const sorteio = sorteados.find(s => s.sorteador === email);
    if (sorteio) {
        res.send(`
            <div >
                <h3>Resultado do Sorteio:</h3>
                <div >
                    <p>Você sorteou: ${sorteio.sorteado}</p>
                    <p>Sugestão de presente: ${sorteio.sugestao}</p>
                    <a href="/"><button>voltar</button></a> 
                </div>
            </div>
        
        `);
       
    } else {
        return res.sendFile(__dirname + '/views/msg_sorteionrealizado.html');
    }
});

// Página de admin para sorteio
app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/views/admin.html');
});

// Realiza o sorteio
app.post('/sortear', (req, res) => {
    const users = readJSON(DATA_PATH).filter(user => user.email !== 'admin@admin'); // Admin não participa
    if (users.length < 2) {
        // return res.send('Erro: Não há usuários suficientes para o sorteio.');
        res.sendFile(__dirname + '/views/msg_errosorteio.html');
    }

    let sorteados = [];
    let tentativas = 0;

    while (sorteados.length !== users.length && tentativas < 100) {
        tentativas++;
        sorteados = [];
        const disponiveis = [...users];
        for (let user of users) {
            const possiveis = disponiveis.filter(d => d.email !== user.email);
            if (possiveis.length === 0) break;
            const sorteado = possiveis[Math.floor(Math.random() * possiveis.length)];
            sorteados.push({
                sorteador: user.email,
                sorteado: sorteado.email,
                sugestao: sorteado.sugestao
            });
            const index = disponiveis.indexOf(sorteado);
            disponiveis.splice(index, 1);
        }
    }

    if (sorteados.length !== users.length) {
        // return res.send('Erro: Não foi possível realizar o sorteio.');
        res.sendFile(__dirname + '/views/msg_sorteioerro.html');
    }

    writeJSON(SORTEADOS_PATH, sorteados);
    // res.send('Sorteio realizado com sucesso!');
    res.sendFile(__dirname + '/views/msg_sorteio.html');
});

// Inicialização do servidor
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
