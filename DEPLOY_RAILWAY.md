# 🚂 Guia de Deploy no Railway

## Passo 1: Preparar o Repositório
✅ **CONCLUÍDO** - Código já está no GitHub em: https://github.com/seu-dev-br/bot_ava_whatsapp

## Passo 2: Criar Projeto no Railway

1. Acesse: https://railway.app/
2. Faça login com sua conta GitHub
3. Clique em **"New Project"**
4. Selecione **"Deploy from GitHub repo"**
5. Escolha o repositório: `seu-dev-br/bot_ava_whatsapp`
6. Railway iniciará o deploy automaticamente

## Passo 3: Verificar Deploy

Após o deploy:
- Railway fornecerá uma URL pública (ex: `https://bot-ava-whatsapp-production.up.railway.app`)
- Acesse a URL para ver o frontend funcionando
- O servidor estará rodando na porta que o Railway definir (automático)

## Passo 4: Configurar Domínio (Opcional)

No painel do Railway:
1. Vá para **Settings** → **Domains**
2. Clique em **Generate Domain** para obter URL pública
3. Ou configure um domínio customizado

## ⚠️ Importante

### O que SERÁ hospedado:
✅ Frontend web (`server.js`)
✅ API REST para gerenciar calendário
✅ Interface de disciplinas

### O que NÃO será hospedado:
❌ Bot WhatsApp (`whatsapp-web.js`) - precisa rodar localmente

**Motivo**: O bot WhatsApp precisa de interface gráfica para escanear o QR Code, o que não é possível em servidores cloud sem display.

## Configuração do Bot Local para API Remota

Quando o frontend estiver no Railway, você pode atualizar a URL da API no bot local:

1. Abra `whatsapp-web.js`
2. Localize a linha com `localhost:3001`
3. Substitua pela URL do Railway (se necessário)

## Troubleshooting

### Erro de Build
- Verifique se `package.json` tem `engines.node` configurado
- Railway precisa de Node.js 18+

### Erro 503 Service Unavailable
- Aguarde alguns minutos, o Railway está fazendo deploy
- Verifique logs no painel do Railway

### Frontend não carrega
- Verifique se `PORT` está usando `process.env.PORT`
- Railway define a porta automaticamente

## Custo

Railway oferece:
- **$5 de crédito grátis por mês** no plano gratuito
- Ideal para projetos pequenos como este
- Monitore uso no painel

## Próximos Passos

1. ✅ Push código para GitHub (FEITO)
2. 🚀 Deploy no Railway (SIGA OS PASSOS ACIMA)
3. 🌐 Acesse URL pública do frontend
4. 🤖 Continue rodando bot localmente com `npm start`
