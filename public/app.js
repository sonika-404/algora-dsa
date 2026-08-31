const form = document.getElementById('chatForm');
const input = document.getElementById('userInput');
const chatBox = document.getElementById('chatBox');
const sendBtn = document.getElementById('sendBtn');
const clearChatBtn = document.getElementById('clearChatBtn');

function adjustHeight() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 120) + 'px';
}
input.addEventListener('input', adjustHeight);

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) {
    e.preventDefault();
    form.dispatchEvent(new Event('submit'));
  }
});

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    input.value = chip.textContent.trim();
    adjustHeight();
    input.focus();
    form.dispatchEvent(new Event('submit'));
  });
});

clearChatBtn.addEventListener('click', () => {
  chatBox.innerHTML = `
    <div class="flex items-start gap-2.5 md:gap-3.5">
      <div class="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0 mt-0.5 shadow-sm">
        AI
      </div>
      <div class="flex-1 bg-[#131b2e] border border-slate-800/90 rounded-2xl rounded-tl-sm p-3.5 md:p-5 text-slate-200 text-xs md:text-sm leading-relaxed shadow-sm">
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

    if (!res.ok) throw new Error('Failed to connect');

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullResponse = '';
    let isFirstChunk = true;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const rawData = line.slice(6).trim();
          if (rawData === '[DONE]') break;

          try {
            const parsed = JSON.parse(rawData);
            if (parsed.chunk) {
              if (isFirstChunk) {
                aiBubble.innerHTML = '';
                isFirstChunk = false;
              }
              fullResponse += parsed.chunk;
              aiBubble.innerHTML = marked.parse(fullResponse);
              scrollToBottom();
            } else if (parsed.error) {
              aiBubble.innerHTML = `<span class="text-red-400 font-medium">${parsed.error}</span>`;
            }
          } catch (_) {}
        }
      }
    }

    renderAIResponse(aiBubble, fullResponse);

  } catch (err) {
    aiBubble.innerHTML = `<span class="text-red-400 font-medium">Server connection error. Please verify your backend is running.</span>`;
  } finally {
    sendBtn.disabled = false;
    scrollToBottom();
  }
});

function scrollToBottom() {
  chatBox.scrollTo({
    top: chatBox.scrollHeight,
    behavior: 'smooth'
  });
}

function appendUserMessage(text) {
  const row = document.createElement('div');
  row.className = 'flex items-start justify-end gap-2.5 md:gap-3.5';

  row.innerHTML = `
    <div class="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-3.5 md:px-4 py-2.5 md:py-3 max-w-[85%] md:max-w-[80%] text-xs md:text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap">
      ${escapeHtml(text)}
    </div>
    <div class="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-[11px] md:text-xs font-semibold shrink-0 mt-0.5 shadow-sm">
      You
    </div>
  `;

  chatBox.appendChild(row);
  scrollToBottom();
}

function appendAIMessage(initialText, isLoading = false) {
  const row = document.createElement('div');
  row.className = 'flex items-start gap-2.5 md:gap-3.5';

  const avatar = document.createElement('div');
  avatar.className = 'w-7 h-7 md:w-8 md:h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0 mt-0.5 shadow-sm';
  avatar.textContent = 'AI';

  const content = document.createElement('div');
  content.className = 'flex-1 bg-[#131b2e] border border-slate-800/90 rounded-2xl rounded-tl-sm p-3.5 md:p-5 text-slate-200 text-xs md:text-sm leading-relaxed shadow-sm prose-dsa break-words overflow-hidden';

  if (isLoading) {
    content.innerHTML = `
      <div class="flex items-center gap-2 text-slate-400 text-xs py-1 font-medium">
        <span class="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
        <span class="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse [animation-delay:0.2s]"></span>
        <span class="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse [animation-delay:0.4s]"></span>
        <span class="ml-1 text-slate-400">Analyzing DSA problem...</span>
      </div>
    `;
  } else {
    content.textContent = initialText;
  }

  row.appendChild(avatar);
  row.appendChild(content);
  chatBox.appendChild(row);
  scrollToBottom();

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
    wrapper.className = 'rounded-xl overflow-hidden border border-slate-800 my-2.5 bg-[#060a12] w-full max-w-full';

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-3.5 py-1.5 bg-[#0e1626] border-b border-slate-800/80 text-[11px] text-slate-400 font-mono';
    header.innerHTML = `
      <span class="font-medium text-slate-300 uppercase tracking-wider">${lang}</span>
      <button class="copy-btn hover:text-white transition-colors flex items-center gap-1">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
        Copy
      </button>
    `;

    const copyBtn = header.querySelector('.copy-btn');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codeText);
        copyBtn.innerHTML = `<span class="text-emerald-400">Copied!</span>`;
      } catch (err) {
        copyBtn.innerText = 'Copied!';
      }
      setTimeout(() => {
        copyBtn.innerHTML = `
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
          Copy
        `;
      }, 2000);
    });

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    pre.className = '!bg-transparent !p-3.5 !m-0 overflow-x-auto text-xs';
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