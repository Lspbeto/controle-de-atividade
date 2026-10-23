/* =====================================================================
   CONTROLE DE ATIVIDADES - script.js (todos os comandos explicados)
   ===================================================================== */

/* ---------- 1. ATALHOS E CONSTANTES ---------- */
const $ = s => document.querySelector(s);   // atalho: $("#id") em vez de document.querySelector("#id")
const CATS = ["Manutenção", "Limpeza", "Produção", "Administrativo", "Outros"]; // tipos de atividade (edite à vontade)
const COLS = [                               // as 3 colunas do quadro, na ordem do fluxo
  { k: "todo",  n: "A fazer" },             // k = código interno, n = nome mostrado na tela
  { k: "doing", n: "Em andamento" },
  { k: "done",  n: "Concluídas" }
];
const ST = { todo: "A fazer", doing: "Em andamento", done: "Concluída", atrasadas: "Atrasadas" }; // código -> texto
const hoje = () => new Date().toLocaleDateString("sv");   // data de hoje no formato AAAA-MM-DD (bom para comparar)
const agora = () => new Date().toLocaleString("pt-BR");   // data e hora para o histórico, ex.: 23/10/2026 14:05:10
const dbr = d => d ? d.split("-").reverse().join("/") : "—"; // "2026-10-23" -> "23/10/2026"; vazio vira "—"
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6); // id único para cada registro
const esc = s => String(s ?? "").replace(/[&<>"']/g,          // "escapa" texto antes de usar em innerHTML,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); // evitando injeção de HTML (XSS)
const late = t => t.st !== "done" && t.prazo && t.prazo < hoje(); // atrasada = não concluída e prazo já passou

/* ---------- 2. DADOS (guardados no localStorage do navegador) ---------- */
let db = (() => {                            // db = banco de dados: { contas, resp, tarefas }
  try {
    const d = JSON.parse(localStorage.getItem("ativ_db")); // lê o texto salvo e transforma em objeto
    if (d && d.contas) return d;             // se existir e for válido, usa
  } catch {}                                 // se o texto estiver corrompido, ignora o erro
  return { contas: [], resp: [], tarefas: [] }; // senão começa vazio
})();
let me = null;                               // conta logada no momento (null = ninguém)
let filtro = "todas";                        // filtro ativo do quadro
const save = () => localStorage.setItem("ativ_db", JSON.stringify(db)); // grava o banco inteiro
const isAdm = () => me && me.p === "admin";  // true se quem está logado é administrador
const rn = id => (db.resp.find(r => r.id === id) || {}).nome || "—"; // id do responsável -> nome

/* ---------- 3. IDENTIFICAÇÃO DO PERFIL (usada no relatório) ---------- */
// Devolve "Administrador" ou "Operador" de uma movimentação.
// Usa o perfil gravado NA HORA da movimentação; se não existir, procura na lista de contas.
const perfilDe = x => {
  const p = x.perfil || (db.contas.find(c => c.u === x.por) || {}).p; // perfil gravado ou perfil atual da conta
  return p === "admin" ? "Administrador" : p ? "Operador" : "Conta removida";
};
const quem = x => `${esc(x.por)} (${perfilDe(x)})`; // texto final: "maria (Operador)"

/* ---------- 4. SENHA (nunca guardada em texto puro) ---------- */
async function hash(u, p) {                  // transforma usuário+senha em um código irreversível (SHA-256)
  const s = "ativ|" + u + "|" + p;           // mistura um prefixo e o usuário (salt) com a senha
  if (window.crypto && crypto.subtle) {      // crypto.subtle só existe em localhost/HTTPS/arquivo local
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); // calcula o hash
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); // bytes -> texto hexadecimal
  }
  return btoa(unescape(encodeURIComponent(s))); // alternativa fraca se o navegador não tiver crypto.subtle
}

