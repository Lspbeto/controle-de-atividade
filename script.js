/* ===== DADOS FIXOS ===== */
// As 3 etapas: k = código interno, nome = texto exibido, cor = cor da faixa da coluna
const STATUS = [
  { k: 'todo',  nome: 'A fazer',      cor: 'var(--todo)'  },
  { k: 'doing', nome: 'Em andamento', cor: 'var(--doing)' },
  { k: 'done',  nome: 'Concluídas',   cor: 'var(--done)'  }
];
const CATS = ['Todas', 'Trabalho', 'Estudo', 'Casa', 'Pessoal']; // opções do filtro

let tarefas = [];       // lista de atividades
let usuarios = [];      // lista de usuários: { id, nome }
let filtro = 'Todas';   // categoria selecionada no filtro
let editAtiv = null;    // id da atividade em edição (null = criando uma nova)
let editUser = null;    // id do usuário em edição (null = criando um novo)

/* ===== CARREGAR E SALVAR (localStorage) ===== */
function ler(chave) {                                    // lê uma lista salva no navegador
  try {
    const v = JSON.parse(localStorage.getItem(chave) || '[]'); // texto salvo -> lista
    return Array.isArray(v) ? v : [];                    // garante que é mesmo uma lista
  } catch (e) { return []; }                             // se falhar, começa vazio
}
// Os dados só são carregados depois do login: cada conta tem os seus próprios dados
let conta = null;       // nome da conta que está logada (null = ninguém)

function salvar() {                                      // grava as duas listas no navegador
  try {
    if (!conta) return;                                  // sem login, não salva nada
    localStorage.setItem('atividades:' + conta, JSON.stringify(tarefas)); // chave própria de cada conta
    localStorage.setItem('usuarios:' + conta, JSON.stringify(usuarios));
  } catch (e) {}
}

