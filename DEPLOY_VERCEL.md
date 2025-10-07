# 🚀 Guia de Deploy no Vercel

## Por que Vercel?

- ✅ **Gratuito** para projetos pessoais
- ✅ **Deploy automático** via GitHub
- ✅ **HTTPS grátis** e domínio `.vercel.app`
- ✅ **Builds rápidos** e CDN global
- ✅ **Fácil configuração** - zero config para Next.js/Node.js

## Passo 1: Preparar o Repositório

✅ **CONCLUÍDO** - Código já está no GitHub: https://github.com/seu-dev-br/bot_ava_whatsapp

## Passo 2: Deploy no Vercel

### Opção A - Via Dashboard (Recomendado)

1. **Acesse**: https://vercel.com/
2. **Faça login** com sua conta GitHub
3. **Clique em "Add New..."** → "Project"
4. **Import Git Repository**:
   - Procure por: `seu-dev-br/bot_ava_whatsapp`
   - Clique em **"Import"**

5. **Configure o projeto**:
   ```
   Framework Preset: Other
   Root Directory: ./
   Build Command: (deixe vazio ou "npm install")
   Output Directory: (deixe vazio)
   Install Command: npm install
   ```

6. **Clique em "Deploy"**

### Opção B - Via CLI

```powershell
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Deploy
vercel

# Deploy para produção
vercel --prod
```

## Passo 3: Verificar Deploy

Após o deploy (1-2 minutos):
- Vercel fornecerá uma URL como: `https://bot-ava-whatsapp.vercel.app`
- Acesse a URL para testar o frontend
- O servidor estará rodando automaticamente

## Passo 4: Configurar Variáveis de Ambiente (Opcional)

Se você quiser que o backend notifique o bot local via webhook:

1. No painel do Vercel, vá para o projeto
2. Clique em **Settings** → **Environment Variables**
3. Adicione:
   ```
   Key: BOT_WEBHOOK_URL
   Value: https://sua-url-ngrok.ngrok.io
   ```

## Passo 5: Conectar Bot Local ao Vercel

Edite o arquivo `.env` local:

```env
BACKEND_URL=https://bot-ava-whatsapp.vercel.app
BOT_API_PORT=3001
```

Reinicie o bot:
```powershell
npm start
```

## ⚠️ Limitações do Vercel

### O que FUNCIONA:
✅ Frontend web (visualizar, criar lembretes, upload .ics)
✅ API REST (todas as rotas GET/POST/PUT/DELETE)
✅ Gerenciamento de disciplinas
✅ HTTPS automático

### O que NÃO funciona:
❌ **Upload de arquivos persistente** - o Vercel é serverless, arquivos não persistem entre deploys
❌ **Bot WhatsApp** - não pode rodar no Vercel (precisa rodar localmente)

## Solução para Persistência de Dados

### Opção 1: Usar banco de dados externo
- **Supabase** (PostgreSQL gratuito)
- **MongoDB Atlas** (NoSQL gratuito)
- **PlanetScale** (MySQL serverless)

### Opção 2: Usar storage externo
- **Vercel Blob Storage** (storage serverless do Vercel)
- **AWS S3**
- **Cloudinary** (para arquivos)

### Opção 3: Manter calendário local
- Backend no Vercel apenas para visualização
- Bot local gerencia o arquivo `calendario.ics`
- Frontend consulta via API do bot local (usando ngrok)

## Recomendação para seu caso

Como o `calendario.ics` precisa persistir:

1. **Deploy frontend no Vercel** → interface de visualização
2. **Bot roda localmente** → gerencia arquivo .ics
3. **Use ngrok** para expor bot local → frontend acessa via webhook

## Configuração com ngrok

```powershell
# Terminal 1: Bot local
npm start

# Terminal 2: Servidor local
npm run web

# Terminal 3: Expor porta 3000
ngrok http 3000
```

Copie a URL do ngrok e use no frontend Vercel.

## Comandos Úteis

```powershell
# Ver logs do deploy
vercel logs

# Remover projeto
vercel remove

# Ver domínios
vercel domains ls

# Adicionar domínio customizado
vercel domains add seubotava.com
```

## Custo

- **Hobby (Gratuito)**:
  - 100 GB-Hours de execução/mês
  - 100 GB bandwidth
  - Domínios `.vercel.app` ilimitados
  
- Perfeito para este projeto! 🎉

## Estrutura Final

```
┌─────────────────┐
│   Vercel        │
│   (Frontend)    │◄─── Visualização, interface web
│   HTTPS         │
└────────┬────────┘
         │
         │ (API calls via ngrok)
         ▼
┌─────────────────┐
│   Bot Local     │◄─── Gerencia calendario.ics
│   + Server      │
│   Port: 3000    │
│   Port: 3001    │
│                 │
│   WhatsApp ────►│───► Envia mensagens
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   ngrok         │
│   Túnel HTTP    │◄─── Expõe bot para internet
└─────────────────┘
```

## Próximos Passos

1. ✅ Arquivos criados (vercel.json, .vercelignore)
2. 🚀 Faça commit e push para GitHub
3. 🌐 Acesse vercel.com e importe o repositório
4. 🎉 Deploy automático em ~2 minutos!