/* ---------- 5. INÍCIO E LOGIN ---------- */
(async () => {                               // função que roda sozinha ao abrir a página
  const dh = await hash("admin", "admin123"); // hash da senha padrão
  if (!db.contas.length) {                   // primeira vez: não há nenhuma conta
    db.contas.push({ u: "admin", h: dh, p: "admin" }); // cria o administrador padrão (u=usuário, h=hash, p=perfil)
    save();
  }
  $("#dica").hidden = !db.contas.some(c => c.u === "admin" && c.h === dh); // mostra a dica só enquanto a senha for a padrão
  const c = db.contas.find(x => x.u === sessionStorage.getItem("ativ_u")); // há sessão aberta nesta aba?
  c ? entrar(c) : ($("#login").hidden = false); // sim: entra direto; não: mostra o login
})();

$("#fl").onsubmit = async e => {             // ao enviar o formulário de login
  e.preventDefault();                        // impede o navegador de recarregar a página
  const u = $("#lu").value.trim(), h = await hash(u, $("#lp").value); // usuário digitado e hash da senha
  const c = db.contas.find(x => x.u === u && x.h === h); // procura conta com usuário E senha iguais
  if (!c) { $("#loginMsg").textContent = "Usuário ou senha inválidos."; return; } // não achou: avisa e para
  $("#loginMsg").textContent = ""; $("#fl").reset(); // limpa mensagem e campos
  sessionStorage.setItem("ativ_u", u);       // lembra o login enquanto a aba estiver aberta
  entrar(c);
};
$("#sair").onclick = () => { sessionStorage.removeItem("ativ_u"); location.reload(); }; // Sair: apaga a sessão e recarrega

function entrar(c) {                         // prepara a tela para a conta que entrou
  me = c;
  $("#login").hidden = true; $("#app").hidden = false; // esconde login, mostra o sistema
  document.body.classList.toggle("op", c.p !== "admin"); // operador recebe a classe "op" (o CSS esconde tudo com classe "adm")
  $("#quem").textContent = c.u + " (" + (c.p === "admin" ? "Administrador" : "Operador") + ")"; // "Conta: maria (Operador)"
  $("#fcat").innerHTML = CATS.map(x => `<option>${x}</option>`).join(""); // preenche o seletor de tipo do formulário
  $("#rt").innerHTML = `<option value="">Todos os tipos</option>` + CATS.map(x => `<option>${x}</option>`).join(""); // e o do relatório
  draw();
}

/* ---------- 6. DESENHO DA TELA ---------- */
function card(t) {                           // monta o HTML de um cartão de atividade
  const i = COLS.findIndex(c => c.k === t.st); // posição da coluna atual (0, 1 ou 2)
  return `<article class="card ${t.st === "done" ? "done" : ""}"><p>${esc(t.t)}</p>
    <div class="meta"><span class="tag">${esc(t.cat)}</span><span class="tag ${late(t) ? "late" : ""}">Prazo: ${dbr(t.prazo)}</span><span class="tag">Resp.: ${esc(rn(t.resp))}</span></div>
    <div class="acts">${i > 0 ? `<button data-m="${t.id}" data-d="-1">← ${COLS[i - 1].n}</button>` : ""}${i < 2 ? `<button data-m="${t.id}" data-d="1">${COLS[i + 1].n} →</button>` : ""}<button class="del adm" data-x="${t.id}">Excluir</button></div></article>`;
  // data-m = id da atividade a mover; data-d = direção (-1 volta, 1 avança); data-x = id a excluir (só admin vê)
}

