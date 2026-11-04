/* =====================================================================
   Barbearia Juan Cortes — configuração do Firebase (app web)
   ---------------------------------------------------------------------
   Projeto: barbearia-juan-cortes (preenchido em 04/11/2026). Para trocar, copie de:
   Configurações do projeto (engrenagem) > Geral > Seus apps > App da Web
   > "Configuração do SDK" > Config. Copie cada valor entre as aspas.
   Esses valores NÃO são senha (ficam visíveis no site); quem protege os
   dados são as regras do Firestore (firestore.rules).
   SDK usado pelas páginas: 10.14.1 (CDN gstatic), definido em db-firebase.js.
   Se apagar estes valores, as páginas mostram "Configuração pendente".
   ===================================================================== */
window.FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCF1E5BMJtjAUkg2WBwcC6-DJmIjLqnboM',
  authDomain: 'barbearia-juan-cortes.firebaseapp.com',
  projectId: 'barbearia-juan-cortes',
  storageBucket: 'barbearia-juan-cortes.firebasestorage.app',
  messagingSenderId: '694113923128',
  appId: '1:694113923128:web:314eeb0c5cb4baa7a436cd'
};

/* App Check (proteção contra robôs/spam de agendamento) — DESLIGADO.
   Para ligar: Console > App Check > registrar o app web com reCAPTCHA v3
   (ou reCAPTCHA Enterprise), colar a chave do site aqui, ativo: true,
   testar e só então "Aplicar" (enforce) o App Check no Firestore. */
window.FIREBASE_APP_CHECK = {
  ativo: false,
  enterprise: false,       // true = ReCaptchaEnterpriseProvider; false = ReCaptchaV3Provider
  siteKey: ''              // <-- chave do SITE do reCAPTCHA (não a secreta)
};

/* Emulador local: abra a página com ?emulador=1 em localhost/127.0.0.1 (comum.js).
   Nesse modo a configuração acima é TROCADA pela do projeto de teste 'demo-juan',
   então os testes nunca tocam o projeto real. Em qualquer outro domínio fica desligado. */
window.FIREBASE_EMULADOR = null;
