// config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Garantir que o diretório de dados existe
const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'registro-ponto.db');

// Criar conexão com o banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
    throw err;
  }
  console.log('Conectado ao banco de dados SQLite.');
});

// Habilitar chaves estrangeiras
db.run('PRAGMA foreign_keys = ON');

// Executar consulta SQL com promessa
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.error('Erro na execução da query:', sql);
        console.error('Erro:', err);
        reject(err);
        return;
      }
      resolve({ id: this.lastID });
    });
  });
};

// Obter um único registro
const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, result) => {
      if (err) {
        console.error('Erro na execução da query:', sql);
        console.error('Erro:', err);
        reject(err);
        return;
      }
      resolve(result);
    });
  });
};

// Obter múltiplos registros
const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Erro na execução da query:', sql);
        console.error('Erro:', err);
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
};

// Inicializar o banco de dados com o esquema
const initDatabase = async () => {
  try {
    // Ler o arquivo SQL com o esquema
    const schemaPath = path.join(__dirname, '../../modelo-banco.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Dividir o esquema em comandos individuais
    const commands = schema
      .split(';')
      .map(command => command.trim())
      .filter(command => command.length > 0);
    
    // Executar cada comando
    for (const command of commands) {
      await run(`${command};`);
    }
    
    console.log('Banco de dados inicializado com sucesso.');
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    throw error;
  }
};

module.exports = {
  db,
  run,
  get,
  all,
  initDatabase
};
