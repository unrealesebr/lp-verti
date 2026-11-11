/* ============================================================
   VERTI — interações da landing page

   Número que recebe as solicitações. Não é exibido na página:
   entra apenas no link do WhatsApp montado no envio do formulário.
   Formato: código do país + DDD + número, só dígitos.
   ============================================================ */
const WHATSAPP = '5562983019400';

/* marca que o JS está ativo — libera as animações de entrada */
document.documentElement.classList.add('has-js');

/* ---------- vídeo do hero ---------- */
/* Há duas versões: 16:9 para o desktop e 9:16 para o celular, onde a
   horizontal mostraria só uma faixa central. A fonte entra por JS para
   que apenas a versão da tela em uso seja baixada.
   Quem pede menos movimento no sistema fica só com o poster. */
const heroVideo = document.getElementById('hero-video');
const ehMobile = window.matchMedia('(max-width: 859px)').matches;
const querMovimento = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (ehMobile) heroVideo.poster = heroVideo.dataset.posterMobile;

if (querMovimento) {
  const fonte = document.createElement('source');
  fonte.src = ehMobile ? heroVideo.dataset.srcMobile : heroVideo.dataset.src;
  fonte.type = 'video/mp4';
  heroVideo.appendChild(fonte);
  heroVideo.load();
  /* o atributo autoplay não volta a disparar depois de um load() com a
     fonte injetada — sem este play() o vídeo trava no primeiro frame.
     Se o navegador recusar, fica o poster, que é o mesmo frame. */
  heroVideo.play().catch(() => {});

  /* a aba pode abrir em segundo plano, e aí o navegador recusa o autoplay;
     quando ela vier para a frente, o vídeo começa */
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && heroVideo.paused) {
      heroVideo.play().catch(() => {});
    }
  });
} else {
  heroVideo.removeAttribute('autoplay');
}

/* ---------- menu mobile ---------- */
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');

burger.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  burger.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
});

nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  });
});

/* ---------- carrossel de obras ---------- */
const rail = document.getElementById('obras-rail');
const prev = document.getElementById('obras-prev');
const next = document.getElementById('obras-next');

const step = () => {
  const card = rail.querySelector('.obra');
  return card ? card.offsetWidth + 16 : 320;
};

const syncNav = () => {
  const max = rail.scrollWidth - rail.clientWidth - 4;
  prev.disabled = rail.scrollLeft <= 4;
  next.disabled = rail.scrollLeft >= max;
};

prev.addEventListener('click', () => rail.scrollBy({ left: -step() }));
next.addEventListener('click', () => rail.scrollBy({ left: step() }));
rail.addEventListener('scroll', syncNav, { passive: true });
window.addEventListener('resize', syncNav);
syncNav();

/* ---------- reveal no scroll ---------- */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (!entry.isIntersecting) return;
    setTimeout(() => entry.target.classList.add('is-in'), i * 70);
    observer.unobserve(entry.target);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* ---------- máscara de telefone ---------- */
const tel = document.getElementById('whatsapp');

tel.addEventListener('input', () => {
  const d = tel.value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) tel.value = d;
  else if (d.length <= 6) tel.value = `(${d.slice(0, 2)}) ${d.slice(2)}`;
  else if (d.length <= 10) tel.value = `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  else tel.value = `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
});

/* ---------- barra de atalho do hero ---------- */
const quickbar = document.getElementById('quickbar');
const campoServico = document.getElementById('servico');
const campoDescricao = document.getElementById('descricao');

quickbar.addEventListener('submit', (e) => {
  e.preventDefault();

  const servico = document.getElementById('quick-servico').value;
  const tipo = document.getElementById('quick-tipo').value;
  const prazo = document.getElementById('quick-prazo').value;

  campoServico.value = servico;
  campoDescricao.value = `Imóvel ${tipo.toLowerCase()} · Prazo: ${prazo.toLowerCase()}. `;
  /* mexer no .value por código não dispara evento: a lista customizada
     precisa do aviso para atualizar o que está escrito no gatilho */
  campoServico.dispatchEvent(new Event('change', { bubbles: true }));

  document.getElementById('orcamento').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => document.getElementById('nome').focus({ preventScroll: true }), 650);
});

/* ---------- atalho "seja um parceiro" ---------- */
document.getElementById('btn-parceiro').addEventListener('click', () => {
  campoServico.value = 'Quero ser parceiro da VERTI';
  campoServico.dispatchEvent(new Event('change', { bubbles: true }));
  document.getElementById('orcamento').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => document.getElementById('nome').focus({ preventScroll: true }), 650);
});

/* ---------- envio do formulário ---------- */
const form = document.getElementById('form-orcamento');
const feedback = document.getElementById('form-feedback');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const campos = [
    document.getElementById('nome'),
    tel,
    campoServico,
    campoDescricao
  ];

  let valido = true;
  campos.forEach(campo => {
    const vazio = !campo.value.trim();
    campo.closest('.field').classList.toggle('has-error', vazio);
    if (vazio) valido = false;
  });

  const email = document.getElementById('email');
  const emailInvalido = email.value.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value);
  email.closest('.field').classList.toggle('has-error', emailInvalido);
  if (emailInvalido) valido = false;

  if (!valido) {
    feedback.textContent = 'Confira os campos destacados antes de enviar.';
    feedback.classList.add('is-error');
    /* o select nativo está fora da vista: o foco vai para o gatilho */
    form.querySelector('.has-error input, .has-error .sel-gatilho, .has-error textarea')?.focus();
    return;
  }

  feedback.classList.remove('is-error');
  feedback.textContent = 'Tudo certo — abrindo o WhatsApp da VERTI...';

  const linhas = [
    'Olá, VERTI! Quero solicitar um orçamento.',
    '',
    `Nome: ${document.getElementById('nome').value.trim()}`,
    `WhatsApp: ${tel.value.trim()}`,
    email.value.trim() ? `E-mail: ${email.value.trim()}` : null,
    `Serviço: ${campoServico.value}`,
    '',
    'Sobre o projeto:',
    campoDescricao.value.trim()
  ].filter(Boolean);

  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(linhas.join('\n'))}`;
  window.open(url, '_blank', 'noopener');
});

/* limpa o erro assim que o usuário corrige */
form.querySelectorAll('input, select, textarea').forEach(campo => {
  campo.addEventListener('input', () => campo.closest('.field').classList.remove('has-error'));
});

/* ---------- smooth scroll do botão reveal ---------- */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-reveal');
  if (btn) {
    const href = btn.getAttribute('href') || btn.dataset.link;
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          const nameField = document.getElementById('nome');
          if (nameField) nameField.focus({ preventScroll: true });
        }, 650);
      }
    }
  }
});

/* ---------- ano do rodapé ---------- */
document.getElementById('ano').textContent = new Date().getFullYear();

/* ---------- efeito typewriter no hero ---------- */
const typewriterEl = document.getElementById('typewriter');
if (typewriterEl) {
  const words = ['complicação', 'preocupação', 'improviso'];
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  const typeSpeed = 80;
  const deleteSpeed = 50;
  const pauseTime = 2000;

  function type() {
    const currentWord = words[wordIndex];

    if (!isDeleting) {
      if (charIndex < currentWord.length) {
        typewriterEl.textContent += currentWord.charAt(charIndex);
        charIndex++;
        setTimeout(type, typeSpeed);
      } else {
        isDeleting = true;
        setTimeout(type, pauseTime);
      }
    } else {
      if (charIndex > 0) {
        typewriterEl.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
        setTimeout(type, deleteSpeed);
      } else {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        setTimeout(type, typeSpeed);
      }
    }
  }

  type();
}