function draw() {                            // redesenha TUDO; é chamada após qualquer mudança
  const T = db.tarefas, n = k => T.filter(t => t.st === k).length, tot = T.length || 1; // n("done") = qtde concluídas
  $("#pct").textContent = Math.round(n("done") / tot * 100) + "%"; // porcentagem concluída
  $("#bd").style.width = n("done") / tot * 100 + "%";  // trecho verde da barra
  $("#bg").style.width = n("doing") / tot * 100 + "%"; // trecho amarelo da barra

  $("#chips").innerHTML = ["todas", "atrasadas", ...CATS].map(f => // botões de filtro
    `<button class="chip" data-f="${f}" aria-pressed="${f === filtro}">${f === "todas" ? "Todas" : f === "atrasadas" ? "Atrasadas" : f}</button>`).join("");

  const ok = t => filtro === "todas" || (filtro === "atrasadas" ? late(t) : t.cat === filtro); // a atividade passa no filtro?
  $("#board").innerHTML = COLS.map(c => {    // monta cada coluna
    const L = T.filter(t => t.st === c.k && ok(t)); // atividades desta coluna
    return `<section class="col" style="--c:var(--${c.k})"><h2>${c.n}<span>${L.length}</span></h2>${L.map(card).join("") || '<div class="empty">Nenhuma atividade.</div>'}</section>`;
  }).join("");

  const v = $("#fresp").value;               // guarda o responsável escolhido no formulário
  $("#fresp").innerHTML = `<option value="">Sem responsável</option>` + db.resp.map(r => `<option value="${r.id}">${esc(r.nome)}</option>`).join("");
  $("#fresp").value = v;                     // restaura a escolha após redesenhar

  $("#ul").innerHTML = db.resp.map(r => `<li><span>${esc(r.nome)}</span><span class="n">${T.filter(t => t.resp === r.id).length} ativ.</span><button class="del" data-r="${r.id}">Excluir</button></li>`).join(""); // lista de responsáveis
  $("#cl").innerHTML = db.contas.map(c => `<li><span>${esc(c.u)}</span><span class="n">${c.p === "admin" ? "Administrador" : "Operador"}</span>${c.u !== me.u ? `<button class="del" data-c="${esc(c.u)}">Excluir</button>` : ""}</li>`).join(""); // lista de contas (não deixa excluir a própria)
}

/* ---------- 7. ATIVIDADES ---------- */
$("#f").onsubmit = e => {                    // formulário "Nova atividade"
  e.preventDefault();
  const t = $("#ft").value.trim(); if (!t) return; // título vazio: ignora
  db.tarefas.push({
    id: uid(), t,                            // id e título
    cat: $("#fcat").value, prazo: $("#fp").value, resp: $("#fresp").value, // tipo, prazo e responsável
    st: "todo", criada: hoje(), fim: null,   // começa em "A fazer"; fim = data da conclusão
    hist: [{ em: agora(), por: me.u, perfil: me.p, de: null, para: "todo" }] // 1º registro: QUEM criou e com qual perfil
  });
  save(); e.target.reset(); draw();
};

$("#board").onclick = e => {                 // um único "ouvinte" para todos os botões do quadro
  const b = e.target.closest("button"); if (!b) return; // clicou em algo que não é botão: ignora
  const t = db.tarefas.find(x => x.id === (b.dataset.m || b.dataset.x)); if (!t) return; // acha a atividade pelo id
  if (b.dataset.x) {                         // botão Excluir
    if (isAdm() && confirm("Excluir esta atividade?")) { db.tarefas = db.tarefas.filter(x => x !== t); save(); draw(); }
    return;
  }
  const para = COLS[COLS.findIndex(c => c.k === t.st) + +b.dataset.d].k; // coluna de destino (atual + direção)
  t.hist.push({ em: agora(), por: me.u, perfil: me.p, de: t.st, para }); // registra QUEM movimentou, o perfil, quando, de onde e para onde
  t.st = para;                               // muda a atividade de coluna
  t.fim = para === "done" ? hoje() : null;   // concluída: guarda a data; reaberta: limpa
  save(); draw();
};

$("#chips").onclick = e => { const b = e.target.closest("button"); if (b) { filtro = b.dataset.f; draw(); } }; // clicar num filtro
$("#limpa").onclick = () => {                // Limpar concluídas (só admin)
  if (isAdm() && confirm("Apagar todas as atividades concluídas? Elas sairão dos relatórios.")) {
    db.tarefas = db.tarefas.filter(t => t.st !== "done"); save(); draw();
  }
};

