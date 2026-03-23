# Sistema de Contagem de Catraca TsPlus → Firebase

## O que você tem neste pacote

| Arquivo                  | Para que serve                                      |
|--------------------------|-----------------------------------------------------|
| `monitor_catraca.py`     | Roda no computador da rede local, escuta a catraca via TCP e envia cada passagem para o Firebase |
| `dashboard_catraca.html` | Página web que exibe a contagem em tempo real, pode ser aberta em qualquer navegador ou hospedada online |

---

## Passo 1 — Criar o projeto no Firebase

1. Acesse https://console.firebase.google.com
2. Clique em **"Adicionar projeto"** → dê um nome (ex: `catraca-empresa`)
3. No menu lateral, clique em **"Realtime Database"** → **"Criar banco de dados"**
   - Escolha o modo **"Iniciar no modo de teste"** (para desenvolvimento)
   - Região: `us-central1` (padrão)
4. Anote a URL do banco, parecida com:
   `https://catraca-empresa-default-rtdb.firebaseio.com`

---

## Passo 2 — Credenciais para o script Python

1. No Firebase Console, clique na **engrenagem (⚙)** → **"Configurações do projeto"**
2. Aba **"Contas de serviço"**
3. Clique em **"Gerar nova chave privada"** → baixe o arquivo JSON
4. Renomeie para `firebase_credentials.json` e coloque na mesma pasta do `monitor_catraca.py`

---

## Passo 3 — Configurar o script Python

Abra `monitor_catraca.py` e edite as linhas no topo:

```python
CATRACA_IP      = "10.0.0.32"    # IP que você configurou no TsPlus
CATRACA_PORT    = 3000           # Porta (confirme no software TsPlus)
FIREBASE_DB_URL = "https://SEU-PROJETO.firebaseio.com"  # URL do passo 1
```

---

## Passo 4 — Instalar dependências e rodar

```bash
pip install firebase-admin

python monitor_catraca.py
```

Você deve ver no terminal:
```
Firebase inicializado com sucesso
Conectando em 10.0.0.32:3000...
Conectado à catraca!
Passagem registrada!  Total acumulado: 1
```

---

## Passo 5 — Configurar o Dashboard Web

Abra o arquivo `dashboard_catraca.html` em qualquer navegador.

Clique em **"Configurar Firebase"** na parte inferior e preencha:

1. No Firebase Console → **Configurações do projeto** → aba **"Geral"**
2. Role até **"Seus aplicativos"** → clique em **"</>"** para adicionar um app web
3. Copie as credenciais (`apiKey`, `authDomain`, `databaseURL`, `projectId`)
4. Cole no painel de configuração do dashboard e clique em **"Conectar"**

As configurações ficam salvas no navegador — não precisa preencher toda vez.

---

## Regras de segurança Firebase (importante!)

Quando for usar em produção, altere as regras do Realtime Database:

```json
{
  "rules": {
    "contador": {
      ".read": true,
      ".write": false
    },
    "eventos": {
      ".read": true,
      ".write": false
    },
    "$other": {
      ".read": false,
      ".write": false
    }
  }
}
```

Isso permite que o dashboard leia os dados mas só o script Python (autenticado pela chave privada) possa escrever.

---

## Estrutura dos dados no Firebase

```
/
├── contador/
│   └── total: 247          ← número total de passagens
│
└── eventos/
    ├── -Nxyz123/
    │   ├── timestamp: "2024-01-15T14:32:10"
    │   ├── data:      "2024-01-15"
    │   ├── hora:      "14:32:10"
    │   └── total_acumulado: 247
    └── ...
```

---

## Dúvidas comuns

**A porta da catraca não é 3000 — como descubro?**
No software TsPlus, vá em configurações de rede e procure por "porta TCP" ou use o Wireshark para capturar o tráfego enquanto o software conecta.

**O script conecta mas não detecta passagens**
Rode o script com `logging.DEBUG` para ver todos os bytes recebidos. Pode ser que a catraca use um byte diferente de 0x02. Compare o que aparece no "Monitor de comunicação" do TsPlus.

**Posso hospedar o dashboard online?**
Sim! O arquivo HTML é auto-suficiente. Você pode subir no GitHub Pages, Netlify, ou qualquer hospedagem estática gratuita.