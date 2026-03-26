export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/javascript");

  const { agencyId, agencyName, agentName, branchId } = req.query;

  const widgetCode = `
(function() {
  const CONFIG = {
    agencyId: "${agencyId || ''}",
    agencyName: "${agencyName || 'notre agence'}",
    agentName: "${agentName || 'Sofia'}",
    branchId: "${branchId || ''}",
    apiUrl: "https://" + location.host.replace(location.host, '${process.env.VERCEL_URL || 'leadzia-backend.vercel.app'}')
  };

  // Styles
  const style = document.createElement('style');
  style.textContent = \`
    #lz-bubble {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 58px; height: 58px; border-radius: 50%;
      background: linear-gradient(135deg, #b8935a, #8b6534);
      box-shadow: 0 4px 20px rgba(184,147,90,.5);
      border: none; cursor: pointer; font-size: 24px;
      display: flex; align-items: center; justify-content: center;
      transition: all .3s; animation: lzPop .6s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes lzPop { from{opacity:0;transform:scale(0)} to{opacity:1;transform:scale(1)} }
    #lz-bubble:hover { transform: scale(1.1); }
    #lz-label {
      position: fixed; bottom: 30px; right: 90px; z-index: 9999;
      background: #fff; border: 1px solid rgba(0,0,0,.12);
      border-radius: 20px; padding: 8px 16px;
      font-family: sans-serif; font-size: 13px; font-weight: 500;
      box-shadow: 0 4px 16px rgba(0,0,0,.1); cursor: pointer;
      white-space: nowrap; animation: lzFadeIn .4s 1s ease both;
    }
    @keyframes lzFadeIn { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:none} }
    #lz-window {
      position: fixed; bottom: 90px; right: 24px; z-index: 9998;
      width: 360px; height: 560px; border-radius: 18px;
      background: #fff; box-shadow: 0 20px 60px rgba(0,0,0,.18);
      display: flex; flex-direction: column; overflow: hidden;
      transform-origin: bottom right;
      transform: scale(0); opacity: 0; pointer-events: none;
      transition: all .3s cubic-bezier(.34,1.2,.64,1);
    }
    #lz-window.lz-open { transform: scale(1); opacity: 1; pointer-events: all; }
    #lz-header {
      padding: 14px 16px; background: linear-gradient(135deg, #1a1612, #2a2420);
      display: flex; align-items: center; gap: 10px; flex-shrink: 0;
    }
    #lz-av {
      width: 38px; height: 38px; border-radius: 50%;
      background: linear-gradient(135deg, #b8935a, #8b6534);
      display: flex; align-items: center; justify-content: center; font-size: 18px;
    }
    #lz-name { font-size: 15px; font-weight: 600; color: #f5f0e8; }
    #lz-status { font-size: 11px; color: rgba(245,240,232,.5); display: flex; align-items: center; gap: 4px; }
    .lz-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; }
    #lz-close {
      margin-left: auto; background: rgba(255,255,255,.1); border: none;
      color: #f5f0e8; width: 28px; height: 28px; border-radius: 50%;
      cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;
    }
    #lz-msgs {
      flex: 1; overflow-y: auto; padding: 14px;
      display: flex; flex-direction: column; gap: 8px; background: #fafafa;
    }
    .lz-msg { display: flex; gap: 7px; animation: lzMsg .25s ease; }
    @keyframes lzMsg { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
    .lz-msg.lz-user { flex-direction: row-reverse; }
    .lz-msg-av {
      width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #b8935a, #8b6534);
      display: flex; align-items: center; justify-content: center; font-size: 13px; margin-top: 2px;
    }
    .lz-msg-av.lz-uav { background: #ede7d9; }
    .lz-bubble {
      max-width: 80%; padding: 9px 13px; border-radius: 14px;
      font-family: sans-serif; font-size: 13px; line-height: 1.55;
    }
    .lz-msg.lz-bot .lz-bubble {
      background: #fff; color: #1a1612; border: 1px solid rgba(0,0,0,.08);
      border-bottom-left-radius: 3px; box-shadow: 0 1px 4px rgba(0,0,0,.05);
    }
    .lz-msg.lz-user .lz-bubble {
      background: linear-gradient(135deg, #1a1612, #2a2420);
      color: #f5f0e8; border-bottom-right-radius: 3px;
    }
    .lz-typing {
      display: flex; gap: 7px; align-items: center; opacity: 0; transition: opacity .3s;
    }
    .lz-typing.lz-show { opacity: 1; }
    .lz-typing-dots {
      background: #fff; border: 1px solid rgba(0,0,0,.08);
      border-radius: 14px; border-bottom-left-radius: 3px;
      padding: 9px 13px; display: flex; gap: 4px; align-items: center;
    }
    .lz-typing-dot {
      width: 5px; height: 5px; border-radius: 50%; background: #9e9085;
      animation: lzBounce 1.2s infinite;
    }
    .lz-typing-dot:nth-child(2) { animation-delay: .2s; }
    .lz-typing-dot:nth-child(3) { animation-delay: .4s; }
    @keyframes lzBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }
    #lz-quickreplies {
      display: flex; flex-wrap: wrap; gap: 5px;
      padding: 8px 12px; background: #fafafa;
      border-top: 1px solid rgba(0,0,0,.06); min-height: 44px;
    }
    .lz-qr {
      padding: 5px 12px; border-radius: 16px;
      background: #fff; border: 1px solid rgba(0,0,0,.12);
      font-family: sans-serif; font-size: 12px; cursor: pointer; transition: all .2s;
    }
    .lz-qr:hover { background: rgba(184,147,90,.1); border-color: #b8935a; color: #b8935a; }
    #lz-form {
      padding: 12px 14px; background: #fff;
      border-top: 1px solid rgba(0,0,0,.08); display: none; flex-direction: column; gap: 8px;
    }
    #lz-form.lz-show { display: flex; }
    .lz-form-title { font-family: sans-serif; font-size: 12px; font-weight: 600; color: #1a1612; }
    .lz-form-input {
      background: #f5f0e8; border: 1px solid rgba(0,0,0,.12);
      border-radius: 8px; padding: 8px 12px;
      font-family: sans-serif; font-size: 13px; color: #1a1612; outline: none;
    }
    .lz-form-input:focus { border-color: #b8935a; }
    .lz-form-btn {
      background: linear-gradient(135deg, #1a1612, #2a2420);
      border: none; color: #f5f0e8; padding: 10px;
      border-radius: 8px; font-family: sans-serif; font-size: 13px;
      font-weight: 600; cursor: pointer;
    }
    #lz-inputrow {
      padding: 10px 12px; display: flex; gap: 7px; align-items: center;
      border-top: 1px solid rgba(0,0,0,.08); background: #fff; flex-shrink: 0;
    }
    #lz-input {
      flex: 1; background: #f5f0e8; border: 1px solid rgba(0,0,0,.12);
      border-radius: 18px; padding: 8px 14px;
      font-family: sans-serif; font-size: 13px; color: #1a1612; outline: none;
    }
    #lz-input:focus { border-color: #b8935a; }
    #lz-send {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #1a1612, #2a2420);
      border: none; cursor: pointer; font-size: 15px;
      display: flex; align-items: center; justify-content: center; color: #f5f0e8;
    }
    #lz-branding {
      text-align: center; padding: 5px;
      font-family: sans-serif; font-size: 10px; color: #9e9085;
      background: #fff; border-top: 1px solid rgba(0,0,0,.06);
    }
    #lz-notif {
      position: absolute; top: -2px; right: -2px;
      width: 17px; height: 17px; background: #ef4444;
      border-radius: 50%; border: 2px solid #fff;
      font-family: sans-serif; font-size: 10px; font-weight: 700; color: #fff;
      display: flex; align-items: center; justify-content: center;
    }
  \`;
  document.head.appendChild(style);

  // HTML
  const container = document.createElement('div');
  container.innerHTML = \`
    <div id="lz-label" onclick="lzToggle()">👋 \${CONFIG.agentName} peut vous aider</div>
    <button id="lz-bubble" onclick="lzToggle()" style="position:relative">
      💬<div id="lz-notif">1</div>
    </button>
    <div id="lz-window">
      <div id="lz-header">
        <div id="lz-av">🏠</div>
        <div>
          <div id="lz-name">\${CONFIG.agentName}</div>
          <div id="lz-status"><div class="lz-dot"></div> Conseillère IA · \${CONFIG.agencyName}</div>
        </div>
        <button id="lz-close" onclick="lzToggle()">×</button>
      </div>
      <div id="lz-msgs">
        <div class="lz-typing" id="lz-typing">
          <div class="lz-msg-av">🏠</div>
          <div class="lz-typing-dots">
            <div class="lz-typing-dot"></div>
            <div class="lz-typing-dot"></div>
            <div class="lz-typing-dot"></div>
          </div>
        </div>
      </div>
      <div id="lz-quickreplies"></div>
      <div id="lz-form">
        <div class="lz-form-title">📋 Vos coordonnées pour être rappelé(e)</div>
        <input class="lz-form-input" id="lz-prenom" placeholder="Votre Nom et Prénom *">
        <input class="lz-form-input" id="lz-email" placeholder="Votre email *" type="email">
        <input class="lz-form-input" id="lz-tel" placeholder="Votre téléphone">
        <button class="lz-form-btn" onclick="lzSubmitLead()">✦ Être rappelé(e) par un conseiller →</button>
      </div>
      <div id="lz-inputrow">
        <input id="lz-input" placeholder="Répondez ici..." onkeydown="if(event.key==='Enter')lzSend()">
        <button id="lz-send" onclick="lzSend()">→</button>
      </div>
      <div id="lz-branding">Propulsé par <strong style="color:#b8935a">Leadzia</strong></div>
    </div>
  \`;
  document.body.appendChild(container);

  // State
  let isOpen = false;
  let messages = [];
  let qualifData = null;
  let isTyping = false;

  window.lzToggle = function() {
    isOpen = !isOpen;
    const win = document.getElementById('lz-window');
    const notif = document.getElementById('lz-notif');
    const label = document.getElementById('lz-label');
    if(isOpen) {
      win.classList.add('lz-open');
      notif.style.display = 'none';
      label.style.display = 'none';
      if(messages.length === 0) setTimeout(lzStart, 400);
    } else {
      win.classList.remove('lz-open');
    }
  };

  function lzStart() {
    showTyping();
    setTimeout(() => { hideTyping(); lzAsk(); }, 1200);
  }

  async function lzAsk(userText) {
    if(userText) {
      messages.push({ role: 'user', content: userText });
    }
    showTyping();
    try {
      const res = await fetch(CONFIG.apiUrl + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, agencyName: CONFIG.agencyName })
      });
      const data = await res.json();
      hideTyping();
      if(data.type === 'qualification') {
        qualifData = data.data;
        addBotMsg(`Merci pour ces informations ! 😊 Pour qu'un de nos conseillers puisse vous recontacter rapidement, pourriez-vous compléter vos coordonnées ci-dessous ?`)
        messages.push({ role: 'assistant', content: 'Qualification terminée.' });
        setTimeout(() => showContactForm(), 800);
      } else {
        addBotMsg(data.text);
        messages.push({ role: 'assistant', content: data.text });
      }
    } catch(e) {
      hideTyping();
      addBotMsg("Désolée, une erreur est survenue. Réessayez dans un instant.");
    }
  }

  window.lzSend = function() {
    const input = document.getElementById('lz-input');
    const text = input.value.trim();
    if(!text || isTyping) return;
    input.value = '';
    addUserMsg(text);
    setQuickReplies([]);
    lzAsk(text);
  };

  function showContactForm() {
    document.getElementById('lz-inputrow').style.display = 'none';
    document.getElementById('lz-quickreplies').style.display = 'none';
    document.getElementById('lz-form').classList.add('lz-show');
    scrollBottom();
  }

  window.lzSubmitLead = async function() {
    const prenom = document.getElementById('lz-prenom').value.trim();
    const email = document.getElementById('lz-email').value.trim();
    const tel = document.getElementById('lz-tel').value.trim();
    if(!prenom || !email) { alert('Prénom et email obligatoires'); return; }
    try {
      await fetch(CONFIG.apiUrl + '/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId: CONFIG.agencyId,
          branchId: CONFIG.branchId || null,
          prenom, email, telephone: tel,
          conversation: messages,
          ...(qualifData || {})
        })
      });
      document.getElementById('lz-form').classList.remove('lz-show');
      addBotMsg(\`Merci \${prenom} ! 🎉 Un conseiller de \${CONFIG.agencyName} vous contactera très prochainement. Belle journée !\`);
      scrollBottom();
    } catch(e) {
      alert('Erreur lors de l envoi. Réessayez.');
    }
  };

  function addBotMsg(text) {
    const msgs = document.getElementById('lz-msgs');
    const div = document.createElement('div');
    div.className = 'lz-msg lz-bot';
    div.innerHTML = \`<div class="lz-msg-av">🏠</div><div class="lz-bubble">\${text.replace(/\\n/g,'<br>')}</div>\`;
    msgs.insertBefore(div, document.getElementById('lz-typing'));
    scrollBottom();
  }

  function addUserMsg(text) {
    const msgs = document.getElementById('lz-msgs');
    const div = document.createElement('div');
    div.className = 'lz-msg lz-user';
    div.innerHTML = \`<div class="lz-bubble">\${text}</div><div class="lz-msg-av lz-uav">👤</div>\`;
    msgs.insertBefore(div, document.getElementById('lz-typing'));
    scrollBottom();
  }

  function setQuickReplies(opts) {
    const qr = document.getElementById('lz-quickreplies');
    qr.innerHTML = opts.map(o => \`<button class="lz-qr" onclick="lzSelectOpt('\${o}')">\${o}</button>\`).join('');
  }

  window.lzSelectOpt = function(opt) {
    addUserMsg(opt);
    setQuickReplies([]);
    lzAsk(opt);
  };

  function showTyping() { isTyping = true; document.getElementById('lz-typing').classList.add('lz-show'); scrollBottom(); }
  function hideTyping() { isTyping = false; document.getElementById('lz-typing').classList.remove('lz-show'); }
  function scrollBottom() { const m = document.getElementById('lz-msgs'); setTimeout(() => { m.scrollTop = m.scrollHeight; }, 50); }
})();
  `;

  res.status(200).send(widgetCode);
}
