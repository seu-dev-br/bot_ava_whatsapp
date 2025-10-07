const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const ICAL = require('ical.js');

// Configurações mínimas
const CONFIG = {
  groupName: 'Teste_Grupo',
  icsFilePath: './calendario.ics',
  checkInterval: 60 * 60 * 1000, // 1 hora
  anticipationHours: 24
};

// Inicializar cliente com autenticação local
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: false }
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
  if (msg.body === '!recarregar' && msg.fromMe) {
    notifiedEvents.clear();
    await checkUpcomingEvents();
    msg.reply('Arquivo .ics recarregado.');
  }
  if (msg.body === '!status' && msg.fromMe) {
    const events = readICSFile();
    msg.reply(`Total eventos: ${events.length}\nNotificados: ${notifiedEvents.size}`);
  }
});

client.initialize();
console.log('Iniciando bot...');