/* ============================================================
   VERTI — lista de seleção customizada

   O popup de um <select> nativo é desenhado pelo sistema operacional:
   nenhum CSS da página alcança ele. Para dar acabamento, o select
   continua no DOM como fonte da verdade (o main.js lê e escreve .value
   nele) e ganha por cima um gatilho + uma lista que a página desenha.

   A lista é pendurada no <body> com position:fixed porque o .hero-stage
   tem overflow:hidden e cortaria qualquer coisa posicionada dentro dele.

   Se este arquivo falhar, o select nativo volta a aparecer e o formulário
   segue funcionando — por isso ele mora fora do main.js.
   ============================================================ */
(() => {
  'use strict';

  const selects = document.querySelectorAll('.quickbar select, #form-orcamento select');
  if (!selects.length) return;

  const SETA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

  let aberta = null;

  const rotulo = (select) => {
    const proprio = select.getAttribute('aria-label');
    if (proprio) return proprio;
    const tag = select.id && document.querySelector(`label[for="${select.id}"]`);
    return tag ? tag.textContent.trim() : '';
  };

  const posicionar = (ctx) => {
    const r = ctx.gatilho.getBoundingClientRect();
    const altura = ctx.lista.offsetHeight;
    const cabeAbaixo = innerHeight - r.bottom > altura + 14;
    ctx.lista.style.minWidth = `${r.width}px`;
    ctx.lista.style.left = `${Math.min(r.left, innerWidth - ctx.lista.offsetWidth - 12)}px`;
    ctx.lista.style.top = cabeAbaixo ? `${r.bottom + 6}px` : `${Math.max(12, r.top - altura - 6)}px`;
  };

  const fechar = (devolverFoco) => {
    if (!aberta) return;
    const ctx = aberta;
    aberta = null;
    ctx.raiz.classList.remove('is-open');
    ctx.gatilho.setAttribute('aria-expanded', 'false');
    ctx.lista.remove();
    if (devolverFoco) ctx.gatilho.focus();
  };

  const abrir = (ctx) => {
    fechar(false);
    aberta = ctx;
    document.body.appendChild(ctx.lista);
    ctx.raiz.classList.add('is-open');
    ctx.gatilho.setAttribute('aria-expanded', 'true');
    posicionar(ctx);
    const marcada = ctx.lista.querySelector('[aria-selected="true"]') || ctx.lista.firstElementChild;
    marcada?.focus();
  };

  selects.forEach((select, i) => {
    const raiz = document.createElement('div');
    raiz.className = 'sel';
    select.parentNode.insertBefore(raiz, select);
    raiz.appendChild(select);
    select.classList.add('sel-nativo');
    select.setAttribute('tabindex', '-1');
    select.setAttribute('aria-hidden', 'true');

    const gatilho = document.createElement('button');
    gatilho.type = 'button';
    gatilho.className = 'sel-gatilho';
    gatilho.setAttribute('aria-haspopup', 'listbox');
    gatilho.setAttribute('aria-expanded', 'false');
    gatilho.setAttribute('aria-controls', `sel-lista-${i}`);
    const texto = rotulo(select);
    if (texto) gatilho.setAttribute('aria-label', texto);
    gatilho.innerHTML = `<span class="sel-valor"></span><span class="sel-seta" aria-hidden="true">${SETA}</span>`;
    raiz.appendChild(gatilho);

    const lista = document.createElement('ul');
    lista.className = 'sel-lista';
    lista.id = `sel-lista-${i}`;
    lista.setAttribute('role', 'listbox');
    if (texto) lista.setAttribute('aria-label', texto);

    const itens = [...select.options].map((opt) => {
      const li = document.createElement('li');
      li.className = 'sel-opt';
      li.setAttribute('role', 'option');
      li.setAttribute('tabindex', '-1');
      li.dataset.valor = opt.value;
      li.textContent = opt.textContent;
      lista.appendChild(li);
      return li;
    });

    const ctx = { raiz, gatilho, lista };
    const valorAtual = () => select.value;

    /* espelha o estado do select nativo no gatilho e na lista */
    const sincronizar = () => {
      const v = valorAtual();
      const opt = select.selectedOptions[0];
      gatilho.querySelector('.sel-valor').textContent = opt ? opt.textContent : '';
      gatilho.classList.toggle('is-vazio', v === '');
      itens.forEach((li) => li.setAttribute('aria-selected', String(li.dataset.valor === v)));
    };

    const escolher = (li) => {
      select.value = li.dataset.valor;
      sincronizar();
      /* o main.js escuta input/change para limpar o destaque de erro */
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
      fechar(true);
    };

    const mover = (de, passo) => {
      const idx = itens.indexOf(de);
      const alvo = itens[Math.max(0, Math.min(itens.length - 1, idx + passo))];
      alvo?.focus();
    };

    gatilho.addEventListener('click', () => {
      if (aberta && aberta.raiz === raiz) fechar(true); else abrir(ctx);
    });

    gatilho.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        abrir(ctx);
      }
    });

    lista.addEventListener('click', (e) => {
      const li = e.target.closest('.sel-opt');
      if (li) escolher(li);
    });

    lista.addEventListener('keydown', (e) => {
      const li = e.target.closest('.sel-opt');
      if (!li) return;
      const teclas = {
        ArrowDown: () => mover(li, 1),
        ArrowUp: () => mover(li, -1),
        Home: () => itens[0].focus(),
        End: () => itens[itens.length - 1].focus(),
        Enter: () => escolher(li),
        ' ': () => escolher(li),
        Escape: () => fechar(true),
        Tab: () => fechar(false)
      };
      const acao = teclas[e.key];
      if (!acao) return;
      if (e.key !== 'Tab') e.preventDefault();
      acao();
    });

    /* .value mexido por fora (o main.js preenche o formulário a partir
       da barra do hero) não dispara evento sozinho: o main.js avisa */
    select.addEventListener('change', () => { if (aberta?.raiz !== raiz) sincronizar(); });

    sincronizar();
  });

  document.addEventListener('pointerdown', (e) => {
    if (aberta && !aberta.lista.contains(e.target) && !aberta.raiz.contains(e.target)) fechar(false);
  });
  addEventListener('scroll', () => { if (aberta) posicionar(aberta); }, true);
  addEventListener('resize', () => fechar(false));
})();
