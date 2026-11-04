/* =====================================================================
   Barbearia Juan Cortes — utilidades comuns (agendar.html e painel.html)
   Carregar no <head>, DEPOIS de firebase-config.js e ANTES de db-firebase.js.
   - Emulador local (só testes): ?emulador=1 funciona APENAS em localhost/127.0.0.1.
     Em produção (qualquer outro domínio) o emulador fica sempre desligado.
   - JC.configOk(): firebase-config.js preenchido?
   - JC.pendente(): tela "Configuração pendente" (sem quebrar a página).
   - JC.esc(): escapa texto para HTML. JC.msgErro(): erro -> frase em pt-BR.
   ===================================================================== */
(function (w) {
  'use strict';
  var d = document, html = d.documentElement;

  /* ---------- emulador (só em localhost) ---------- */
  var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(w.location.hostname);
  var pediu = /(^|[?&])emulador=1(&|$)/.test(w.location.search.slice(1));
  try { if (local && pediu) sessionStorage.setItem('jc_emulador', '1'); } catch (e) {}
  var usarEmu = false;
  try { usarEmu = local && (pediu || sessionStorage.getItem('jc_emulador') === '1' || !!w.FIREBASE_EMULADOR); } catch (e) { usarEmu = local && pediu; }
  if (usarEmu) {
    w.FIREBASE_EMULADOR = w.FIREBASE_EMULADOR || { host: '127.0.0.1', firestore: 8080, auth: 9099 };
    // sempre o projeto de teste 'demo-juan' no emulador: nunca usa (nem grava) o projeto real
    w.FIREBASE_CONFIG = { apiKey: 'demo-api-key', authDomain: 'demo-juan.firebaseapp.com', projectId: 'demo-juan', appId: '1:000000000000:web:demo' };
  } else {
    w.FIREBASE_EMULADOR = null;   // produção: nunca liga no emulador
  }

  function configOk() {
    var c = w.FIREBASE_CONFIG || {};
    return !!(c.apiKey && c.projectId && c.appId);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function semRede(e) {
    var c = (e && e.code) || '';
    return (typeof navigator !== 'undefined' && navigator.onLine === false) ||
      c === 'unavailable' || c === 'deadline-exceeded' || c === 'auth/network-request-failed' || c === 'rede' ||
      /Failed to fetch|NetworkError|dynamically imported module|offline/i.test((e && e.message) || '');
  }
  function msgErro(e) {
    var c = (e && e.code) || '';
    if (semRede(e)) return 'Sem conexão com a internet. Confira e tente de novo.';
    if (c === 'ocupado') return 'Esse horário já foi ocupado por outro cliente.';
    if (c === 'permission-denied') return 'Sem permissão para isso. Saia e entre de novo no painel.';
    if (c === 'nao-encontrado') return 'Esse registro não existe mais.';
    if (c === 'invalido') return 'Algum dado não foi aceito. Confira e tente de novo.';
    return 'Não foi possível concluir agora. Tente de novo.';
  }

  // Tela limpa quando firebase-config.js ainda está vazio (ou o SDK não carrega por configuração)
  function pendente(painel) {
    var main = d.createElement('main');
    main.className = 'wrap pendente';
    main.setAttribute('role', 'alert');
    var img = d.createElement('img');
    img.className = 'logo logo-lg'; img.src = 'img/logo.png'; img.width = 680; img.height = 803; img.alt = 'Barbearia Juan Cortes';
    var h = d.createElement('h1'); h.textContent = 'Configuração pendente';
    var p = d.createElement('p'); p.className = 'muted';
    p.textContent = painel
      ? 'O painel ainda não foi ligado ao banco de dados. Falta preencher o arquivo firebase-config.js com a configuração do Firebase.'
      : 'O agendamento online está sendo configurado. Enquanto isso, fale com o Juan pelo WhatsApp.';
    main.appendChild(img); main.appendChild(h); main.appendChild(p);
    if (!painel) {
      var a = d.createElement('a');
      a.className = 'btn btn-primary btn-block'; a.href = 'https://wa.me/5571991255480';
      a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'Chamar no WhatsApp';
      main.appendChild(a);
    }
    function trocar() {
      Array.prototype.forEach.call(d.body.children, function (el) {
        if (el.tagName !== 'SCRIPT') el.classList.add('hidden');
      });
      html.classList.remove('intro');
      d.body.insertBefore(main, d.body.firstChild);
    }
    if (d.body) trocar(); else d.addEventListener('DOMContentLoaded', trocar);
  }

  /* ---------- entrada animada do agendar.html (decidida aqui, antes de pintar) ---------- */
  try {
    if (html.hasAttribute('data-intro') && configOk() &&
        !(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches) &&
        !sessionStorage.getItem('jc_intro')) {
      html.classList.add('intro');
      // segurança: se algo falhar, nunca deixa a página escondida
      setTimeout(function () { html.classList.remove('intro'); }, 4000);
    }
  } catch (e) { html.classList.remove('intro'); }

  /* ---------- profundidade 3D nas opções tocáveis ----------
     Inclina de leve na direção do dedo/mouse (variáveis --rx/--ry usadas no transform do CSS),
     levanta ao passar o mouse (.is-hover) e "afunda" ao tocar (.is-press). Só transform/opacity.
     Desligado com prefers-reduced-motion. Um único ouvinte delegado no documento. */
  var SEL3D = '.opt, .t3d, .ag, .ibtn, .chip, .bc, .tg';
  var MAX = 5;   // graus
  var reduz = !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function alvo3d(t) {
    var el = t && t.closest ? t.closest(SEL3D) : null;
    if (!el || el.disabled) return null;
    // tocou num botão/campo DENTRO de um cartão: o cartão não inclina (o botão tem o próprio :active)
    var ctl = t.closest('button, a, input, select, textarea, label');
    if (ctl && ctl !== el && el.contains(ctl)) return null;
    return el;
  }
  function inclinar(el, x, y) {
    var r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    var px = Math.max(-1, Math.min(1, ((x - r.left) / r.width) * 2 - 1));
    var py = Math.max(-1, Math.min(1, ((y - r.top) / r.height) * 2 - 1));
    var k = r.width > 220 ? .45 : 1;   // cartões largos inclinam menos
    el.style.setProperty('--ry', (px * MAX * k).toFixed(2) + 'deg');
    el.style.setProperty('--rx', (-py * MAX * k).toFixed(2) + 'deg');
  }
  function soltar(el) { if (!el) return; el.classList.remove('is-press', 'is-hover'); el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); }
  var preso = null, sobre = null;
  if (!reduz) {
    d.addEventListener('pointerdown', function (e) {
      var el = alvo3d(e.target); if (!el) return;
      preso = el; el.classList.add('is-press'); inclinar(el, e.clientX, e.clientY);
    }, { passive: true });
    var fim = function () { if (preso) { var el = preso; preso = null; el.classList.remove('is-press'); if (el !== sobre) soltar(el); } };
    d.addEventListener('pointerup', fim, { passive: true });
    d.addEventListener('pointercancel', fim, { passive: true });
    d.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var el = alvo3d(e.target);
      if (el !== sobre) { if (sobre && sobre !== preso) soltar(sobre); sobre = el; if (el) el.classList.add('is-hover'); }
      if (el) inclinar(el, e.clientX, e.clientY);
    }, { passive: true });
    d.addEventListener('pointerleave', function () { if (sobre) soltar(sobre); sobre = null; }, { passive: true });
    w.addEventListener('scroll', function () { if (preso) { soltar(preso); preso = null; } }, { passive: true });
  }

  w.JC = { configOk: configOk, esc: esc, msgErro: msgErro, semRede: semRede, pendente: pendente, emulador: usarEmu, reduz: reduz };
})(window);
