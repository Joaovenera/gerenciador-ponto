-- Tabela de Usuários (para autenticação)
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'funcionario', -- 'admin' ou 'funcionario'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Funcionários
CREATE TABLE funcionarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL,
  setor TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  codigo TEXT UNIQUE NOT NULL, -- Para QR Code ou identificação
  usuario_id INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabela de Registros de Ponto
CREATE TABLE pontos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  funcionario_id INTEGER NOT NULL,
  tipo TEXT NOT NULL, -- 'entrada' ou 'saida'
  data_hora TIMESTAMP NOT NULL,
  latitude REAL,
  longitude REAL,
  ip TEXT,
  observacao TEXT,
  corrigido BOOLEAN DEFAULT FALSE,
  corrigido_por INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id),
  FOREIGN KEY (corrigido_por) REFERENCES usuarios(id)
);