/* ===== FUNÇÕES AUXILIARES ===== */
function novoId() { return Date.now() + Math.random().toString(36).slice(2, 6); } // id único em texto
function hoje() {                                        // data de hoje como "AAAA-MM-DD"
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function fmt(s) { const [y, m, d] = s.split('-'); return d + '/' + m; } // "2026-10-22" -> "22/10"
function el(tag, classe, texto) {                        // cria um elemento HTML rapidamente
  const e = document.createElement(tag);
  if (classe) e.className = classe;                      // classe CSS, se houver
  if (texto != null) e.textContent = texto;              // texto (seguro contra código malicioso)
  return e;
}
function nomeUsuario(id) {                               // devolve o nome do usuário pelo id (ou '')
  const u = usuarios.find(x => x.id === id);
  return u ? u.nome : '';
}
const $ = id => document.getElementById(id);             // atalho para buscar elementos pelo id

/* ===== USUÁRIOS: CRIAR, EDITAR, EXCLUIR ===== */
function resetUsuario() {                                // volta o formulário de usuário ao modo "criar"
  editUser = null;
  $('fu').reset();
  $('btnUsuario').textContent = 'Adicionar usuário';
  $('cancelaUsuario').hidden = true;
}
function editarUsuario(id) {                             // coloca o usuário no formulário para editar
  editUser = id;
  $('nomeUsuario').value = nomeUsuario(id);              // preenche o campo com o nome atual
  $('btnUsuario').textContent = 'Salvar usuário';
  $('cancelaUsuario').hidden = false;                    // mostra o botão Cancelar
  $('nomeUsuario').focus();
}
function apagarUsuario(id) {                             // exclui o usuário
  if (!confirm('Excluir o usuário "' + nomeUsuario(id) + '"? Suas atividades ficarão sem responsável.')) return;
  usuarios = usuarios.filter(u => u.id !== id);          // remove da lista
  tarefas.forEach(t => { if (t.resp === id) t.resp = ''; }); // atividades dele ficam sem responsável
  if (editUser === id) resetUsuario();
  salvar(); render();
}
$('fu').addEventListener('submit', e => {                // ao enviar o formulário de usuário
  e.preventDefault();                                    // impede recarregar a página
  const nome = $('nomeUsuario').value.trim();
  if (!nome) return;
  if (editUser) {                                        // modo edição: altera o nome
    const u = usuarios.find(x => x.id === editUser);
    if (u) u.nome = nome;
  } else {                                               // modo criação: adiciona à lista
    usuarios.push({ id: novoId(), nome });
  }
  resetUsuario(); salvar(); render();
});
$('cancelaUsuario').onclick = resetUsuario;              // Cancelar: desfaz a edição

/* ===== ATIVIDADES: CRIAR, EDITAR, EXCLUIR, MOVER ===== */
function resetAtiv() {                                   // volta o formulário de atividade ao modo "criar"
  editAtiv = null;
  $('f').reset();
  $('btnAtiv').textContent = 'Adicionar';
  $('cancela').hidden = true;
}
function editarAtiv(id) {                                // carrega a atividade no formulário
  const t = tarefas.find(x => x.id === id);
  if (!t) return;
  editAtiv = id;
  $('titulo').value = t.titulo;
  $('cat').value = t.cat;
  $('resp').value = t.resp || '';                        // '' = sem responsável
  $('prazo').value = t.prazo || '';
  $('btnAtiv').textContent = 'Salvar alterações';
  $('cancela').hidden = false;
  $('f').scrollIntoView({ behavior: 'smooth', block: 'center' }); // rola até o formulário
  $('titulo').focus();
}
function apagar(id) {                                    // exclui a atividade
  const t = tarefas.find(x => x.id === id);
  if (!t || !confirm('Excluir a atividade "' + t.titulo + '"?')) return;
  tarefas = tarefas.filter(x => x.id !== id);
  if (editAtiv === id) resetAtiv();
  salvar(); render();
}
function mover(id, k) {                                  // muda a etapa de uma atividade
  const t = tarefas.find(x => x.id === id);
  if (t) { t.status = k; salvar(); render(); }
}
$('f').addEventListener('submit', e => {                 // ao enviar o formulário de atividade
  e.preventDefault();
  const titulo = $('titulo').value.trim();
  if (!titulo) return;
  const dados = { titulo, cat: $('cat').value, resp: $('resp').value, prazo: $('prazo').value };
  if (editAtiv) {                                        // modo edição: atualiza os campos
    const t = tarefas.find(x => x.id === editAtiv);
    if (t) Object.assign(t, dados);                      // Object.assign copia os campos novos para a atividade
  } else {                                               // modo criação: nova atividade no início da lista
    tarefas.unshift({ id: novoId(), status: 'todo', criada: hoje(), ...dados }); // criada: data de criação, usada no relatório
  }
  resetAtiv(); salvar(); render();
  $('titulo').focus();
});
$('cancela').onclick = resetAtiv;                        // Cancelar edição

/* ===== DESENHAR A TELA ===== */
function renderUsuarios() {                              // lista de usuários + opções do campo "Responsável"
  const ul = $('listaUsuarios'); ul.replaceChildren();
  if (!usuarios.length) ul.appendChild(el('li', 'n', 'Nenhum usuário cadastrado.'));
  usuarios.forEach(u => {
    const li = el('li');
    li.appendChild(el('span', null, u.nome));
    const qtd = tarefas.filter(t => t.resp === u.id).length; // quantas atividades ele tem
    li.appendChild(el('span', 'n', qtd + (qtd === 1 ? ' atividade' : ' atividades')));
    const b1 = el('button', null, 'Editar');   b1.onclick = () => editarUsuario(u.id);
    const b2 = el('button', 'del', 'Excluir'); b2.onclick = () => apagarUsuario(u.id);
    li.append(b1, b2);                                   // append aceita vários elementos de uma vez
    ul.appendChild(li);
  });
  const s = $('resp'), atual = s.value;                  // guarda a escolha atual do select
  s.replaceChildren();
  const o = el('option', null, 'Sem responsável'); o.value = ''; s.appendChild(o);
  usuarios.forEach(u => { const op = el('option', null, u.nome); op.value = u.id; s.appendChild(op); });
  s.value = atual;                                       // restaura a escolha (se ainda existir)
}

function render() {
  renderUsuarios();

  // --- Filtros ---
  const fb = $('filtros'); fb.replaceChildren();
  CATS.forEach(c => {
    const b = el('button', 'chip', c); b.type = 'button';
    b.setAttribute('aria-pressed', c === filtro);        // marca o filtro ativo (o CSS usa isso)
    b.onclick = () => { filtro = c; render(); };
    fb.appendChild(b);
  });
  fb.appendChild(el('span', 'spacer'));
  const lim = el('button', 'link', 'Limpar concluídas'); lim.type = 'button';
  lim.onclick = () => {
    if (!confirm('Excluir todas as atividades concluídas?')) return;
    tarefas = tarefas.filter(t => t.status !== 'done');
    salvar(); render();
  };
  fb.appendChild(lim);

  // --- Quadro ---
  const board = $('board'); board.replaceChildren();
  const vis = tarefas.filter(t => filtro === 'Todas' || t.cat === filtro);
  STATUS.forEach((s, i) => {
    const col = el('section', 'col');
    col.style.setProperty('--c', s.cor);                 // cor da faixa do topo
    const lista = vis.filter(t => t.status === s.k);
    const h = el('h2', null, s.nome); h.appendChild(el('span', null, lista.length));
    col.appendChild(h);
    if (!lista.length) col.appendChild(el('div', 'empty', 'Nenhuma atividade aqui.'));

    lista.forEach(t => {
      const c = el('article', 'card' + (s.k === 'done' ? ' done' : ''));
      c.appendChild(el('p', null, t.titulo));
      const m = el('div', 'meta');
      m.appendChild(el('span', 'tag', t.cat));
      const nome = nomeUsuario(t.resp);                  // responsável (vazio se não houver)
      if (nome) m.appendChild(el('span', 'tag', '👤 ' + nome));
      if (t.prazo) {
        const atrasada = s.k !== 'done' && t.prazo < hoje();
        m.appendChild(el('span', 'tag' + (atrasada ? ' late' : ''), (atrasada ? 'Atrasada: ' : 'Prazo: ') + fmt(t.prazo)));
      }
      c.appendChild(m);

      const a = el('div', 'acts');
      if (i > 0) { const b = el('button', null, '◀ ' + STATUS[i - 1].nome); b.onclick = () => mover(t.id, STATUS[i - 1].k); a.appendChild(b); }
      if (i < 2) { const b = el('button', null, STATUS[i + 1].nome + ' ▶'); b.onclick = () => mover(t.id, STATUS[i + 1].k); a.appendChild(b); }
      const ed = el('button', null, 'Editar');  ed.onclick = () => editarAtiv(t.id);
      const d = el('button', 'del', 'Excluir'); d.onclick = () => apagar(t.id);
      a.append(ed, d);
      c.appendChild(a);
      col.appendChild(c);
    });
    board.appendChild(col);
  });

  // --- Progresso (todas as atividades, sem filtro) ---
  const n = tarefas.length;
  const fe = tarefas.filter(t => t.status === 'done').length;
  const an = tarefas.filter(t => t.status === 'doing').length;
  $('pct').textContent = (n ? Math.round(fe / n * 100) : 0) + '%';
  $('resumo').textContent = fe + ' de ' + n + ' concluídas';
  $('bd').style.width = (n ? fe / n * 100 : 0) + '%';
  $('bg').style.width = (n ? an / n * 100 : 0) + '%';
}

/* ===== RELATÓRIO POR PERÍODO ===== */
function fmtData(s) { const [y, m, d] = s.split('-'); return d + '/' + m + '/' + y; } // "2026-10-22" -> "22/10/2026"

function padraoPeriodo() {                               // período inicial: do dia 1 do mês até hoje
  if ($('rDe').value && $('rAte').value) return;         // não mexe se o usuário já escolheu
  $('rDe').value = hoje().slice(0, 8) + '01';            // slice(0,8) pega "AAAA-MM-" e junta "01"
  $('rAte').value = hoje();
}

function gerarRelatorio() {
  const tipo = $('rTipo').value;                         // 'atividades', 'usuarios' ou 'status'
  const de = $('rDe').value, ate = $('rAte').value, base = $('rBase').value; // base: 'prazo' ou 'criada'
  if (de > ate) { alert('A data inicial não pode ser depois da data final.'); return false; }
  // atividades cuja data (prazo ou criação) está dentro do período, em ordem de data
  const dentro = d => d && d >= de && d <= ate;          // a data existe e está dentro do período?
  const chave = t => (base === 'prazo' || base === 'criada') ? (t[base] || '') : (t.prazo || t.criada || ''); // data usada para ordenar
  const sitF = $('rSit').value;                          // situação escolhida: 'todas', 'todo', 'doing', 'done' ou 'atrasada'
  const atrasada = t => t.status !== 'done' && t.prazo && t.prazo < hoje(); // atrasada = não concluída e prazo vencido
  const lista = tarefas
    .filter(t => base === 'todas' ||                       // 'todas': não filtra por data
      (base === 'any' ? dentro(t.prazo) || dentro(t.criada) : dentro(t[base]))) // datas AAAA-MM-DD comparam como texto
    .filter(t => sitF === 'todas' || (sitF === 'atrasada' ? atrasada(t) : t.status === sitF)) // filtro de situação
    .sort((a, b) => chave(a).localeCompare(chave(b)));
  const qtd = k => lista.filter(t => t.status === k).length;  // quantidade por etapa
  const feitas = qtd('done');
  const fd = d => d ? fmtData(d) : '—';                  // data formatada ou traço
  const sit = t => STATUS.find(x => x.k === t.status).nome + (atrasada(t) ? ' (atrasada)' : ''); // situação da atividade

  function tabela(cabecalho, linhas) {                   // monta uma tabela a partir de títulos e linhas
    const tb = el('table'), cab = el('tr');
    cabecalho.forEach(h => cab.appendChild(el('th', null, h)));
    tb.appendChild(cab);
    linhas.forEach(l => {
      const tr = el('tr');
      l.forEach(v => tr.appendChild(el('td', null, v)));
      tb.appendChild(tr);
    });
    return tb;
  }

  const titulos = { atividades: 'Relatório de atividades e status', usuarios: 'Relatório de usuários', status: 'Relatório por status' };
  const r = $('relCorpo'); r.replaceChildren();
  r.appendChild(el('h2', null, titulos[tipo]));
  r.appendChild(el('p', 'rinfo', base === 'todas' ? 'Período: todas as atividades' :
    'Período: ' + fmtData(de) + ' a ' + fmtData(ate) + ' (' + $('rBase').selectedOptions[0].text.toLowerCase() + ')'));
  if (sitF !== 'todas') r.appendChild(el('p', 'rinfo', 'Situação: ' + $('rSit').selectedOptions[0].text)); // mostra o filtro usado
  r.appendChild(el('p', 'rinfo', 'Conta: ' + conta + ' • Gerado em ' + fmtData(hoje())));

  const resumo = el('div', 'resumo');                    // quadro de totais (todos os tipos)
  [['Total', lista.length], ['A fazer', qtd('todo')], ['Em andamento', qtd('doing')],
   ['Concluídas', feitas], ['Atrasadas', lista.filter(atrasada).length],
   ['Concluído', (lista.length ? Math.round(feitas / lista.length * 100) : 0) + '%']
  ].forEach(([nome, v]) => {
    const b = el('div', 'rbox'); b.appendChild(el('b', null, v)); b.appendChild(el('span', null, nome));
    resumo.appendChild(b);
  });
  r.appendChild(resumo);

  if (!lista.length && tipo !== 'usuarios') {
    r.appendChild(el('p', null, 'Nenhuma atividade neste período.'));

  } else if (tipo === 'atividades') {                    // --- uma linha por atividade, com a situação de cada uma ---
    r.appendChild(tabela(['Atividade', 'Categoria', 'Responsável', 'Criada', 'Prazo', 'Situação'],
      lista.map(t => [t.titulo, t.cat, nomeUsuario(t.resp) || '—', fd(t.criada), fd(t.prazo), sit(t)])));

  } else if (tipo === 'usuarios') {                      // --- resumo e atividades de cada usuário ---
    const grupos = usuarios.map(u => ({ nome: u.nome, itens: lista.filter(t => t.resp === u.id) }));
    const sem = lista.filter(t => !nomeUsuario(t.resp)); // atividades sem responsável
    if (sem.length) grupos.push({ nome: 'Sem responsável', itens: sem });
    if (!grupos.length) { r.appendChild(el('p', null, 'Nenhum usuário cadastrado.')); }
    else {
      r.appendChild(el('h3', null, 'Resumo por usuário'));
      r.appendChild(tabela(['Usuário', 'Total', 'A fazer', 'Em andamento', 'Concluídas', 'Atrasadas'],
        grupos.map(g => [g.nome, g.itens.length, ...STATUS.map(s => g.itens.filter(t => t.status === s.k).length), g.itens.filter(atrasada).length])));
      grupos.forEach(g => {                              // detalhe de cada usuário que tem atividades
        if (!g.itens.length) return;
        r.appendChild(el('h3', null, g.nome));
        r.appendChild(tabela(['Atividade', 'Categoria', 'Prazo', 'Situação'],
          g.itens.map(t => [t.titulo, t.cat, fd(t.prazo), sit(t)])));
      });
    }

  } else {                                               // --- atividades agrupadas por status ---
    STATUS.forEach(s => {
      const it = lista.filter(t => t.status === s.k);
      r.appendChild(el('h3', null, s.nome + ' (' + it.length + ')'));
      if (!it.length) r.appendChild(el('p', 'rinfo', 'Nenhuma atividade.'));
      else r.appendChild(tabela(['Atividade', 'Categoria', 'Responsável', 'Prazo'],
        it.map(t => [t.titulo, t.cat, nomeUsuario(t.resp) || '—', fd(t.prazo)])));
    });
  }
  $('relatorio').hidden = false;                         // mostra o relatório
  $('relatorio').scrollIntoView({ behavior: 'smooth' });
  return true;                                           // true = relatório gerado com sucesso
}
$('fr').addEventListener('submit', e => { e.preventDefault(); gerarRelatorio(); }); // botão "Gerar relatório"
$('imprimir').onclick = () => window.print();            // abre a janela de impressão do navegador
$('fechaRel').onclick = () => { $('relatorio').hidden = true; };
$('rImprimir').onclick = () => {                         // "Gerar e imprimir": faz os dois passos de uma vez
  if (!$('fr').reportValidity()) return;                 // confere se as datas foram preenchidas
  if (gerarRelatorio()) setTimeout(() => window.print(), 150); // espera a tela atualizar e abre a impressão
};

/* ===== LOGIN: CONTAS, SENHA E SESSÃO ===== */
let modoCadastro = false;   // false = tela "Entrar"; true = tela "Criar conta"
let falhas = 0, bloqueadoAte = 0; // controle simples de tentativas erradas

function hex(buf) {                                      // converte bytes em texto hexadecimal
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function gerarHash(senha, salt) {                  // transforma a senha em um código irreversível (hash)
  const dados = new TextEncoder().encode(senha);
  if (window.crypto && crypto.subtle) {                  // PBKDF2: método próprio para senhas, com 100.000 repetições
    const chave = await crypto.subtle.importKey('raw', dados, 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 100000 }, chave, 256);
    return hex(bits);
  }
  let h = 5381;                                          // alternativa fraca, se o navegador não tiver crypto.subtle
  for (const b of new TextEncoder().encode(salt + senha)) h = ((h << 5) + h + b) >>> 0;
  return 'f' + h.toString(16);
}
function novoSalt() {                                    // "sal": texto aleatório único de cada conta
  return hex(crypto.getRandomValues(new Uint8Array(16)));
}

function setModo(cadastro) {                             // alterna entre Entrar e Criar conta
  modoCadastro = cadastro;
  $('loginTitulo').textContent = cadastro ? 'Criar conta' : 'Entrar';
  $('lBtn').textContent = cadastro ? 'Criar conta' : 'Entrar';
  $('lTroca').textContent = cadastro ? 'Já tenho conta' : 'Criar uma conta';
  $('lConfLabel').hidden = !cadastro;                    // mostra "Confirmar senha" só ao criar
  $('lConf').required = cadastro;
  $('lPass').autocomplete = cadastro ? 'new-password' : 'current-password';
  $('loginMsg').textContent = '';
}
function msg(t) { $('loginMsg').textContent = t; }       // mostra mensagem na tela de login

function entrar(usuario) {                               // libera o sistema para a conta
  conta = usuario;
  try { sessionStorage.setItem('sessao', usuario); } catch (e) {} // sessão dura até fechar a aba
  tarefas = ler('atividades:' + conta);                  // carrega os dados desta conta
  usuarios = ler('usuarios:' + conta);
  $('quem').textContent = 'Conta: ' + conta;
  $('login').hidden = true;                              // esconde o login
  $('app').hidden = false; padraoPeriodo();                               // mostra o sistema
  render();
}
function sair() {                                        // encerra a sessão
  try { sessionStorage.removeItem('sessao'); } catch (e) {}
  conta = null; tarefas = []; usuarios = [];             // tira os dados da memória
  resetAtiv(); resetUsuario();
  $('fl').reset();
  $('app').hidden = true; $('relatorio').hidden = true;
  $('login').hidden = false;
  setModo(ler('contas').length === 0);                   // sem nenhuma conta: já abre em "Criar conta"
}

$('lTroca').onclick = () => setModo(!modoCadastro);
$('sair').onclick = sair;

$('fl').addEventListener('submit', async e => {         // ao enviar o formulário de login
  e.preventDefault();
  const usuario = $('lUser').value.trim().toLowerCase(); // ignora maiúsculas/minúsculas
  const senha = $('lPass').value;
  const contas = ler('contas');
  if (Date.now() < bloqueadoAte) { msg('Muitas tentativas. Aguarde alguns segundos.'); return; }

  if (modoCadastro) {                                    // --- CRIAR CONTA ---
    if (usuario.length < 3) return msg('O usuário precisa ter pelo menos 3 caracteres.');
    if (senha.length < 6) return msg('A senha precisa ter pelo menos 6 caracteres.');
    if (senha !== $('lConf').value) return msg('As senhas não são iguais.');
    if (contas.some(c => c.usuario === usuario)) return msg('Esse usuário já existe.');
    const salt = novoSalt();
    contas.push({ usuario, salt, hash: await gerarHash(senha, salt) }); // guarda só o hash, nunca a senha
    if (contas.length === 1) {                           // 1ª conta: herda os dados criados antes do login
      ['atividades', 'usuarios'].forEach(k => {
        try { const v = localStorage.getItem(k); if (v) localStorage.setItem(k + ':' + usuario, v); } catch (er) {}
      });
    }
    try { localStorage.setItem('contas', JSON.stringify(contas)); } catch (er) { return msg('Não foi possível salvar a conta.'); }
    entrar(usuario);
  } else {                                               // --- ENTRAR ---
    const c = contas.find(x => x.usuario === usuario);
    const ok = c && (await gerarHash(senha, c.salt)) === c.hash; // compara o hash digitado com o salvo
    if (!ok) {
      falhas++;
      if (falhas >= 5) { bloqueadoAte = Date.now() + 30000; falhas = 0; } // 5 erros: espera 30 segundos
      return msg('Usuário ou senha incorretos.');        // mensagem igual nos dois casos, para não revelar qual errou
    }
    falhas = 0;
    entrar(usuario);
  }
  $('fl').reset();
});

/* ===== INÍCIO ===== */
(function iniciar() {                                    // roda uma vez ao abrir a página
  let s = null;
  try { s = sessionStorage.getItem('sessao'); } catch (e) {}
  if (s && ler('contas').some(c => c.usuario === s)) entrar(s); // sessão ainda válida: entra direto
  else setModo(ler('contas').length === 0);              // senão mostra o login
})();