/* ---------- 8. RESPONSÁVEIS E CONTAS (só administrador) ---------- */
$("#fu").onsubmit = e => {                   // adicionar responsável
  e.preventDefault(); if (!isAdm()) return;  // operador não pode
  const nome = $("#un").value.trim();
  if (db.resp.some(r => r.nome.toLowerCase() === nome.toLowerCase())) { alert("Responsável já cadastrado."); return; }
  db.resp.push({ id: uid(), nome }); save(); e.target.reset(); draw();
};
$("#ul").onclick = e => {                    // excluir responsável
  const id = e.target.dataset.r; if (!id || !isAdm()) return;
  if (db.tarefas.some(t => t.resp === id)) { alert("Este responsável possui atividades e não pode ser excluído."); return; }
  db.resp = db.resp.filter(r => r.id !== id); save(); draw();
};

$("#fc").onsubmit = async e => {             // criar ou atualizar conta
  e.preventDefault(); if (!isAdm()) return;
  const u = $("#cu").value.trim(), p = $("#cperf").value, h = await hash(u, $("#cp").value); // usuário, perfil e hash da senha
  const c = db.contas.find(x => x.u === u);  // já existe esse usuário?
  if (c) {                                   // sim: atualiza senha e perfil
    if (c.p === "admin" && p !== "admin" && db.contas.filter(x => x.p === "admin").length === 1) { alert("É preciso manter ao menos um administrador."); return; }
    c.h = h; c.p = p;
  } else db.contas.push({ u, h, p });        // não: cria conta nova
  save(); e.target.reset(); draw();
};
$("#cl").onclick = e => {                    // excluir conta
  const u = e.target.dataset.c; if (!u || !isAdm() || !confirm("Excluir a conta " + u + "?")) return;
  db.contas = db.contas.filter(c => c.u !== u); save(); draw();
};

