const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const ICAL = require('ical.js');
const http = require('http');

// Configurações mínimas
const CONFIG = {
  groupName: 'Teste_Grupo',
  icsFilePath: './calendario.ics',
  checkInterval: 60 * 60 * 1000, // 1 hora
  anticipationHours: 720,
  botApiPort: 3001 // Porta para receber notificações do frontend
};

// Detectar Chromium do puppeteer
let execPath;
try {
  execPath = require('puppeteer').executablePath();
} catch (e) {
  execPath = undefined;
}

// Inicializar cliente com autenticação local
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { 
    headless: false, // Modo visível é mais estável no Windows
    executablePath: execPath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  }
});

let notifiedEvents = new Set();

client.on('qr', qr => {
  console.log('QR gerado. Escaneie com seu WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  console.log('✅ Bot conectado. Iniciando verificações...');
  setInterval(checkUpcomingEvents, CONFIG.checkInterval);
  checkUpcomingEvents();
});

function readICSFile() {
  try {
    const icsData = fs.readFileSync(CONFIG.icsFilePath, 'utf8');
    const jcalData = ICAL.parse(icsData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');
    return vevents.map(vevent => {
      const event = new ICAL.Event(vevent);
      return {
        uid: event.uid,
        summary: event.summary,
        description: event.description || '',
        startDate: event.startDate.toJSDate(),
        endDate: event.endDate.toJSDate(),
        categories: event.component.getFirstPropertyValue('categories') || ''
      };
    });
  } catch (err) {
    console.error('Erro ao ler .ics:', err.message);
    return [];
  }
}

async function checkUpcomingEvents() {
  const events = readICSFile();
  const now = new Date();
  const anticipationMs = CONFIG.anticipationHours * 60 * 60 * 1000;

  for (const event of events) {
    const timeUntil = event.startDate - now;
    if (timeUntil > 0 && timeUntil <= anticipationMs) {
      const key = `${event.uid}_${event.startDate.getTime()}`;
      if (!notifiedEvents.has(key)) {
        await sendReminderToGroup(event, timeUntil);
        notifiedEvents.add(key);
      }
    }
  }
}

async function sendReminderToGroup(event, timeUntil) {
  try {
    const chats = await client.getChats();
    const target = CONFIG.groupName.toLowerCase().trim();
    const group = chats.find(c => c.isGroup && c.name && c.name.toLowerCase().trim() === target);
    if (!group) {
      console.error(`Grupo "${CONFIG.groupName}" não encontrado.`);
      return;
    }

    const message = formatReminderMessage(event, timeUntil);
    await group.sendMessage(message);
    console.log('Lembrete enviado:', event.summary);
  } catch (err) {
    console.error('Erro ao enviar lembrete:', err.message);
  }
}

function extractSubjectCode(categories) {
  if (!categories) return null;
  const match = categories.match(/^([^-]+)/);
  return match ? match[1].trim() : categories.trim();
}

function getActivityType(summary) {
  const s = (summary || '').toLowerCase();
  if (s.includes('avalia')) return '📝 Prova/Avaliação';
  if (s.includes('semin')) return '🎤 Seminário';
  if (s.includes('entrega')) return '📤 Entrega';
  if (s.includes('trabalho')) return '📋 Trabalho';
  return '📌 Atividade';
}

function formatReminderMessage(event, timeUntil) {
  const hours = Math.floor(timeUntil / (60 * 60 * 1000));
  let timeText = hours > 0 ? `${hours} hora(s)` : `${Math.floor(timeUntil / (60 * 1000))} minuto(s)`;
  const dateStr = event.startDate.toLocaleDateString('pt-BR');
  const timeStr = event.startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  let msg = `⚠️ *LEMBRETE* ⚠️\n\n`;
  msg += `*${getActivityType(event.summary)}*\n`;
  msg += `*${event.summary}*\n`;
  msg += `📅 ${dateStr} ${timeStr}\n`;
  msg += `⏰ Prazo: ${timeText}\n`;
  if (event.description) msg += `\n${event.description.substring(0, 300)}`;
  return msg;
}

client.on('message', async msg => {
  const body = (msg.body || '').trim();
  
  // Comandos administrativos (apenas você)
  if (body === '!recarregar' && msg.fromMe) {
    notifiedEvents.clear();
    await checkUpcomingEvents();
    msg.reply('Arquivo .ics recarregado.');
    return;
  }
  if (body === '!status' && msg.fromMe) {
    const events = readICSFile();
    msg.reply(`Total eventos: ${events.length}\nNotificados: ${notifiedEvents.size}`);
    return;
  }

  // Comandos públicos (qualquer pessoa)
  if (body === '!ajuda' || body === '!help') {
    const help = `🤖 *Comandos disponíveis:*\n\n` +
      `!atividades_proximas - Mostra atividades dos próximos 7 dias\n` +
      `!materias - Lista todas as disciplinas\n` +
      `!<materia> - Atividades de uma disciplina (ex: !banco_dados)\n` +
      `!ajuda - Mostra esta mensagem`;
    msg.reply(help);
    return;
  }

  if (body === '!materias') {
    try {
      // Tentar ler subjects.json
      const subjectsData = JSON.parse(fs.readFileSync('./subjects.json', 'utf-8'));
      if (subjectsData.subjects && subjectsData.subjects.length > 0) {
        const list = subjectsData.subjects.map(s => `• ${s.code} - ${s.name}`).join('\n');
        msg.reply(`📚 *Disciplinas disponíveis:*\n\n${list}\n\nUse !<materia> para ver atividades (ex: !bdi)`);
        return;
      }
    } catch (err) {
      // Se falhar, usar método antigo (extrair dos eventos)
    }

    // Fallback: extrair das categorias dos eventos
    const events = readICSFile();
    const subjects = new Set();
    events.forEach(e => {
      if (e.categories) {
        const sub = extractSubjectCode(e.categories);
        if (sub) subjects.add(sub);
      }
    });
    if (subjects.size === 0) {
      msg.reply('Nenhuma disciplina encontrada.');
      return;
    }
    const list = Array.from(subjects).map(s => `• ${s}`).join('\n');
    msg.reply(`📚 *Disciplinas disponíveis:*\n\n${list}\n\nUse !<materia> para ver atividades (ex: !bdi)`);
    return;
  }

  if (body === '!atividades_proximas') {
    const events = readICSFile();
    const now = new Date();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const upcoming = events.filter(e => {
      const diff = e.startDate - now;
      return diff > 0 && diff <= sevenDays;
    }).sort((a, b) => a.startDate - b.startDate);

    if (upcoming.length === 0) {
      msg.reply('Nenhuma atividade nos próximos 7 dias.');
      return;
    }

    let response = `📅 *Atividades próximas (7 dias):*\n\n`;
    upcoming.forEach(e => {
      const dateStr = e.startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const subject = extractSubjectCode(e.categories) || 'Geral';
      response += `• ${dateStr} - *${subject}* - ${e.summary.substring(0, 60)}\n`;
    });
    msg.reply(response);
    return;
  }

  // Comando de matéria específica (ex: !banco_dados, !bdi, etc.)
  if (body.startsWith('!')) {
    const query = body.substring(1).toLowerCase().replace(/_/g, ' ');
    const events = readICSFile();
    const now = new Date();
    const filtered = events.filter(e => {
      if (e.startDate < now) return false; // só futuras
      if (!e.categories) return false;
      const cat = e.categories.toLowerCase();
      return cat.includes(query);
    }).sort((a, b) => a.startDate - b.startDate);

    if (filtered.length === 0) {
      msg.reply(`Nenhuma atividade encontrada para "${query}". Use !materias para ver disciplinas disponíveis.`);
      return;
    }

    let response = `📖 *Atividades de ${query}:*\n\n`;
    filtered.slice(0, 10).forEach(e => {
      const dateStr = e.startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      response += `• ${dateStr} - ${e.summary.substring(0, 70)}\n`;
    });
    if (filtered.length > 10) response += `\n... e mais ${filtered.length - 10} atividades.`;
    msg.reply(response);
    return;
  }
});

// Servidor HTTP para receber notificações do frontend
const botServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/notify') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        console.log('📬 Notificação recebida do frontend:', data.summary);
        
        // Enviar o lembrete imediatamente para o grupo
        await sendManualReminderToGroup(data);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('Erro ao processar notificação:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

botServer.listen(CONFIG.botApiPort, () => {
  console.log(`🔌 Bot API rodando na porta ${CONFIG.botApiPort}`);
});

// Função para enviar lembrete manual imediatamente
async function sendManualReminderToGroup(eventData) {
  try {
    const chats = await client.getChats();
    const target = CONFIG.groupName.toLowerCase().trim();
    const group = chats.find(c => c.isGroup && c.name && c.name.toLowerCase().trim() === target);
    
    if (!group) {
      console.error(`Grupo "${CONFIG.groupName}" não encontrado.`);
      return;
    }

    const startDate = new Date(eventData.startDate);
    const dateStr = startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let msg = `🔔 *NOVO LEMBRETE CRIADO* 🔔\n\n`;
    msg += `*${getActivityType(eventData.summary)}*\n`;
    msg += `*${eventData.summary}*\n\n`;
    msg += `📅 ${dateStr} às ${timeStr}\n`;
    if (eventData.category) msg += `📚 ${eventData.category}\n`;
    if (eventData.description) msg += `\n💡 ${eventData.description}`;

    await group.sendMessage(msg);
    console.log('✅ Lembrete manual enviado:', eventData.summary);
  } catch (err) {
    console.error('❌ Erro ao enviar lembrete manual:', err.message);
  }
}

client.initialize();
console.log('Iniciando bot...');