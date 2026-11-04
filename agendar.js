/* Barbearia Juan Cortes — página do cliente (agendar.html), produção com Firebase.
   Todo texto vindo do banco ou do cliente é escapado (JC.esc) ou posto com textContent. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var html = document.documentElement;

  if (!window.JC || !JC.configOk() || !window.DB) { if (window.JC) JC.pendente(false); return; }

  var U = DB.util, esc = JC.esc;
  var ZAP = '5571991255480';
  var MAPS = 'https://www.google.com/maps/search/?api=1&query=Barbearia+Juan+Cortes+R.+Amazonas+8+Cabula+Salvador';
  var INSTA = 'https://www.instagram.com/juanl_cortes';
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var st = { servicos: [], cfg: null, servico: null, data: null, inicio: null, livres: [], enviando: false };

  /* ================= entrada animada (1x por sessão) ================= */
  function entrada() {
    if (!html.classList.contains('intro')) return;
    try { sessionStorage.setItem('jc_intro', '1'); } catch (e) {}
    var logo = document.querySelector('.hero .logo-wrap');
    var resto = [document.querySelector('.hero-lede'), document.querySelector('.trust'), document.querySelector('.works')];
    if (!logo || !logo.animate) { html.classList.remove('intro'); return; }
    var linha = document.createElement('span');
    linha.className = 'intro-line'; linha.setAttribute('aria-hidden', 'true');
    logo.appendChild(linha);
    var r = logo.getBoundingClientRect();
    var dy = Math.round(window.innerHeight / 2 - (r.top + r.height / 2));
    var E = 'cubic-bezier(.2,.7,.2,1)', M = 'cubic-bezier(.65,0,.25,1)', T = 1600;
    var em = 'translateY(' + dy + 'px)';
    var anims = [];
    [logo].concat(resto).forEach(function (el) { el.classList.remove('rise'); });
    // logo: aparece no centro (0–520 ms), segura, sobe para o topo (760–1260 ms)
    anims.push(logo.animate([
      { opacity: 0, transform: em + ' scale(.9)', easing: E },
      { opacity: 1, transform: em + ' scale(1)', offset: 0.33 },
      { opacity: 1, transform: em + ' scale(1)', offset: 0.475, easing: M },
      { opacity: 1, transform: 'translateY(0) scale(1)', offset: 0.79 },
      { opacity: 1, transform: 'translateY(0) scale(1)' }
    ], { duration: T, fill: 'both' }));
    // filete: desenha do centro para fora (260–720 ms) e some enquanto sobe
    anims.push(linha.animate([
      { clipPath: 'inset(0 50% 0 50%)', opacity: 1, easing: E },
      { clipPath: 'inset(0 50% 0 50%)', opacity: 1, offset: 0.16, easing: E },
      { clipPath: 'inset(0 0% 0 0%)', opacity: 1, offset: 0.45 },
      { clipPath: 'inset(0 0% 0 0%)', opacity: 1, offset: 0.5 },
      { clipPath: 'inset(0 0% 0 0%)', opacity: 0, offset: 0.72 },
      { clipPath: 'inset(0 0% 0 0%)', opacity: 0 }
    ], { duration: T, fill: 'both' }));
    // frase, selos e faixa entram em cascata enquanto o logo assenta
    resto.forEach(function (el, i) {
      if (!el) return;
      anims.push(el.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
        { duration: 470, delay: 960 + i * 85, easing: E, fill: 'both' }));
    });
    var soltou = false;
    function soltarResto() { if (!soltou) { soltou = true; html.classList.remove('intro'); } }
    var tSolta = setTimeout(soltarResto, 1150);   // passos 01–04 começam a subir
    var acabou = false;
    function fim() {
      if (acabou) return; acabou = true;
      clearTimeout(tSolta); soltarResto();
      anims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
      if (linha.parentNode) linha.parentNode.removeChild(linha);
      ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) { window.removeEventListener(ev, pular, true); });
    }
    function pular() { anims.forEach(function (a) { try { a.finish(); } catch (e) {} }); fim(); }
    anims[0].onfinish = fim;
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, pular, { capture: true, passive: true }); });
    window.__jcIntro = { pular: pular, anims: anims };   // usado nos testes
  }
  entrada();

  /* ilustração + legenda por nome do serviço */
  var FOTOS = {
    'corte masculino': { img: 'svc-corte-masculino.jpg', cap: 'Degradê na régua, acabamento na navalha' },
    'corte feminino': { img: 'svc-corte-feminino.jpg', cap: 'Corte e definição respeitando o seu cacho' },
    'barba': { img: 'svc-barba.jpg', cap: 'Toalha quente, navalha e contorno alinhado' },
    'corte + barba': { img: 'svc-corte-barba.jpg', cap: 'O combo completo: cabelo e barba no capricho' },
    'sobrancelha': { img: 'svc-sobrancelha.jpg', cap: 'Desenho limpo na navalha, sem exagero' },
    'freestyle (desenho)': { img: 'svc-freestyle.jpg', cap: 'Risco à mão livre, do jeito que você pedir' },
    'pezinho': { img: 'svc-pezinho.jpg', cap: 'Nuca e laterais alinhadas entre um corte e outro' }
  };
  function foto(s) {
    var k = String(s.nome || '').toLowerCase().trim();
    if (FOTOS[k]) return FOTOS[k];
    for (var n in FOTOS) if (k.indexOf(n.split(' ')[0]) === 0) return FOTOS[n];
    return null;
  }

  function dur(min) { min = Number(min) || 0; return min >= 60 ? (Math.floor(min / 60) + 'h' + (min % 60 ? (' ' + (min % 60) + ' min') : '')) : min + ' min'; }
  function agoraMin() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function diaLongo(iso) {
    var d = U.parseISO(iso), h = U.hoje();
    if (iso === h) return 'hoje, ' + d.getDate() + ' ' + U.MESES3[d.getMonth()];
    if (iso === U.addDias(h, 1)) return 'amanhã, ' + d.getDate() + ' ' + U.MESES3[d.getMonth()];
    return U.DIAS[d.getDay()] + ', ' + d.getDate() + ' ' + U.MESES3[d.getMonth()];
  }
  function diaZap(iso) {
    var d = U.parseISO(iso), h = U.hoje(), dm = pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
    if (iso === h) return 'hoje (' + dm + ')';
    if (iso === U.addDias(h, 1)) return 'amanhã (' + dm + ')';
    return U.DIAS[d.getDay()] + ', ' + dm + ',';
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  var toastT;
  function toast(msg, ms) {
    var t = $('toast'); t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('is-on'); }, ms || 3200);
  }
  function msgHorario(txt) {
    var m = $('msg-horario');
    if (!txt) { m.classList.add('hidden'); m.textContent = ''; return; }
    m.textContent = txt; m.classList.remove('hidden');
  }
  function pop(el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }

  /* ---------- 01 serviços ---------- */
  var revelados = false;
  function fotoHTML(s, anim) {
    var f = foto(s); if (!f) return '';
    return '<div class="foto' + (anim ? ' is-anim' : '') + '">' +
      '<figure class="foto-fig"><img src="img/' + f.img + '" width="720" height="894" alt="Ilustração: ' + esc(s.nome) + '">' +
      '<figcaption class="foto-cap"><span class="foto-cap-t" style="display:block">' + esc(f.cap) + '</span>' +
      '<span class="foto-cap-m"><span class="foto-pill num">' + esc(U.brlCurto(s.preco)) + '</span><span class="foto-pill">' + esc(dur(s.duracao)) + '</span></span></figcaption></figure>' +
      (st.data ? '' : '<button type="button" class="btn btn-ghost btn-block" data-ir="s2">Escolher o dia</button>') +
      '</div>';
  }
  function renderServicos(anim) {
    $('servicos').innerHTML = st.servicos.map(function (s, i) {
      var on = st.servico && st.servico.id === s.id, f = foto(s);
      var th = f ? '<span class="thumb" aria-hidden="true"><img class="t-g" src="img/t/' + f.img + '" alt="" width="52" height="52"' + (i ? ' loading="lazy"' : '') + '>' +
        '<img class="t-c" src="img/t/' + f.img + '" alt="" width="52" height="52"' + (i ? ' loading="lazy"' : '') + '></span>' : '';
      return '<li class="reveal' + (revelados ? ' is-in' : '') + '" style="--i:' + i + '"><button type="button" class="row svc' + (on ? ' is-on' : '') + '" role="radio" aria-checked="' + !!on + '" data-id="' + esc(s.id) + '">' +
        th +
        '<span class="row-main"><span class="row-title">' + esc(s.nome) + '</span><span class="row-sub" style="display:block">' + esc(dur(s.duracao)) + '</span></span>' +
        '<span class="row-end">' + esc(U.brlCurto(s.preco)) + '<span class="row-mark" aria-hidden="true"></span></span></button>' +
        (on ? fotoHTML(s, anim) : '') + '</li>';
    }).join('');
    if (!revelados) observarLinhas();
  }
  function observarLinhas() {
    var lis = $('servicos').querySelectorAll('.reveal');
    if (reduz || !('IntersectionObserver' in window)) { lis.forEach(function (l) { l.classList.add('is-in'); }); revelados = true; return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
      if (!$('servicos').querySelector('.reveal:not(.is-in)')) { revelados = true; io.disconnect(); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: .15 });
    lis.forEach(function (l) { io.observe(l); });
  }
  $('servicos').addEventListener('click', function (e) {
    if (e.target.closest('[data-recarregar]')) { iniciar(); return; }
    var ir = e.target.closest('[data-ir]');
    if (ir) { rolarPara(ir.dataset.ir); return; }
    var b = e.target.closest('.row'); if (!b || st.feito) return;
    var mesmo = st.servico && st.servico.id === b.dataset.id;
    var novo = st.servicos.filter(function (s) { return s.id === b.dataset.id; })[0];
    if (!novo) return;
    st.servico = novo;
    revelados = true;
    if (!mesmo) {
      msgHorario('');
      renderServicos(true);
      var nb = $('servicos').querySelector('.row.is-on');
      if (nb) setTimeout(function () {
        var r = nb.getBoundingClientRect();
        if (r.top < 0 || r.top > window.innerHeight * .45) window.scrollTo({ top: r.top + window.scrollY - 16, behavior: reduz ? 'auto' : 'smooth' });
      }, 60);
    }
    $('s2').classList.remove('is-locked');
    renderDias();
    if (st.data) carregarHorarios();
    atualizarBarra();
  });

  /* ---------- faixa "Trabalhos da casa" (conteúdo fixo) ---------- */
  function renderFaixa() {
    var nomes = ['Corte masculino', 'Corte feminino', 'Barba', 'Corte + Barba', 'Sobrancelha', 'Freestyle', 'Pezinho'];
    var arq = ['svc-corte-masculino', 'svc-corte-feminino', 'svc-barba', 'svc-corte-barba', 'svc-sobrancelha', 'svc-freestyle', 'svc-pezinho'];
    var um = arq.map(function (f, i) {
      return '<figure><img src="img/t/' + f + '.jpg" width="112" height="140" alt="' + esc(nomes[i]) + '"' + (i ? ' loading="lazy"' : '') + '><figcaption>' + esc(nomes[i]) + '</figcaption></figure>';
    }).join('');
    var dois = arq.map(function (f, i) {
      return '<figure aria-hidden="true"><img src="img/t/' + f + '.jpg" width="112" height="140" alt="" loading="lazy"><figcaption>' + esc(nomes[i]) + '</figcaption></figure>';
    }).join('');
    $('mtrack').innerHTML = um + (reduz ? '' : dois);
    var m = $('marquee');
    var pausa = function () { m.classList.add('is-paused'); };
    var segue = function () { m.classList.remove('is-paused'); };
    m.addEventListener('pointerdown', pausa); m.addEventListener('pointerup', segue);
    m.addEventListener('pointercancel', segue); m.addEventListener('pointerleave', segue);
    m.addEventListener('touchstart', pausa, { passive: true }); m.addEventListener('touchend', segue);
  }
  renderFaixa();

  /* ---------- 02 dias ---------- */
  function renderDias() {
    var h = U.hoje(), out = '', meses = {};
    for (var i = 0; i < 14; i++) {
      var iso = U.addDias(h, i), d = U.parseISO(iso);
      var fechado = U.diaFechado(iso, st.cfg);
      var on = st.data === iso;
      meses[U.MESES3[d.getMonth()]] = 1;
      var rot = i === 0 ? 'hoje' : i === 1 ? 'amanhã' : U.DIAS3[d.getDay()];
      out += '<button type="button" class="chip day' + (on ? ' is-on' : '') + '" role="radio" aria-checked="' + on + '" data-d="' + iso + '"' +
        (fechado ? ' disabled aria-label="' + U.DIAS[d.getDay()] + ' ' + d.getDate() + ', fechado"' : ' aria-label="' + esc(diaLongo(iso)) + '"') + '>' +
        '<span class="day-dow">' + rot + '</span><span class="day-n">' + d.getDate() + '</span><span class="day-m">' + (fechado ? 'fechado' : U.MESES3[d.getMonth()]) + '</span></button>';
    }
    $('dias').innerHTML = out;
    $('mes').textContent = Object.keys(meses).join(' / ');
  }
  $('dias').addEventListener('click', function (e) {
    var b = e.target.closest('.day'); if (!b || b.disabled || st.feito) return;
    var mudou = st.data !== b.dataset.d;
    st.data = b.dataset.d;
    if (mudou) { st.inicio = null; msgHorario(''); }
    $('dias').querySelectorAll('.day').forEach(function (x) {
      var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-checked', on);
    });
    pop(b);
    $('s3').classList.remove('is-locked');
    carregarHorarios().then(function () { setTimeout(function () { rolarPara('s3'); }, 120); });
    atualizarBarra();
  });

  /* ---------- 03 horários ---------- */
  function carregarHorarios() {
    if (st.feito || !st.servico || !st.data) return Promise.resolve();
    var data = st.data, servico = st.servico;
    return Promise.all([DB.config(), DB.ocupados(data)]).then(function (r) {
      if (st.feito || data !== st.data || servico !== st.servico) return;
      st.cfg = r[0];
      st.livres = U.horariosLivres(data, servico.duracao, r[0], r[1], data === U.hoje() ? agoraMin() : null);
      if (st.inicio != null && st.livres.indexOf(st.inicio) < 0 && !st.pend) {
        st.inicio = null;
        msgHorario('O horário que você escolheu acabou de ser ocupado. Escolha outro.');
      }
      renderHorarios();
      atualizarBarra();
    }, function (err) {
      if (data !== st.data) return;
      console.warn('[agendar] horários:', err && err.code);
      $('nlivres').textContent = '';
      $('horarios').innerHTML = '<div class="empty"><strong>Não foi possível carregar os horários.</strong>' + esc(JC.msgErro(err)) +
        '<button type="button" class="btn btn-ghost btn-block" data-recarregar-h style="margin-top:14px">Tentar de novo</button></div>';
    });
  }
  function renderHorarios() {
    var box = $('horarios');
    if (!st.livres.length) {
      $('nlivres').textContent = '';
      box.innerHTML = '<div class="empty"><strong>Sem horários livres neste dia.</strong>Tente outro dia ou um serviço mais curto.</div>';
      return;
    }
    $('nlivres').textContent = st.livres.length + (st.livres.length === 1 ? ' livre' : ' livres');
    box.innerHTML = '<div class="slots" role="radiogroup" aria-labelledby="t3">' + st.livres.map(function (t) {
      var on = st.inicio === t;
      return '<button type="button" class="slot' + (on ? ' is-on' : '') + '" role="radio" aria-checked="' + on + '" data-t="' + Number(t) + '">' + U.hhmm(t) + '</button>';
    }).join('') + '</div>';
  }
  $('horarios').addEventListener('click', function (e) {
    if (e.target.closest('[data-recarregar-h]')) { carregarHorarios(); return; }
    var b = e.target.closest('.slot'); if (!b || st.feito) return;
    st.inicio = +b.dataset.t;
    msgHorario('');
    $('horarios').querySelectorAll('.slot').forEach(function (x) {
      var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-checked', on);
    });
    pop(b);
    var primeira = $('s4').classList.contains('is-locked');
    $('s4').classList.remove('is-locked');
    atualizarBarra();
    if (primeira) setTimeout(function () { rolarPara('s4'); }, 140);
  });

  /* ---------- 04 dados (mesmas regras do servidor) ---------- */
  // nome: 2–60 caracteres depois de tirar espaços repetidos
  function nomeLimpo() { return $('nome').value.trim().replace(/\s+/g, ' '); }
  function nomeOk() { var n = nomeLimpo(); return n.length >= 2 && n.length <= 60; }
  // telefone: só dígitos, sem +55; DDD + 8 (fixo) ou DDD + 9 + 8 (celular) -> 10 ou 11 dígitos (servidor aceita 10–13)
  function telDigitos(v) {
    var d = U.soDigitos(v);
    if (d.length > 11 && d.indexOf('55') === 0) d = d.slice(2);
    if (d.length > 11 && d.charAt(0) === '0') d = d.replace(/^0+/, '');
    return d.slice(0, 11);
  }
  function telOk() { return /^[1-9]{2}(9\d{8}|[2-8]\d{7})$/.test(telDigitos($('zap').value)); }
  function mascara(v) {
    var d = telDigitos(v);
    if (!d.length) return '';
    if (d.length === 10 && d.charAt(2) !== '9') return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    var o = '(' + d.slice(0, 2);
    if (d.length >= 2) o += ') ';
    if (d.length > 2) o += d.slice(2, 3);
    if (d.length > 3) o += ' ' + d.slice(3, 7);
    if (d.length > 7) o += '-' + d.slice(7, 11);
    return o;
  }
  var DICA_TEL = 'Só para o Juan confirmar com você.';
  $('zap').addEventListener('input', function () {
    this.value = mascara(this.value);
    $('f-zap').classList.remove('is-error');
    $('f-zap').querySelector('.field-hint').textContent = DICA_TEL;
    atualizarBarra();
  });
  $('nome').addEventListener('input', function () {
    $('f-nome').classList.remove('is-error'); $('f-nome').querySelector('.field-hint').classList.add('hidden');
    atualizarBarra();
  });

  /* ---------- barra ---------- */
  function atualizarBarra() {
    var bar = $('bar');
    $('s1').classList.toggle('is-done', !!st.servico);
    $('s2').classList.toggle('is-done', !!st.data);
    $('s3').classList.toggle('is-done', st.inicio != null);
    $('s4').classList.toggle('is-done', nomeOk() && telOk());
    if (!st.servico) { bar.classList.remove('is-on'); return; }
    bar.classList.add('is-on');
    $('sum1').textContent = st.servico.nome + ' · ' + U.brlCurto(st.servico.preco);
    var p = [];
    if (st.data) p.push(cap(diaLongo(st.data)));
    $('sum2').textContent = st.inicio != null ? p.join(' ') + ' às ' + U.hhmm(st.inicio)
      : p.concat(st.data ? 'escolha o horário' : 'escolha o dia').join(' · ');
    var pronto = st.data && st.inicio != null && nomeOk() && telOk();
    $('continuar').classList.toggle('is-ready', !!pronto);
    $('continuar').setAttribute('aria-disabled', pronto ? 'false' : 'true');
    $('continuar').style.opacity = pronto ? '' : '.5';
  }
  function rolarPara(id) {
    var el = $(id); if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 16, behavior: reduz ? 'auto' : 'smooth' });
  }

  $('continuar').addEventListener('click', function () {
    if (st.enviando) return;
    if (!st.data) { toast('Escolha o dia.'); rolarPara('s2'); return; }
    if (st.inicio == null) { toast('Escolha um horário.'); rolarPara('s3'); return; }
    if (!nomeOk()) {
      $('f-nome').classList.add('is-error'); $('f-nome').querySelector('.field-hint').classList.remove('hidden');
      rolarPara('s4'); $('nome').focus({ preventScroll: true }); return;
    }
    if (!telOk()) {
      $('f-zap').classList.add('is-error');
      $('f-zap').querySelector('.field-hint').textContent = 'Confira o número com DDD. Ex.: (71) 9 9999-9999.';
      rolarPara('s4'); $('zap').focus({ preventScroll: true }); return;
    }
    abrirSheet();
  });

  /* ---------- confirmação ---------- */
  function kv(k, v, num) { return '<div class="kv-row"><span class="kv-k">' + esc(k) + '</span><span class="kv-v' + (num ? ' num' : '') + '">' + esc(v) + '</span></div>'; }
  function resumoKV() {
    return kv('Serviço', st.servico.nome) +
      kv('Dia', cap(diaLongo(st.data))) +
      kv('Horário', U.hhmm(st.inicio) + ' – ' + U.hhmm(st.inicio + Number(st.servico.duracao)), true) +
      kv('Nome', nomeLimpo()) +
      kv('Valor', U.brlCurto(st.servico.preco), true);
  }
  function abrirSheet() {
    st.pend = { servico: st.servico, data: st.data, inicio: st.inicio };
    $('sheet-kv').innerHTML = resumoKV();
    $('sheet-msg').classList.add('hidden'); $('sheet-msg').classList.remove('sheet-lento');
    $('confirmar').disabled = false; $('confirmar').textContent = 'Confirmar agendamento';
    $('voltar').disabled = false;
    $('scrim').classList.add('is-on'); $('sheet').classList.add('is-on');
    if (document.activeElement) document.activeElement.blur();
  }
  function fecharSheet() {
    if (st.enviando) return;   // não fecha no meio do envio
    st.pend = null; $('scrim').classList.remove('is-on'); $('sheet').classList.remove('is-on');
  }
  $('scrim').addEventListener('click', fecharSheet);
  $('voltar').addEventListener('click', fecharSheet);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fecharSheet(); });

  function sheetMsg(txt, lento) {
    var m = $('sheet-msg'); m.textContent = txt; m.classList.toggle('sheet-lento', !!lento); m.classList.remove('hidden');
  }
  $('confirmar').addEventListener('click', function () {
    var b = this, p = st.pend;
    if (st.enviando || !p) return;   // trava duplo toque
    if (navigator.onLine === false) { sheetMsg('Sem internet. Confira a conexão e toque em Tentar de novo.'); b.textContent = 'Tentar de novo'; return; }
    st.enviando = true;
    b.disabled = true; b.textContent = 'Confirmando…'; $('voltar').disabled = true;
    $('sheet-msg').classList.add('hidden');
    var lento = setTimeout(function () { sheetMsg('A conexão está lenta. Aguarde, ainda estamos confirmando…', true); }, 12000);
    DB.criarAgendamento({
      nome: nomeLimpo(), telefone: telDigitos($('zap').value),
      servicoId: p.servico.id, servicoNome: p.servico.nome, preco: p.servico.preco, duracao: p.servico.duracao,
      data: p.data, inicio: p.inicio
    }).then(function (ag) {
      clearTimeout(lento); st.enviando = false;
      fecharSheet(); sucesso(ag);
    }).catch(function (err) {
      clearTimeout(lento); st.enviando = false;
      $('voltar').disabled = false;
      b.disabled = false; b.textContent = 'Confirmar agendamento';
      if (err && err.code === 'ocupado') {
        fecharSheet();
        st.inicio = null;
        msgHorario('Esse horário acabou de ser ocupado. Escolha outro.');
        carregarHorarios().then(function () { rolarPara('s3'); });
        toast('Esse horário acabou de ser ocupado. Escolha outro.', 4200);
      } else {
        b.disabled = false; b.textContent = 'Tentar de novo';
        sheetMsg(err && err.code === 'invalido'
          ? 'Não foi possível confirmar esse horário. Atualize a página e tente de novo.'
          : JC.semRede(err) ? 'Sem conexão com a internet. Confira e toque em Tentar de novo.'
          : 'Não foi possível salvar agora. Tente de novo.');
        console.warn('[agendar] criar:', err && err.code);
      }
    });
  });

  /* ---------- sucesso ---------- */
  function sucesso(ag) {
    st.feito = true;
    var texto = 'Olá Juan! Marquei ' + ag.servicoNome + ' ' + diaZap(ag.data) + ' às ' + U.hhmm(ag.inicio) + '. Nome: ' + ag.nome;
    var wa = 'https://wa.me/' + ZAP + '?text=' + encodeURIComponent(texto);
    var primeiro = String(ag.nome).split(' ')[0];
    $('sucesso').innerHTML =
      '<a class="logo-link rise" style="--i:0" href="index.html" aria-label="Barbearia Juan Cortes, início"><img class="logo logo-md" src="img/logo-512.png" width="434" height="512" alt="Barbearia Juan Cortes"></a>' +
      '<svg class="check" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30"/><path d="M20 33.5l8 8 16-18"/></svg>' +
      '<p class="eyebrow rise" style="--i:1">Horário marcado</p>' +
      '<h1 class="rise" style="--i:2;margin-top:8px" id="suc-t"></h1>' +
      '<p class="muted rise" style="--i:3;margin:0">Avise o Juan no WhatsApp para ele confirmar.</p>' +
      '<div class="kv rise" style="--i:4">' +
        kv('Serviço', ag.servicoNome) + kv('Dia', cap(diaLongo(ag.data))) +
        kv('Horário', U.hhmm(ag.inicio) + ' – ' + U.hhmm(ag.fim), true) + kv('Valor', U.brlCurto(ag.preco), true) +
      '</div>' +
      '<div class="links rise" style="--i:5">' +
        '<a class="btn btn-primary btn-block" target="_blank" rel="noopener noreferrer" href="' + esc(wa) + '">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 19.5l1.2-4A8 8 0 1 1 8.6 18.4z"/><path d="M9.2 9.3c.3 1.9 1.6 3.6 3.6 4.6l1.2-1.1 1.9.8-.3 1.6c-3.4.2-6.6-2.9-6.7-6.3l1.6-.4.8 1.9z"/></svg>' +
          'Avisar o Juan no WhatsApp</a>' +
        '<a class="btn btn-ghost btn-block" target="_blank" rel="noopener noreferrer" href="' + esc(MAPS) + '">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10" r="2.3"/></svg>' +
          'Como chegar</a>' +
        '<a class="btn btn-ghost btn-block" target="_blank" rel="noopener noreferrer" href="' + esc(INSTA) + '">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3.5h8A4.5 4.5 0 0 1 20.5 8v8a4.5 4.5 0 0 1-4.5 4.5H8A4.5 4.5 0 0 1 3.5 16V8A4.5 4.5 0 0 1 8 3.5z"/><circle cx="12" cy="12" r="3.8"/><circle cx="17.2" cy="6.8" r=".4"/></svg>' +
          '@juanl_cortes</a>' +
        '<button class="btn btn-text btn-block" type="button" id="outro">Fazer outro agendamento</button>' +
      '</div>';
    $('suc-t').textContent = 'Até lá, ' + primeiro + '.';
    $('fluxo').classList.add('hidden');
    $('bar').classList.remove('is-on');
    $('sucesso').classList.remove('hidden');
    window.scrollTo(0, 0);
    $('outro').addEventListener('click', reiniciar);
  }

  function reiniciar() {
    st.feito = false; st.servico = null; st.data = null; st.inicio = null; st.livres = [];
    $('nome').value = ''; $('zap').value = '';
    msgHorario('');
    ['s2', 's3', 's4'].forEach(function (id) { $(id).classList.add('is-locked'); });
    $('horarios').innerHTML = '<p class="muted small">Escolha o serviço e o dia para ver os horários livres.</p>';
    $('nlivres').textContent = '';
    renderServicos(); renderDias(); atualizarBarra();
    $('sucesso').classList.add('hidden'); $('sucesso').innerHTML = '';
    $('fluxo').classList.remove('hidden');
    window.scrollTo(0, 0);
  }

  /* ---------- início ---------- */
  function erroCarga(err) {
    if (err && err.code === 'sem-config') { JC.pendente(false); return; }
    console.warn('[agendar] carregar:', err && (err.code || err.message));
    $('servicos').innerHTML = '<li><div class="empty"><strong>Não foi possível carregar os serviços.</strong>' +
      esc(err ? JC.msgErro(err) : 'Confira a internet e tente de novo.') +
      '<button type="button" class="btn btn-ghost btn-block" data-recarregar style="margin-top:14px">Tentar de novo</button></div></li>';
  }
  var ligado = false;
  function iniciar() {
    $('servicos').innerHTML = '<li class="muted small" style="padding:14px 0">Carregando serviços…</li>';
    DB.iniciar().then(function () {
      return Promise.all([DB.servicos(), DB.config()]);
    }).then(function (r) {
      st.servicos = r[0].filter(function (s) { return s.ativo !== false; });
      st.cfg = r[1];
      if (!st.servicos.length) { erroCarga(null); return; }
      renderServicos(); renderDias();
      if (ligado) return;
      ligado = true;
      DB.aoMudar(function () {
        if (st.feito) return;
        Promise.all([DB.config(), DB.servicos()]).then(function (x) {
          st.cfg = x[0];
          var lista = x[1].filter(function (s) { return s.ativo !== false; });
          if (JSON.stringify(lista) !== JSON.stringify(st.servicos)) {   // catálogo mudou no painel
            st.servicos = lista;
            if (st.servico) st.servico = lista.filter(function (s) { return s.id === st.servico.id; })[0] || null;
            renderServicos(); atualizarBarra();
          }
          renderDias();
          if (st.data && st.servico) carregarHorarios();
        }).catch(function () {});
      });
    }).catch(erroCarga);
  }
  iniciar();
})();