/* ---------- 9. RELATÓRIO ---------- */
function gerar() {
  const tp = $("#rt").value, d = $("#rd").value, a = $("#ra").value, b = $("#rb").value, s = $("#rs").value, h = $("#rh").checked; // lê os filtros
  if (d && a && d > a) { alert("A data inicial (De) é maior que a final (Até)."); return false; } // período inválido: avisa e para
  const inP = z => (!d || z >= d) && (!a || z <= a);   // a data z está dentro do período De/Até?
  const dEm = x => x.em.slice(0, 10).split("/").reverse().join("-"); // "23/10/2026, 14:05" -> "2026-10-23"
  const L = db.tarefas.filter(t =>           // L = atividades que passam em todos os filtros:
    (!tp || t.cat === tp) &&                 //   tipo
    (!s || (s === "atrasadas" ? late(t) : t.st === s)) && //   situação
    ((!d && !a) || (b === "mov" ? t.hist.some(x => inP(dEm(x))) : t[b] && inP(t[b])))); //   período: "mov" = teve alguma movimentação no período; senão usa a data escolhida
  const cnt = k => L.filter(t => t.st === k).length; // conta por situação
  const box = (n, l) => `<div class="rbox"><b>${n}</b><span>${l}</span></div>`; // caixinha de total
  const movs = L.flatMap(t => t.hist).filter(x => b !== "mov" || inP(dEm(x))); // movimentações das atividades filtradas (só as do período, se "Movimentação")
  const porPerfil = p => movs.filter(x => perfilDe(x) === p).length; // quantas foram feitas por cada perfil

  let H = `<div class="acoes"><button class="primary" id="rimp">Imprimir</button><button class="sec" id="rfech">Fechar</button></div>
    <h2>Relatório de Atividades</h2>
    <p class="rinfo">Gerado em ${agora()} por ${quem({ por: me.u, perfil: me.p })} · Tipo: ${tp || "todos"} · ${{ mov: "Movimentação", criada: "Criação", prazo: "Prazo", fim: "Conclusão" }[b]}: ${d || a ? (d ? dbr(d) : "início") + " a " + (a ? dbr(a) : "sem limite") : "todo o período"} · Situação: ${s ? ST[s] : "todas"}</p>
    <div class="resumo">${box(L.length, "Total")}${box(cnt("todo"), "A fazer")}${box(cnt("doing"), "Em andamento")}${box(cnt("done"), "Concluídas")}${box(L.filter(late).length, "Atrasadas")}${box(porPerfil("Administrador"), "Mov. do Administrador")}${box(porPerfil("Operador"), "Mov. de Operadores")}</div>`;

  CATS.forEach(cat => {                      // uma tabela por tipo de atividade
    const G = L.filter(t => t.cat === cat); if (!G.length) return; // sem atividades neste tipo: pula
    H += `<h3>${cat} (${G.length})</h3><table><thead><tr><th>Atividade</th><th>Quem fez (responsável)</th><th>Situação</th><th>Prazo</th><th>Concluída em / por</th><th>Última movimentação (quem · perfil · quando)</th>${h ? "<th>Histórico de quem movimentou</th>" : ""}</tr></thead><tbody>`;
    G.forEach(t => {
      const u = t.hist[t.hist.length - 1];   // última movimentação
      const f = [...t.hist].reverse().find(x => x.para === "done"); // movimentação que concluiu (a mais recente)
      H += `<tr><td>${esc(t.t)}</td><td>${esc(rn(t.resp))}</td><td>${ST[t.st]}${late(t) ? " (atrasada)" : ""}</td><td>${dbr(t.prazo)}</td>` +
        `<td>${t.fim && f ? dbr(t.fim) + " por " + quem(f) : "—"}</td><td>${quem(u)} · ${u.em}</td>` +
        (h ? `<td>${t.hist.map(x => `${x.em} — ${quem(x)}: ${x.de ? ST[x.de] + " → " : "criou em "}${ST[x.para]}`).join("<br>")}</td>` : "") + `</tr>`; // histórico completo, cada linha com o perfil
    });
    H += `</tbody></table>`;
  });
  if (!L.length) H += `<p class="rinfo">Nenhuma atividade encontrada com esses filtros.</p>`;

  $("#relatorio").innerHTML = H; $("#relatorio").hidden = false; // mostra o relatório
  $("#rimp").onclick = () => print();        // botão Imprimir abre a janela de impressão
  $("#rfech").onclick = () => ($("#relatorio").hidden = true); // botão Fechar
  $("#relatorio").scrollIntoView({ behavior: "smooth" }); // rola a página até o relatório
  return true;                               // deu certo (quem chamou pode imprimir)
}

/* ---------- 10. IMPRESSÃO RÁPIDA POR PERÍODO ---------- */
const iso = dt => dt.toLocaleDateString("sv");        // objeto Date -> "AAAA-MM-DD"
function periodo(p) {                        // preenche os campos De/Até conforme o botão clicado
  const t = new Date(), y = t.getFullYear(), m = t.getMonth(); // hoje, ano e mês (0 = janeiro)
  let i = new Date(t), f = new Date(t);      // início e fim começam em hoje
  if (p === "semana") { i.setDate(t.getDate() - t.getDay()); f = new Date(i); f.setDate(i.getDate() + 6); } // domingo a sábado
  if (p === "mes")    { i = new Date(y, m, 1);     f = new Date(y, m + 1, 0); } // dia 1 ao último dia do mês
  if (p === "mesant") { i = new Date(y, m - 1, 1); f = new Date(y, m, 0); }     // mês anterior inteiro
  $("#rd").value = iso(i); $("#ra").value = iso(f);
}
document.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { // cada botão "Imprimir hoje/semana/mês..."
  periodo(b.dataset.p);                      // 1) preenche o período
  if (gerar()) print();                      // 2) gera o relatório e 3) imprime
});
$("#fr").onsubmit = e => { e.preventDefault(); gerar(); };      // "Gerar relatório"
$("#rp").onclick = () => { if (gerar()) print(); };                 // "Imprimir direto": gera e já imprime
