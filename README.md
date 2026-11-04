# Barbearia Juan Cortes — agendamento + painel (produção, Firebase)

Barbearia Juan Cortes · R. Amazonas de Baixo, 8 · Cabula, Salvador — BA · WhatsApp 71 99125-5480.
Projeto Firebase: **`barbearia-juan-cortes`** (já em `firebase-config.js` e `.firebaserc`).

## Páginas
- `index.html` — entrada (cliente ou barbeiro).
- `agendar.html` (+ `agendar.js`) — cliente escolhe serviço, dia e horário livre e confirma com nome + WhatsApp.
  Na 1ª abertura da sessão: logo surge no centro, filete se desenha, logo sobe e o resto entra em cascata
  (~1,6 s, toque pula, respeita "reduzir movimento").
- `painel.html` (+ `painel.js`) — painel do barbeiro (PWA instalável), com **login por e-mail e senha** (Firebase Auth):
  - **Agenda** ao vivo, *Atendido* (lança no caixa), *Não veio* (libera o horário), *Desfazer*.
  - **Financeiro**: Hoje / 7 dias / Mês, lançar saída ou corte avulso.
  - **Ajustes**: serviços, horário, notificações, sair.
  - "Esqueci a senha" envia o e-mail de redefinição do Firebase. A sessão fica salva no aparelho.
  - Só quem tem documento `admins/{uid}` vê dados. Outra conta vê "Acesso não autorizado" e é desconectada.

Arquivos: `comum.js` (utilidades, tela "Configuração pendente", modo emulador), `db-firebase.js` (camada de dados),
`firebase-config.js` (config pública do app web), `firestore.rules` (regras finais), `firestore.indexes.json`,
`firebase.json`, `sw.js` (cache só dos arquivos do site), `manifest.json`.
Testes e ferramentas: `../juan-prod-tests/`.

## O que falta fazer no Console (Daniel)

1. **Authentication → Método de login → E-mail/senha → Ativar.**
2. **Firestore Database → Criar banco** (`southamerica-east1`, modo de produção), se ainda não existir.
3. **Publicar as regras**: Firestore → **Regras** → apagar tudo → colar o conteúdo de `firestore.rules` → **Publicar**.
   (ou `firebase deploy --only firestore:rules,firestore:indexes` nesta pasta, depois de `firebase login`.)
4. **Dar acesso ao painel** — criar o documento do barbeiro:
   Firestore → **Iniciar coleção** → ID da coleção `admins` → ID do documento **`aXJZXHFRIeO3Nnk0avjXu8XeuRf1`**
   → campo `nome` (string) = `Daniel` → Salvar.
   Para o Juan depois: crie a conta dele em Authentication → Usuários, copie o UID e crie **outro** documento
   `admins/{UID_DO_JUAN}` do mesmo jeito. Pode haver vários; cada um com seu login.
5. **Serviços e horário**: pelo painel (Ajustes → Salvar serviços / Salvar horário) depois de entrar,
   ou com o seed (abaixo). Sem serviços, a página do cliente mostra "Não foi possível carregar os serviços".
6. **Authentication → Configurações → Domínios autorizados**: adicionar o domínio do site
   (ex.: `seuusuario.github.io`) para o login e o "Esqueci a senha" funcionarem lá.
7. **Recomendado:** App Check (ver "Segurança").

### Seed (opcional, pelo terminal)
Precisa de uma chave de conta de serviço (Configurações do projeto → Contas de serviço → Gerar nova chave — **nunca** no site):
```bash
cd juan-prod-tests && npm install
GOOGLE_APPLICATION_CREDENTIALS=/caminho/chave.json node seed.js --producao
#   projeto padrão: barbearia-juan-cortes; admins padrão: aXJZXHFRIeO3Nnk0avjXu8XeuRf1 (lista ADMINS_PRODUCAO no seed.js)
#   mais de um barbeiro: --admin-uid UID1,UID2
```
Grava `servicos/*`, `config/loja` (seg–sáb 09:00–19:45, almoço 12–13h, domingo fechado) e `admins/{uid}`.

## Como o horário duplicado é impedido
Cada agendamento cria, no **mesmo batch**, um documento em `slots/` para cada bloco de 15 min que ocupa
(`AAAA-MM-DD_minuto`, sem nome/telefone). As regras só permitem **criar** slot que ainda não existe; quem chega
depois recebe "Esse horário acabou de ser ocupado". "Não veio"/"cancelado" apagam os slots; "Desfazer" recria se ninguém pegou.
Testado com 10 navegadores no mesmo horário ao mesmo tempo: 1 confirma, 9 recebem o aviso.

## Segurança
- **Chave do Firebase não é segredo**: `apiKey`/`appId` ficam públicos em qualquer app web; quem protege os dados são
  as regras. Nenhuma senha, chave de serviço ou token no código.
- **Escape**: tudo que vem do cliente/banco vai para a tela escapado (`JC.esc`) ou por `textContent`
  (testado com o nome `<img src=x onerror=alert(1)>`: aparece como texto).
- **CSP por `<meta>`** em todas as páginas: scripts só do próprio site e de `https://www.gstatic.com/firebasejs/`,
  sem `unsafe-inline`/`unsafe-eval` para scripts (todo JS está em arquivos); conexões só com Firestore/Auth/App Check;
  `object-src 'none'`, `frame-src 'none'`, `base-uri 'self'`, `form-action 'none'`.
  Estilos permitem `'unsafe-inline'` (atributos `style` de animação; risco baixo).
  **GitHub Pages não deixa configurar cabeçalhos HTTP**, por isso o CSP vai em `<meta>` — e `frame-ancestors`
  (anti-clickjacking) não funciona via meta. No Firebase Hosting dá para mandar CSP e `frame-ancestors` como cabeçalho em `firebase.json`.
- `referrer` = `strict-origin-when-cross-origin` (mantém compatível com restrição de chave por domínio no Google Cloud).
- Links externos com `target="_blank"` usam `rel="noopener noreferrer"`. Sem redirecionamentos abertos.
- Validação no navegador igual às regras: nome 2–60 caracteres; telefone só dígitos, DDD + 8/9 dígitos
  (aceita colar "+55 …"); botão de confirmar trava contra toque duplo.
- Sem internet / conexão lenta: mensagens claras e "Tentar de novo"; o painel não desloga por falta de rede.
- Service worker guarda **só** os arquivos do site (lista fixa); nunca intercepta Firestore, Auth ou o SDK. Cache `jc-shell-v4`.
- **App Check (recomendado)**: Console → App Check → registrar o app web com reCAPTCHA v3 → colar a chave do site em
  `FIREBASE_APP_CHECK` (`ativo: true`) → **acrescentar ao CSP** de cada página:
  `script-src … https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/` e `frame-src https://www.google.com/recaptcha/`
  → acompanhar métricas → **Aplicar** no Firestore. Vem desligado.
- Opcional: restringir a chave de API por domínio (Google Cloud → Credenciais).

## Testar localmente (emulador — nunca toca o projeto real)
`?emulador=1` só funciona em `localhost`/`127.0.0.1` e troca a config pelo projeto de teste `demo-juan`.
```bash
cd juan-prod-tests && npm install
./baixar-emulador.sh                 # emulador do Firestore (Java 11+)
CI=true npm test                     # regras + concorrência (60 testes)
./e2e/iniciar.sh                     # Firestore + Auth emulator + site em http://127.0.0.1:8777
python3 e2e/teste_e2e.py todos       # Playwright: entrada, agendar 390/320, corrida x10, painel 390/320, config vazia
```
`CI=true` evita que o firebase-tools trave checando atualização em ambiente sem rede.
