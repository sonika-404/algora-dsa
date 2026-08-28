const form = document.getElementById('chatForm');
const input = document.getElementById('userInput');
const chatBox = document.getElementById('chatBox');
const sendBtn = document.getElementById('sendBtn');
const clearChatBtn = document.getElementById('clearChatBtn');

input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 144) + 'px';
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.dispatchEvent(new Event('submit'));
  }
});

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    input.value = chip.textContent.trim();
    input.focus();
    form.dispatchEvent(new Event('submit'));
  });
});

clearChatBtn.addEventListener('click', () => {
  chatBox.innerHTML = `
    <div class="flex items-start gap-3.5">
      <div class="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0 mt-0.5 shadow-sm">
        AI
      </div>
      <div class="flex-1 bg-[#131b2e] border border-slate-800/90 rounded-2xl rounded-tl-sm p-5 text-slate-200 text-sm leading-relaxed shadow-sm">
        <p class="font-medium text-slate-100 mb-1">Chat history cleared.</p>
        <p class="text-slate-400">Ask any new DSA question or choose a starter prompt below.</p>
      </div>
    </div>
  `;
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  appendUserMessage(text);
  input.value = '';
  input.style.height = 'auto';

  const aiBubble = appendAIMessage('', true);
  sendBtn.disabled = true;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text })
    });

    const data = await res.json();

    if (res.ok) {
      renderAIResponse(aiBubble, data.reply);
    } else {
      aiBubble.innerHTML = `<span class="text-red-400 font-medium">Error: ${escapeHtml(data.error || 'Request failed')}</span>`;
    }
  } catch (err) {
    aiBubble.innerHTML = `<span class="text-red-400 font-medium">Connection error. Please verify your server is running.</span>`;
  } finally {
    sendBtn.disabled = false;
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

function appendUserMessage(text) {
  const row = document.createElement('div');
  row.className = 'flex items-start justify-end gap-3.5';

  row.innerHTML = `
    <div class="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap">
      ${escapeHtml(text)}
    </div>
    <div class="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-semibold shrink-0 mt-0.5 shadow-sm">
      You
    </div>
  `;

  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function appendAIMessage(initialText, isLoading = false) {
  const row = document.createElement('div');
  row.className = 'flex items-start gap-3.5';

  const avatar = document.createElement('div');
  avatar.className = 'w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0 mt-0.5 shadow-sm';
  avatar.textContent = 'AI';

  const content = document.createElement('div');
  content.className = 'flex-1 bg-[#131b2e] border border-slate-800/90 rounded-2xl rounded-tl-sm p-5 text-slate-200 text-sm leading-relaxed shadow-sm prose-dsa break-words';

  if (isLoading) {
    content.innerHTML = `
      <div class="flex items-center gap-2 text-slate-400 text-xs py-1 font-medium">
        <span class="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
        <span class="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse [animation-delay:0.2s]"></span>
        <span class="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse [animation-delay:0.4s]"></span>
        <span class="ml-1 text-slate-400">Thinking through algorithm logic...</span>
      </div>
    `;
  } else {
    content.textContent = initialText;
  }

  row.appendChild(avatar);
  row.appendChild(content);
  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;

  return content;
}

function renderAIResponse(container, markdownText) {
  container.innerHTML = marked.parse(markdownText);

  if (window.renderMathInElement) {
    renderMathInElement(container, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false
    });
  }

  container.querySelectorAll('pre').forEach((pre) => {
    const code = pre.querySelector('code');
    const codeText = code ? code.innerText : pre.innerText;
    
    let lang = 'code';
    if (code && code.className) {
      const match = code.className.match(/language-(\w+)/);
      if (match) lang = match[1];
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'rounded-xl overflow-hidden border border-slate-800 my-3 bg-[#060a12]';

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-4 py-1.5 bg-[#0e1626] border-b border-slate-800/80 text-xs text-slate-400 font-mono';
    header.innerHTML = `
      <span class="font-medium text-slate-300 uppercase tracking-wider text-[11px]">${lang}</span>
      <button class="copy-btn hover:text-white transition-colors flex items-center gap-1 text-[11px]">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
        Copy
      </button>
    `;

    const copyBtn = header.querySelector('.copy-btn');
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(codeText);
      copyBtn.innerHTML = `<span class="text-emerald-400">Copied!</span>`;
      setTimeout(() => {
        copyBtn.innerHTML = `
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
          Copy
        `;
      }, 2000);
    });

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    pre.className = '!bg-transparent !p-4 !m-0 overflow-x-auto text-xs';
    wrapper.appendChild(pre);
  });

  if (window.Prism) {
    Prism.highlightAllUnder(container);
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}