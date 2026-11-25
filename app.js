// My Farm: screens and routing. All data goes through store.js, all numbers through calc.js.
import * as store from "./store.js";
import * as calc from "./calc.js";

const app = document.getElementById("app");
const toastEl = document.getElementById("toast");
const tabbar = document.getElementById("tabbar");

export const ICONS = {
  egg: '<svg viewBox="0 0 32 32" aria-hidden="true"><ellipse cx="16" cy="18" rx="9" ry="11" fill="#fdf6e6" stroke="#6b6553" stroke-width="1.6"/></svg>',
  fig: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 29c-6 0-10-5-10-11 0-5 4-9 10-9s10 4 10 9c0 6-4 11-10 11z" fill="#6b3f6e"/><path d="M16 9c0-3 2-5 5-5" stroke="#4a5d23" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  chick: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="18" r="9" fill="#f6d365"/><circle cx="13" cy="16" r="1.6" fill="#2a2a20"/><path d="M22 19l5 2-5 2z" fill="#a86a10"/><path d="M16 9c0-3 1-5 3-6" stroke="#a86a10" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  move: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="12" cy="18" r="7" fill="#f6d365"/><path d="M20 18h8M24 14l4 4-4 4" stroke="#4a5d23" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  feed: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 10h14l-1.5 18h-11z" fill="#c9a227" stroke="#6b6553" stroke-width="1.6"/><path d="M9 10c0-3 3-5 7-5s7 2 7 5" fill="none" stroke="#6b6553" stroke-width="1.6"/><path d="M13 17h6M13 21h6" stroke="#6b6553" stroke-width="1.4"/></svg>',
  scale: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="7" width="22" height="19" rx="4" fill="#e7ecd8" stroke="#4a5d23" stroke-width="1.6"/><circle cx="16" cy="15" r="4.5" fill="#fffdf8" stroke="#4a5d23" stroke-width="1.6"/><path d="M16 15l2.5-2" stroke="#a83a2a" stroke-width="1.6" stroke-linecap="round"/></svg>',
  coin: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="10" fill="#f6d365" stroke="#a86a10" stroke-width="1.6"/><path d="M16 10v12M13 13h5a2.5 2.5 0 010 5h-4" stroke="#a86a10" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
  house: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 16L16 6l11 10" fill="none" stroke="#4a5d23" stroke-width="2.2" stroke-linejoin="round"/><path d="M8 15v11h16V15" fill="#e7ecd8" stroke="#4a5d23" stroke-width="1.6"/></svg>',
  cross: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="10" fill="#fbe3de"/><path d="M12 12l8 8M20 12l-8 8" stroke="#a83a2a" stroke-width="2.4" stroke-linecap="round"/></svg>',
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11l8-7 8 7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 10v10h12V10" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  list: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

export function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toastEl.hidden = true; }, 2600);
}

export function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function money(n) {
  return "AED " + (Number(n) || 0).toFixed(2);
}

export function today() {
  return store.localToday();
}

// PLAN §7: a phone notification when the owner opens the app and something is due.
// No push server (that needs a paid Firebase plan), so this only fires while the app is opened.
export async function notifyDue(list) {
  if (!list || !list.length) return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const key = "myfarm-notified-" + today();
  try {
    if (localStorage.getItem(key) === String(list.length)) return;
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification("My Farm", {
      body: list.slice(0, 3).map((r) => r.title).join(" · "),
      icon: "icon-192.png",
      tag: "myfarm-due",
    });
    localStorage.setItem(key, String(list.length));
  } catch (e) {}
}

export function dayMonthYear(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return Number(d) + " " + months[Number(m) - 1] + " " + y;
}

const views = {};

export function view(name, fn) {
  views[name] = fn;
}

function currentRoute() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [first, ...rest] = raw.split("/");
  const name = first === "w" ? "w/" + (rest.shift() || "add") : first || "home";
  return { name, args: rest };
}

// Two renders can overlap (e.g. login sets the hash AND calls render). Only the newest one
// may draw, otherwise the screen shows twice.
let renderSeq = 0;
export async function render() {
  const seq = ++renderSeq;
  const { name, args } = currentRoute();
  const fn = views[name] || views.home;
  app.innerHTML = "";
  let node;
  try {
    node = await fn(...args);
  } catch (err) {
    node = el('<div class="card"><h2>Something went wrong</h2><p class="hint" id="errMsg"></p></div>');
    node.querySelector("#errMsg").textContent = err.message;
  }
  if (seq !== renderSeq) return;
  app.innerHTML = "";
  if (node) app.append(node);
  markTabs(name);
  window.scrollTo(0, 0);
}

function markTabs(name) {
  if (tabbar.hidden) return;
  tabbar.querySelectorAll("a").forEach((a) => {
    if (a.getAttribute("href") === "#/" + name) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

// ---- login and start ----

let me = null;

view("login", async () => {
  const box = el('<div class="stack"></div>');
  box.append(el(`
    <div class="card">
      <h2>Welcome to My Farm</h2>
      <p class="hint">The farm ledger. Choose who is using this phone.</p>
    </div>`));
  if (store.isDemo()) {
    const card = el(`
      <div class="card">
        <h3>Demo mode</h3>
        <p class="hint">No online account yet, so everything stays on this device. Pick a login:</p>
        <button class="btn primary block" data-role="owner" type="button">Owner</button>
        <button class="btn block" data-role="worker" type="button">Worker</button>
      </div>`);
    card.querySelectorAll("[data-role]").forEach((b) => b.addEventListener("click", async () => {
      await doLogin({ role: b.dataset.role });
    }));
    box.append(card);
  } else {
    const card = el(`
      <form class="card stack">
        <h3>Log in</h3>
        <div class="field"><label for="loginEmail">Email</label>
          <input class="input" id="loginEmail" type="email" autocomplete="username" required></div>
        <div class="field"><label for="loginPassword">Password</label>
          <input class="input" id="loginPassword" type="password" autocomplete="current-password" required></div>
        <button class="btn primary block" type="submit">Log in</button>
        <p class="hint" id="loginMsg" aria-live="polite"></p>
      </form>`);
    card.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        await doLogin({ email: card.querySelector("#loginEmail").value.trim(), password: card.querySelector("#loginPassword").value });
      } catch (e) {
        card.querySelector("#loginMsg").textContent = e.message;
      }
    });
    box.append(card);
  }
  return box;
});

async function doLogin(opts) {
  try {
    me = await store.login(opts);
  } catch (e) {
    toast(e.message);
    return;
  }
  enter();
}

function enter() {
  document.getElementById("whoBtn").hidden = false;
  document.getElementById("whoBtn").textContent = me.role === "owner" ? "Owner" : "Worker";
  buildTabs();
  location.hash = me.role === "owner" ? "#/home" : "#/w/add";
  render();
}

function buildTabs() {
  const tabs = me.role === "owner"
    ? [["home", "Home", "home"], ["add", "Add", "plus"], ["entries", "Entries", "list"], ["settings", "Settings", "gear"]]
    : [["w/add", "Add entry", "plus"], ["w/today", "Today", "list"]];
  tabbar.innerHTML = tabs.map(([href, label, icon]) =>
    `<a href="#/${href}">${ICONS[icon]}<span>${label}</span></a>`).join("");
  tabbar.hidden = false;
}

document.getElementById("whoBtn").addEventListener("click", async () => {
  if (!confirm("Log out?")) return;
  await store.logout();
  me = null;
  tabbar.hidden = true;
  document.getElementById("whoBtn").hidden = true;
  location.hash = "#/login";
  render();
});

async function boot() {
  await store.initStore();
  document.getElementById("demoBand").hidden = !store.isDemo();
  me = await store.currentUser();
  if (me) enter();
  else {
    if (!location.hash || location.hash === "#/") location.hash = "#/login";
    render();
  }
}

window.addEventListener("hashchange", render);

// ---- entry types and their small forms ----

const GROUPS = [["A", "Group A"], ["B", "Group B"], ["C", "Group C"]];
const FEEDS = [["starter", "Starter"], ["grower", "Grower"], ["layer", "Layer"]];

export const FORMS = {
  eggs: { title: "Eggs collected", icon: "egg", section: "chickens", fields: [
    { k: "group", l: "Which group", t: "seg", opts: GROUPS, req: true },
    { k: "eggs", l: "How many eggs", t: "number", req: true },
  ] },
  figs: { title: "Figs collected", icon: "fig", section: "figs", fields: [
    { k: "kg", l: "How many kg", t: "number", step: "0.1", req: true },
    { k: "quality", l: "Quality", t: "seg", opts: [["good", "Good"], ["ok", "OK"], ["poor", "Poor"]], req: true },
    { k: "thrown", l: "Kg thrown away", t: "number", step: "0.1" },
  ] },
  born: { title: "Born or hatched", icon: "chick", section: "chicks", fields: [
    { k: "kind", l: "What was born", t: "seg", opts: [["chicks", "Chick batch"], ["rabbits", "Rabbit litter"], ["pigeons", "Young pigeons"]], req: true },
    { k: "count", l: "How many", t: "number", req: true },
  ] },
  moved: { title: "Moved to next stage", icon: "move", section: "chicks", fields: [
    { k: "from", l: "From", t: "seg", opts: [["starter", "Starter"], ["grower", "Grower"], ["youngPigeons", "Young pigeons"]], req: true },
    { k: "to", l: "To", t: "seg", opts: [["grower", "Grower"], ["grown", "Grown"], ["flying", "Flying"]], req: true },
    { k: "males", l: "How many male", t: "number" },
    { k: "females", l: "How many female", t: "number" },
  ] },
  died: { title: "Died", icon: "cross", section: "", fields: [
    { k: "what", l: "Which animal", t: "select", opts: [["A", "Group A"], ["B", "Group B"], ["C", "Group C"], ["chicks", "Chicks"], ["pigeons", "Pigeons"], ["rabbits", "Rabbits"], ["tilapia", "Tilapia"]], req: true },
    { k: "count", l: "How many", t: "number", req: true },
  ] },
  weighed: { title: "Weighed roosters", icon: "scale", section: "chickens", fields: [
    { k: "w1", l: "Bird 1 (kg)", t: "number", step: "0.01" },
    { k: "w2", l: "Bird 2 (kg)", t: "number", step: "0.01" },
    { k: "w3", l: "Bird 3 (kg)", t: "number", step: "0.01" },
    { k: "w4", l: "Bird 4 (kg)", t: "number", step: "0.01" },
  ] },
  bought: { title: "Bought", icon: "feed", section: "", fields: [
    { k: "what", l: "What did you buy", t: "select", req: true, opts: [["starter", "Starter feed"], ["grower", "Grower feed"], ["layer", "Layer feed"], ["roFilters", "RO filters"], ["roChemicals", "RO chemicals"], ["fertilizer", "Fertilizer"], ["spray", "Spray"], ["health", "Health"], ["other", "Other"]] },
    { k: "qty", l: "How many", t: "number", step: "0.1" },
    { k: "price", l: "Price paid", t: "number", step: "0.01", req: true },
  ] },
  openedFeed: { title: "Opened a feed bag", icon: "feed", section: "", fields: [
    { k: "feed", l: "Which feed", t: "seg", opts: FEEDS, req: true },
  ] },
  sold: { title: "Sold", icon: "coin", section: "", fields: [
    { k: "what", l: "What did you sell", t: "select", req: true, opts: [["rooster", "Rooster"], ["pigeon", "Pigeon"], ["rabbit", "Rabbit"], ["tilapia", "Tilapia"], ["eggs", "Eggs"], ["figs", "Figs"]] },
    { k: "count", l: "How many", t: "number", req: true },
    { k: "weightKg", l: "Weight (kg)", t: "number", step: "0.01" },
    { k: "price", l: "Price received", t: "number", step: "0.01", req: true },
    { k: "buyer", l: "Buyer", t: "text" },
  ] },
  home: { title: "Taken for the house", icon: "house", section: "", fields: [
    { k: "what", l: "What", t: "select", req: true, opts: [["eggs", "Eggs"], ["figs", "Figs (kg)"], ["bird", "A chicken"], ["pigeon", "A pigeon"], ["fish", "Fish (kg)"], ["rabbit", "A rabbit"]] },
    { k: "count", l: "How many", t: "number", req: true },
  ] },
  salaryFromSales: { title: "Salary from sales", icon: "coin", section: "", fields: [
    { k: "amount", l: "How much kept", t: "number", step: "0.01", req: true },
  ] },
};

const optLabel = (opts, v) => {
  const hit = (opts || []).find((o) => o[0] === v);
  return hit ? hit[1] : v;
};

export function entryTitle(e) {
  const f = FORMS[e.type];
  const name = f ? f.title : e.type;
  switch (e.type) {
    case "eggs": return name + ": " + e.eggs + " eggs, group " + e.group;
    case "figs": return name + ": " + e.kg + " kg (" + optLabel(FORMS.figs.fields[1].opts, e.quality) + ")";
    case "born": return name + ": " + e.count + " " + optLabel(FORMS.born.fields[0].opts, e.kind).toLowerCase();
    case "moved": return name + ": " + optLabel(FORMS.moved.fields[0].opts, e.from) + " to " + optLabel(FORMS.moved.fields[1].opts, e.to) + (e.males || e.females ? ", " + (e.males || 0) + " male " + (e.females || 0) + " female" : "");
    case "died": return name + ": " + e.count + " " + optLabel(FORMS.died.fields[0].opts, e.what);
    case "weighed": return name + ": " + [e.w1, e.w2, e.w3, e.w4].filter((x) => x).join(", ") + " kg";
    case "bought": return name + ": " + optLabel(FORMS.bought.fields[0].opts, e.what) + (e.qty ? " x" + e.qty : "") + (e.price != null ? ", " + money(e.price) : "");
    case "openedFeed": return name + ": " + optLabel(FEEDS, e.feed);
    case "sold": return name + ": " + e.count + " " + optLabel(FORMS.sold.fields[0].opts, e.what) + (e.price != null ? ", " + money(e.price) : "");
    case "home": return name + ": " + e.count + " " + optLabel(FORMS.home.fields[0].opts, e.what);
    case "salaryFromSales": return name + (e.amount != null ? ": " + money(e.amount) : "");
    case "bill": return name + ": " + optLabel(FORMS.bill.fields[0].opts, e.kind) + ", " + money(e.amount);
    case "salaryPaid": return name + ": " + money(e.amount);
    case "spentBefore": return name + ": " + optLabel(FORMS.spentBefore.fields[0].opts, e.section) + ", " + money(e.amount);
    case "oldSpend": return name + ": " + (e.what || "old equipment") + ", " + money(e.amount);
    case "health": return name + ": " + optLabel(FORMS.health.fields[0].opts, e.group) + ", " + e.what + (e.cost != null ? ", " + money(e.cost) : "");
    case "incubatorBatch": return name + ": " + e.eggs + " eggs from group " + e.group + (e.clear ? ", " + e.clear + " clear" : "");
    default: return name;
  }
}

// ---- add entry: picture tiles and the small forms ----

let editing = null;

const SECTION_FOR = {
  bought: (v) => (v === "starter" || v === "grower" ? "chicks" : v === "layer" ? "chickens" : v === "fertilizer" || v === "spray" ? "figs" : v === "roFilters" || v === "roChemicals" ? "figs" : "farm"),
  sold: (v) => ({ rooster: "chicks", eggs: "chickens", pigeon: "pigeons", rabbit: "rabbits", tilapia: "tilapia", figs: "figs" }[v] || "farm"),
  died: (v) => ({ A: "chickens", B: "chickens", C: "chickens", chicks: "chicks", pigeons: "pigeons", rabbits: "rabbits", tilapia: "tilapia" }[v] || "farm"),
  home: (v) => ({ eggs: "chickens", figs: "figs", bird: "chickens", pigeon: "pigeons", fish: "tilapia", rabbit: "rabbits" }[v] || "farm"),
  health: (v) => ({ A: "chickens", B: "chickens", C: "chickens", chicks: "chicks", pigeons: "pigeons", rabbits: "rabbits" }[v] || "farm"),
};

function tileList() {
  const types = me.role === "owner" ? Object.keys(FORMS) : store.WORKER_TYPES;
  return types.filter((t) => FORMS[t]);
}

async function addScreen(type) {
  if (type) return formScreen(type);
  const box = el('<div class="stack"></div>');
  box.append(el(`<div class="card"><h2>Add entry</h2><p class="hint">Tap a picture. ${me.role === "owner" ? "Everything is here." : "Choose what you want to record."}</p></div>`));
  const grid = el('<div class="tiles"></div>');
  for (const t of tileList()) {
    const f = FORMS[t];
    const b = el(`<button class="tile" type="button">${ICONS[f.icon]}<span>${f.title}</span></button>`);
    b.addEventListener("click", () => { editing = null; location.hash = (me.role === "owner" ? "#/add/" : "#/w/add/") + t; });
    grid.append(b);
  }
  box.append(grid);
  return box;
}

function formScreen(type) {
  const f = FORMS[type];
  if (!f) return el('<div class="card"><p>Unknown entry type.</p></div>');
  const src = editing && editing.type === type ? editing : null;
  const box = el('<div class="stack"></div>');
  const head = el(`
    <div class="card">
      <div class="card-head">
        <button class="btn small quiet" id="backBtn" type="button">${ICONS.back} Back</button>
      </div>
      <h2>${src ? "Fix: " : ""}${f.title}</h2>
    </div>`);
  head.querySelector("#backBtn").addEventListener("click", () => {
    editing = null;
    location.hash = me.role === "owner" ? "#/add" : "#/w/add";
  });
  box.append(head);

  const form = el('<form class="card stack" novalidate></form>');
  for (const fd of f.fields) {
    const wrap = el('<div class="field"></div>');
    const id = "f_" + fd.k;
    wrap.append(el(`<label for="${id}">${fd.l}</label>`));
    if (fd.t === "seg") {
      const seg = el('<div class="seg" role="group"></div>');
      seg.id = id;
      seg.dataset.value = src && src[fd.k] != null ? src[fd.k] : "";
      for (const [v, l] of fd.opts) {
        const b = el(`<button type="button" data-v="${v}">${l}</button>`);
        if (String(seg.dataset.value) === String(v)) b.setAttribute("aria-pressed", "true");
        b.addEventListener("click", () => {
          seg.dataset.value = v;
          seg.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.v === v)));
        });
        seg.append(b);
      }
      wrap.append(seg);
    } else if (fd.t === "select") {
      const sel = el(`<select class="input" id="${id}"></select>`);
      sel.append(el('<option value="">Choose…</option>'));
      for (const [v, l] of fd.opts) {
        const o = el(`<option value="${v}">${l}</option>`);
        if (src && src[fd.k] === v) o.selected = true;
        sel.append(o);
      }
      wrap.append(sel);
    } else {
      const inp = el(`<input class="input" id="${id}" type="${fd.t}" ${fd.step ? `step="${fd.step}"` : ""} ${fd.t === "number" ? 'inputmode="decimal" min="0"' : ""}>`);
      if (src && src[fd.k] != null) inp.value = src[fd.k];
      wrap.append(inp);
    }
    form.append(wrap);
  }
  const dateWrap = el('<div class="field"><label for="f_date">Date</label></div>');
  const dateInp = el('<input class="input" id="f_date" type="date">');
  dateInp.value = src ? src.date : today();
  dateWrap.append(dateInp);
  form.append(dateWrap);
  const noteWrap = el('<div class="field"><label for="f_note">Note (optional)</label></div>');
  const noteInp = el('<input class="input" id="f_note" type="text" maxlength="120">');
  if (src && src.note) noteInp.value = src.note;
  noteWrap.append(noteInp);
  form.append(noteWrap);

  const msg = el('<p class="hint" aria-live="polite"></p>');
  const save = el(`<button class="btn primary block" type="submit">${src ? "Save the fix" : "Save"}</button>`);
  form.append(save, msg);

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    msg.textContent = "";
    const data = {};
    for (const fd of f.fields) {
      if (fd.t === "seg") {
        const v = form.querySelector("#f_" + fd.k).dataset.value;
        if (!v) return (msg.textContent = "Please choose " + fd.l.toLowerCase());
        data[fd.k] = v;
      } else {
        const raw = form.querySelector("#f_" + fd.k).value.trim();
        if (!raw) {
          if (fd.req) return (msg.textContent = "Please fill in " + fd.l.toLowerCase());
          continue;
        }
        data[fd.k] = fd.t === "number" ? Number(raw) : raw;
      }
    }
    if (!dateInp.value) return (msg.textContent = "Please choose a date");
    const entry = { type, ...data, date: dateInp.value, note: noteInp.value.trim() };
    const key = f.fields[0] && SECTION_FOR[type] ? f.fields[0].k : null;
    entry.section = type === "spentBefore" ? data.section : f.section || (key ? SECTION_FOR[type](data[key]) : "farm");
    try {
      save.disabled = true;
      if (src) await store.updateEntry(src.id, entry);
      else await store.addEntry(entry);
      editing = null;
      toast(src ? "Fixed" : "Saved");
      location.hash = me.role === "owner" ? "#/entries" : "#/w/today";
    } catch (e) {
      save.disabled = false;
      msg.textContent = e.message;
    }
  });

  box.append(form);
  return box;
}

view("add", (type) => addScreen(type));
view("w/add", (type) => addScreen(type));

// ---- worker: my entries today ----

function timeOf(iso) {
  const d = new Date(iso);
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

function entryCard(e, opts = {}) {
  const card = el(`
    <div class="card">
      <div class="spread"><h3></h3><span class="hint"></span></div>
      <p class="hint" data-note></p>
      <div class="row" data-actions></div>
    </div>`);
  card.querySelector("h3").textContent = entryTitle(e);
  card.querySelector(".spread .hint").textContent = timeOf(e.at);
  const note = card.querySelector("[data-note]");
  if (e.note) note.textContent = e.note;
  else note.remove();
  const actions = card.querySelector("[data-actions]");
  if (opts.canChange) {
    const edit = el('<button class="btn small" type="button">Fix</button>');
    edit.addEventListener("click", () => {
      editing = e;
      location.hash = (me.role === "owner" ? "#/add/" : "#/w/add/") + e.type;
    });
    const del = el('<button class="btn small danger" type="button">Delete</button>');
    del.addEventListener("click", async () => {
      if (!confirm("Delete this entry?")) return;
      try {
        await store.deleteEntry(e.id);
        toast("Deleted");
        render();
      } catch (err) {
        toast(err.message);
      }
    });
    actions.append(edit, del);
  } else {
    actions.remove();
  }
  return card;
}

view("w/today", async () => {
  const rows = await store.listEntries({ date: today() });
  const box = el('<div class="stack"></div>');
  box.append(el(`<div class="card"><h2>My entries today</h2><p class="hint">${dayMonthYear(today())}. If it is here, it is saved.</p></div>`));
  if (!rows.length) {
    box.append(el('<div class="card sunk"><p>Nothing yet today.</p></div>'));
  } else {
    for (const e of rows) box.append(entryCard(e, { canChange: Date.now() - new Date(e.at).getTime() < store.EDIT_WINDOW_MS }));
  }
  const add = el('<button class="btn primary block" type="button">Add another entry</button>');
  add.addEventListener("click", () => { editing = null; location.hash = "#/w/add"; });
  box.append(add);
  return box;
});

// ---- owner: shared data helpers ----

// "bird" is a whole chicken (priced per bird); fish and figs are entered in kg.
const HOME_PRICE_KEY = { eggs: "egg", figs: "figKg", bird: "chicken", pigeon: "pigeon", fish: "tilapiaKg", rabbit: "rabbit" };

async function loadAll() {
  const [settings, baseSections, entries] = await Promise.all([store.getSettings(), store.getSections(), store.listEntries()]);
  // Counts shown and used everywhere are live: the setup counts plus what was recorded since.
  const sections = calc.liveCounts({ sections: baseSections, entries, sinceMs: settings.countsAtMs });
  return { settings, sections, baseSections, entries };
}

function homePrices(settings) {
  const sp = settings.shopPrices || {};
  const out = {};
  // A price the owner never saved (e.g. "One chicken", added Nov 25) falls back to the default.
  const def = store.DEFAULT_SETTINGS.shopPrices || {};
  for (const [k, key] of Object.entries(HOME_PRICE_KEY)) out[k] = Number(sp[key] ?? def[key]) || 0;
  return out;
}

// Every section shown in totals, plus "Farm general" for shared costs not split to an animal
// (the labour % left over, "other" electricity). It is never saved to the sections doc.
function sectionIds(data) {
  return Object.keys(data.sections).filter((id) => id !== "ducks" && id !== "farm").concat("farm");
}
function sectionName(data, id) {
  return (data.sections[id] && data.sections[id].name) || (id === "farm" ? "Farm general" : id);
}

function allocatedEntries(data) {
  return calc.allocateShared({ entries: data.entries, settings: data.settings, counts: data.sections, now: new Date() });
}

function allStats(data, allocated = allocatedEntries(data)) {
  const prices = homePrices(data.settings);
  return sectionIds(data)
    .map((id) => calc.sectionStats({ entries: allocated, section: id, shopPrices: prices, counts: data.sections[id] }));
}

function thisMonth(entries) {
  const m = today().slice(0, 7);
  return entries.filter((e) => (e.date || "").startsWith(m));
}

function badgeEl(badge) {
  if (!badge) return el('<span class="badge watch" style="visibility:hidden">—</span>');
  return el(`<span class="badge ${badge}">${badge[0].toUpperCase() + badge.slice(1)}</span>`);
}

// ---- owner screen 1: home ----

view("home", async () => {
  const data = await loadAll();
  if (!data.settings.wizardDone) {
    location.hash = "#/setup";
    return el('<div class="card"><p class="hint">Setting up…</p></div>');
  }
  const allocated = allocatedEntries(data);
  const stats = allStats(data, allocated);
  const month = thisMonth(allocated);
  const prices = homePrices(data.settings);
  const monthStats = stats.map((s) => calc.sectionStats({ entries: month, section: s.section, shopPrices: prices, counts: data.sections[s.section] }));
  const startBehind = data.entries.filter((e) => e.type === "spentBefore").reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const profitToDate = stats.reduce((a, s) => a + s.cash, 0);
  const benefit = stats.reduce((a, s) => a + s.benefit, 0);
  const monthCash = monthStats.reduce((a, s) => a + s.cash, 0);
  const steps = calc.goalSteps({ monthCash, profitToDate, startBehind, totalBenefit: benefit });

  const box = el('<div class="stack"></div>');
  if (data.settings.exampleLoaded) {
    box.append(el('<div class="card sunk"><span class="badge example">EXAMPLE</span> <span class="hint">Made-up numbers for a look around. Settings → Load example data replaces them.</span></div>'));
  }
  const goal = el(`
    <div class="card">
      <div class="card-head"><h2>Your goal</h2></div>
      <p class="hint">Tick one at a time. The app tells you when you reach each one.</p>
      <div class="stack" data-steps></div>
    </div>`);
  for (const s of steps) {
    goal.querySelector("[data-steps]").append(el(
      `<div class="spread"><span>${s.done ? "✓" : "○"} ${s.n}. ${s.label}</span><span class="hint">${s.done ? "reached" : "not yet"}</span></div>`
    ));
  }
  box.append(goal);

  const due = calc.reminders({ entries: data.entries, settings: data.settings });
  const alerts = calc.salesBelowMinimum({ entries: data.entries, stats });
  if (alerts.length || due.length) {
    const card = el('<div class="card"><div class="card-head"><h3>Alerts</h3></div><div class="stack" data-alerts></div></div>');
    for (const r of due.slice(0, 6)) {
      card.querySelector("[data-alerts]").append(el(
        `<p><span class="badge ${r.due ? "drop" : "watch"}">${r.due ? "Due" : "Soon"}</span> ${r.title} <span class="hint">${r.detail}</span></p>`
      ));
    }
    for (const a of alerts.slice(0, 6)) {
      card.querySelector("[data-alerts]").append(el(
        `<p><span class="badge drop">Below minimum</span> ${a.entry.count} ${a.entry.what} at ${money(a.each)} each, minimum ${money(a.minimum)} (${dayMonthYear(a.entry.date)})</p>`
      ));
    }
    box.append(card);
  }
  notifyDue(due);

  for (const s of stats) {
    const m = monthStats.find((x) => x.section === s.section);
    const card = el(`
      <a class="card" href="${s.section === "farm" ? "#/summary" : "#/section/" + s.section}" style="text-decoration:none;color:inherit">
        <div class="card-head"><h3></h3><span data-badge></span></div>
        <div class="spread"><span class="hint">Cash this month</span><span class="big-num" data-cash></span></div>
        <p class="hint" data-sub></p>
      </a>`);
    card.querySelector("h3").textContent = sectionName(data, s.section);
    card.querySelector("[data-badge]").replaceWith(badgeEl(s.badge));
    card.querySelector("[data-cash]").textContent = money(m ? m.cash : 0);
    card.querySelector("[data-sub]").textContent = s.entries
      ? "Home value this month " + money(m ? m.home : 0) + " · based on " + s.weeks + " weeks of entries"
      : "No entries yet";
    box.append(card);
  }

  const more = el('<div class="card stack"><h3>More</h3></div>');
  for (const [href, label] of [["#/incubators", "Incubators and batches"], ["#/ducks", "Ducks planning"], ["#/summary", "Monthly summary"], ["#/salary", "Salary"]]) {
    more.append(el(`<a class="btn block" href="${href}">${label}</a>`));
  }
  box.append(more);
  return box;
});


// ---- owner screen 2: one section ----

function countLines(id, sec) {
  if (!sec) return [];
  if (id === "chickens") return Object.entries(sec.groups || {}).map(([g, v]) => {
    const r = v.roosters || 0, h = v.hens || 0;
    return "Group " + g + ": " + r + " rooster" + (r === 1 ? "" : "s") + ", " + h + " hen" + (h === 1 ? "" : "s");
  });
  if (id === "chicks") return ["Starter: " + (sec.starter || 0), "Grower: " + (sec.grower || 0), "Males: " + (sec.males || 0), "Females: " + (sec.females || 0)];
  if (id === "pigeons") return ["Males: " + (sec.males || 0), "Females: " + (sec.females || 0), "Young: " + (sec.young || 0), "Flying: " + (sec.flying || 0)];
  if (id === "rabbits") return ["Males: " + (sec.males || 0), "Females: " + (sec.females || 0), "Young: " + (sec.young || 0)];
  if (id === "tilapia") return ["Ponds: " + (sec.ponds || 0)];
  if (id === "figs") return ["Trees: " + (sec.trees || 0)];
  if (id === "incubators") return ["Running: " + (sec.running || 0) + " eggs", "On hold: " + (sec.onHold || 0) + " eggs"];
  return [];
}

view("section", async (id) => {
  const data = await loadAll();
  const sec = data.sections[id] || (id === "farm" ? { name: "Farm general" } : undefined);
  if (!sec) return el('<div class="card"><h2>No such section</h2></div>');
  const prices = homePrices(data.settings);
  const allocated = allocatedEntries(data);
  const s = calc.sectionStats({ entries: allocated, section: id, shopPrices: prices, counts: sec });
  const month = calc.sectionStats({ entries: thisMonth(allocated), section: id, shopPrices: prices, counts: sec });
  const margin = id === "figs" ? data.settings.margins.figs : data.settings.margins.liveAnimals;
  const suggested = calc.suggestedPrice({ cost: s.costPerUnit, marginPct: margin });
  const lpKey = id === "pigeons" ? "pigeon" : "rooster";
  const lp = (data.settings.localPrices || {})[lpKey] || { low: 0, high: 0 };
  const check = s.mainKind === lpKey && s.costPerUnit && (lp.high || lp.low) ? calc.localPriceCheck({ cost: s.costPerUnit, low: lp.low, high: lp.high }) : null;
  const KIND_LABEL = { eggs: "egg", figs: "kg", rooster: "rooster", pigeon: "pigeon", rabbit: "rabbit", tilapia: "fish", bird: "bird" };
  const kindLabel = KIND_LABEL[s.mainKind] || s.mainKind;

  const box = el('<div class="stack"></div>');
  box.append(el(`<div class="card"><div class="card-head"><a class="btn small quiet" href="#/home">${ICONS.back} Home</a></div><h2>${sec.name || id} ${data.settings.exampleLoaded ? '<span class="badge example">EXAMPLE</span>' : ""}</h2></div>`));

  const nums = el('<div class="card stack"></div>');
  const line = (label, value, cls = "") => nums.append(el(`<div class="spread"><span class="hint">${label}</span><span class="${cls}">${value}</span></div>`));
  nums.append(el("<h3>This month</h3>"));
  line("Cash profit", money(month.cash), "big-num");
  line("Home value", money(month.home));
  line("Total benefit", money(month.benefit));
  nums.append(el("<h3>Per unit</h3>"));
  if (s.mainKind === "eggs") {
    line("Cost per egg (for home use and incubator eggs)", s.costPerUnit ? money(s.costPerUnit) : "no eggs yet");
  } else {
    line("Don't sell below", s.costPerUnit ? money(s.costPerUnit) + " per " + kindLabel : "no units yet");
    line("Suggested price", s.costPerUnit ? money(suggested) : "—");
  }
  if (check) {
    const rowEl = el('<div class="spread"><span class="hint">Local price ' + lp.low + "–" + lp.high + "</span></div>");
    rowEl.append(el(`<span class="badge ${check === "green" ? "keep" : check === "amber" ? "watch" : "drop"}">${check}</span>`));
    nums.append(rowEl, el(`<p class="hint">${calc.PRICE_ADVICE[check]}</p>`));
  }
  line("Based on", s.weeks + " weeks of entries");
  nums.append(el("<h3>All time</h3>"));
  line("Cash profit", money(s.cash));
  line("Home value kept apart", money(s.home));
  line("Units produced", String(s.units));
  box.append(nums);

  const counts = countLines(id, sec);
  if (counts.length) {
    const card = el('<div class="card stack"><h3>Counts</h3></div>');
    for (const c of counts) card.append(el(`<p class="hint">${c}</p>`));
    box.append(card);
  }

  const recent = data.entries.filter((e) => (e.section || "farm") === id).slice(0, 8);
  const list = el('<div class="card stack"><h3>Recent entries</h3></div>');
  if (!recent.length) list.append(el('<p class="hint">Nothing yet.</p>'));
  for (const e of recent) list.append(el(`<p class="hint">${dayMonthYear(e.date)} · ${entryTitle(e)}</p>`));
  box.append(list);

  if (id === "chickens") {
    const log = calc.eggLog({ entries: data.entries, counts: sec });
    const card = el('<div class="card stack"><h3>Egg log per group</h3></div>');
    for (const r of log) {
      const row = el(`<div class="spread"><span>Group ${r.group}</span><span class="hint">${r.perDay} eggs a day · ${r.perHen} per hen a day</span></div>`);
      if (r.perHen > 1) row.append(el('<span class="badge watch">check entries</span>'));
      card.append(row);
    }
    box.append(card);
  }
  if (id === "pigeons") {
    const ps = calc.pigeonStats({ entries: allocated, counts: sec });
    const card = el('<div class="card stack"><h3>Pigeons this year</h3></div>');
    card.append(el(`<p class="hint">Costs so far: ${money(ps.costs)}</p>`));
    card.append(el(`<p class="hint">Sales this year: ${money(ps.sales)}</p>`));
    card.append(el(`<p class="hint">Floor price per flying pigeon: ${ps.floorPrice ? money(ps.floorPrice) : "add the flying count in Settings → Correct the animal counts"}</p>`));
    box.append(card);
  }
  return box;
});

// ---- owner screen 4: entries list ----

view("entries", async () => {
  const data = await loadAll();
  const box = el('<div class="stack"></div>');
  box.append(el('<div class="card"><h2>Entries</h2><p class="hint">Everything that was entered, newest first. Tap Fix to change one.</p></div>'));

  const filters = el(`
    <form class="card stack">
      <div class="row">
        <div class="field" style="flex:1"><label for="fFrom">From</label><input class="input" id="fFrom" type="date"></div>
        <div class="field" style="flex:1"><label for="fTo">To</label><input class="input" id="fTo" type="date"></div>
      </div>
      <div class="field"><label for="fSec">Section</label><select class="input" id="fSec"></select></div>
      <div class="field"><label for="fWho">Who entered it</label><select class="input" id="fWho"></select></div>
      <button class="btn block" type="submit">Show</button>
    </form>`);
  const secSel = filters.querySelector("#fSec");
  secSel.append(el('<option value="">All sections</option>'));
  for (const [id, s] of Object.entries(data.sections)) secSel.append(el(`<option value="${id}">${s.name || id}</option>`));
  secSel.append(el('<option value="farm">Farm general</option>'));
  const whoSel = filters.querySelector("#fWho");
  whoSel.append(el('<option value="">Anyone</option>'));
  for (const name of [...new Set(data.entries.map((e) => e.byName))]) whoSel.append(el(`<option value="${name}">${name}</option>`));

  const results = el('<div class="stack"></div>');
  const show = () => {
    const from = filters.querySelector("#fFrom").value;
    const to = filters.querySelector("#fTo").value;
    const sec = secSel.value;
    const who = whoSel.value;
    const rows = data.entries.filter((e) =>
      (!from || e.date >= from) && (!to || e.date <= to) &&
      (!sec || (e.section || "farm") === sec) && (!who || e.byName === who));
    results.innerHTML = "";
    if (!rows.length) results.append(el('<div class="card sunk"><p>No entries for that filter.</p></div>'));
    for (const e of rows.slice(0, 200)) {
      const card = entryCard(e, { canChange: true });
      card.querySelector(".spread .hint").textContent = dayMonthYear(e.date) + " · " + timeOf(e.at) + " · " + e.byName
        + (store.OWNER_TYPES.includes(e.type) ? " · " + ((data.sections[e.section] && data.sections[e.section].name) || e.section || "farm") : "");
      results.append(card);
    }
  };
  filters.addEventListener("submit", (ev) => { ev.preventDefault(); show(); });
  box.append(filters, results);
  show();
  return box;
});

// ---- owner screen 7: salary ----

view("salary", async () => {
  const data = await loadAll();
  const month = thisMonth(data.entries);
  const due = Number(data.settings.salary) || 0;
  const paid = month.filter((e) => e.type === "salaryPaid").reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const fromSales = month.filter((e) => e.type === "salaryFromSales").reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const owed = calc.salaryOwed({ due, paidByOwner: paid, fromSales });
  const box = el('<div class="stack"></div>');
  box.append(el(`<div class="card"><div class="card-head"><a class="btn small quiet" href="#/home">${ICONS.back} Home</a></div><h2>Salary</h2><p class="hint">${dayMonthYear(today()).replace(/^\d+ /, "")}</p></div>`));
  const card = el('<div class="card stack"></div>');
  const line = (l, v, cls = "") => card.append(el(`<div class="spread"><span class="hint">${l}</span><span class="${cls}">${v}</span></div>`));
  line("Due this month", money(due));
  line("Paid by you", money(paid));
  line("Kept from sales", money(fromSales));
  line("Still owed", money(owed), "big-num");
  box.append(card);
  const add = el('<button class="btn primary block" type="button">Enter salary paid</button>');
  add.addEventListener("click", () => { editing = null; location.hash = "#/add/salaryPaid"; });
  box.append(add);
  return box;
});

// ---- owner screen 9: settings ----

function setPath(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] = cur[parts[i]] || {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

// F13: an amber line when a set of % boxes does not add up to 100. Display only:
// the stored numbers are never changed.
function pctWarn(label, inputs) {
  const p = el('<p class="hint" style="color:var(--amber)" aria-live="polite"></p>');
  const update = () => {
    const total = inputs.reduce((a, i) => a + (Number(i.value) || 0), 0);
    const left = calc.round1(100 - total);
    if (Math.abs(left) < 0.05) { p.hidden = true; p.textContent = ""; return; }
    p.hidden = false;
    p.textContent = label + " adds up to " + calc.round1(total) + "%. " +
      (left > 0 ? "The other " + left + "% stays under Farm general." : "That is " + Math.abs(left) + "% more than the whole bill.");
  };
  for (const i of inputs) i.addEventListener("input", update);
  update();
  return p;
}

view("settings", async () => {
  const data = await loadAll();
  const s = data.settings;
  const box = el('<div class="stack"></div>');
  box.append(el('<div class="card"><h2>Settings</h2><p class="hint">Set once, change any time. The numbers feed every screen.</p></div>'));

  const form = el('<form class="card stack" novalidate></form>');
  const groups = [
    ["Electricity %", [
      ["splits.electricity.incubator", "Incubator"],
      ["splits.electricity.ro", "RO machine"],
      ["splits.electricity.house", "Worker's house"],
      ["splits.electricity.other", "Other"],
    ], "Electricity"],
    ["RO water %", [["splits.roFigShare", "Fig trees get"]]],
    ["Labour %", [
      ["splits.labour.chickens", "Chickens"],
      ["splits.labour.chicks", "Chicks"],
      ["splits.labour.pigeons", "Pigeons"],
      ["splits.labour.rabbits", "Rabbits"],
      ["splits.labour.figs", "Figs"],
      ["splits.labour.tilapia", "Fish pond"],
      ["splits.labour.other", "Other"],
    ], "Labour"],
    ["Margins %", [["margins.figs", "Figs"], ["margins.liveAnimals", "Live animals"]]],
    ["Local prices (AED)", [["localPrices.rooster.low", "Rooster low"], ["localPrices.rooster.high", "Rooster high"], ["localPrices.pigeon.low", "Pigeon low"], ["localPrices.pigeon.high", "Pigeon high"]]],
    ["Shop prices for home use", [["shopPrices.egg", "One egg"], ["shopPrices.figKg", "Fig per kg"], ["shopPrices.chicken", "One chicken"], ["shopPrices.pigeon", "One pigeon"], ["shopPrices.rabbit", "One rabbit"], ["shopPrices.tilapiaKg", "Tilapia per kg"]]],
    ["Feed bag weights (kg)", [["feedWeights.starter", "Starter"], ["feedWeights.grower", "Grower"], ["feedWeights.layer", "Layer"]]],
    ["Money and ages", [["salary", "Salary per month"], ["stageAges.starterWeeks", "Starter stage (weeks)"], ["stageAges.growerWeeks", "Grower stage (weeks)"]]],
  ];
  const inputs = [];
  for (const [title, fields, warnLabel] of groups) {
    form.append(el(`<h3>${title}</h3>`));
    const groupIns = [];
    for (const [path, label] of fields) {
      const wrap = el('<div class="field"></div>');
      wrap.append(el(`<label for="s_${path}">${label}</label>`));
      const inp = el(`<input class="input" id="s_${path}" type="number" inputmode="decimal" min="0" step="any">`);
      inp.value = getPath(s, path) ?? "";
      wrap.append(inp);
      form.append(wrap);
      inputs.push([path, inp]);
      groupIns.push(inp);
    }
    if (warnLabel) form.append(pctWarn(warnLabel, groupIns));
  }
  const msg = el('<p class="hint" aria-live="polite"></p>');
  const save = el('<button class="btn primary block" type="submit">Save settings</button>');
  form.append(save, msg);
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const next = JSON.parse(JSON.stringify(s));
    for (const [path, inp] of inputs) setPath(next, path, Number(inp.value) || 0);
    try {
      await store.saveSettings(next);
      toast("Settings saved");
      render();
    } catch (e) {
      msg.textContent = e.message;
    }
  });
  box.append(form);

  const tools = el('<div class="card stack"><h3>More</h3></div>');
  const salary = el('<button class="btn block" type="button">Salary this month</button>');
  salary.addEventListener("click", () => { location.hash = "#/salary"; });
  const setup = el('<button class="btn block" type="button">Correct the animal counts (setup)</button>');
  setup.addEventListener("click", () => { location.hash = "#/setup"; });
  tools.append(salary, setup);
  const excel = el('<button class="btn primary block" type="button">Download Excel</button>');
  excel.addEventListener("click", async () => {
    try {
      excel.disabled = true;
      await downloadExcel();
      toast("Excel file saved");
    } catch (e) {
      toast(e.message);
    } finally {
      excel.disabled = false;
    }
  });
  tools.append(excel, el('<p class="hint">Every entry plus monthly totals per section. Save one to Google Drive on the 1st of each month.</p>'));
  if (typeof Notification !== "undefined") {
    const state = Notification.permission === "granted" ? "Phone reminders are on." : "Phone reminders are off. They only arrive when you open the app.";
    const notify = el('<button class="btn block" type="button">Turn on phone reminders</button>');
    notify.addEventListener("click", async () => {
      const p = await Notification.requestPermission();
      toast(p === "granted" ? "Phone reminders on" : "Not turned on");
      render();
    });
    tools.append(notify, el(`<p class="hint">${state}</p>`));
  }
  if (store.isDemo()) {
    const example = el('<button class="btn block" type="button">Load example data</button>');
    example.addEventListener("click", async () => {
      if (!confirm("Replace the entries on this device with six weeks of example data?")) return;
      try {
        const mod = await import("./dev/example-data.js");
        await store.clearEntries();
        for (const e of mod.exampleEntries()) await store.addEntry(e);
        await store.saveSections(mod.EXAMPLE_SECTIONS);
        await store.saveSettings({ ...data.settings, exampleLoaded: true });
        toast("Example data loaded");
        location.hash = "#/home";
        render();
      } catch (e) {
        toast(e.message);
      }
    });
    tools.append(example, el('<p class="hint">Example data is only for demo mode; it never goes to Firebase.</p>'));
  }
  box.append(tools);
  return box;
});

// ---- owner-only entry types (PLAN §3) ----

Object.assign(FORMS, {
  bill: { title: "Bill", icon: "house", section: "farm", fields: [
    { k: "kind", l: "Which bill", t: "select", req: true, opts: [["electricity", "Electricity"], ["ro", "RO machine"], ["other", "Other"]] },
    { k: "amount", l: "Amount", t: "number", step: "0.01", req: true },
  ] },
  salaryPaid: { title: "Salary paid", icon: "coin", section: "farm", fields: [
    { k: "amount", l: "Amount paid", t: "number", step: "0.01", req: true },
  ] },
  spentBefore: { title: "Spent before 22 Nov", icon: "coin", section: "", fields: [
    { k: "section", l: "Which section", t: "select", req: true, opts: [["chickens", "Chickens"], ["incubators", "Incubators"], ["pigeons", "Pigeons"], ["rabbits", "Rabbits"], ["tilapia", "Fish pond"], ["figs", "Figs"], ["ro", "RO machine"], ["farm", "Farm general"]] },
    { k: "amount", l: "Total spent", t: "number", step: "0.01", req: true },
  ] },
  // Old farm equipment (greenhouses, generator, RO machine, pumps): written down only,
  // never counted in profit, payback or the goal steps.
  oldSpend: { title: "Old farm spending (not counted)", icon: "coin", section: "old", fields: [
    { k: "what", l: "What was it", t: "text", req: true },
    { k: "amount", l: "Amount", t: "number", step: "0.01", req: true },
  ] },
  incubatorBatch: { title: "Incubator batch", icon: "egg", section: "incubators", fields: [
    { k: "incubator", l: "Which incubator", t: "select", req: true, opts: [["128", "128 eggs"], ["400", "400 eggs"]] },
    { k: "eggs", l: "How many eggs set", t: "number", req: true },
    { k: "group", l: "Eggs from", t: "seg", opts: GROUPS, req: true },
    { k: "clear", l: "Clear eggs at candling", t: "number" },
  ] },
  health: { title: "Health", icon: "cross", section: "", fields: [
    { k: "group", l: "Which group", t: "select", req: true, opts: [["A", "Group A"], ["B", "Group B"], ["C", "Group C"], ["chicks", "Chicks"], ["pigeons", "Pigeons"], ["rabbits", "Rabbits"]] },
    { k: "what", l: "Vaccine or medicine", t: "text", req: true },
    { k: "cost", l: "Cost", t: "number", step: "0.01" },
  ] },
});

// ---- first-use wizard (PLAN §9 step 4) ----

view("setup", async () => {
  const data = await loadAll();
  const sec = JSON.parse(JSON.stringify(data.sections));
  const set = JSON.parse(JSON.stringify(data.settings));
  const box = el('<div class="stack"></div>');
  box.append(el('<div class="card"><h2>Set up the farm</h2><p class="hint">Fill this in once. You can change any of it later in Settings.</p></div>'));

  const form = el('<form class="card stack" novalidate></form>');
  const inputs = [];
  const addNum = (target, path, label, step = "any") => {
    const wrap = el('<div class="field"></div>');
    let id = "w_" + path.replace(/\./g, "_");
    if (inputs.some(([, , i]) => i.id === id)) id += "_" + inputs.length; // e.g. pigeon and rabbit "males"
    wrap.append(el(`<label for="${id}">${label}</label>`));
    const inp = el(`<input class="input" id="${id}" type="number" inputmode="decimal" min="0" step="${step}">`);
    inp.value = getPath(target, path) ?? "";
    wrap.append(inp);
    form.append(wrap);
    inputs.push([target, path, inp]);
    return inp;
  };

  form.append(el("<h3>Animal counts</h3>"));
  form.append(el('<p class="hint">These are today\'s counts. After you save, births, moves, deaths and sales change them by themselves. Come back here only to correct them.</p>'));
  for (const g of ["A", "B", "C"]) {
    addNum(sec.chickens, "groups." + g + ".roosters", "Group " + g + " roosters");
    addNum(sec.chickens, "groups." + g + ".hens", "Group " + g + " hens");
  }
  addNum(sec.pigeons, "males", "Pigeon males");
  addNum(sec.pigeons, "females", "Pigeon females");
  addNum(sec.pigeons, "young", "Young pigeons");
  addNum(sec.pigeons, "flying", "Flying (grown) pigeons for sale");
  addNum(sec.chicks, "starter", "Chicks on starter feed");
  addNum(sec.chicks, "grower", "Growing birds on grower feed");
  addNum(sec.chicks, "males", "Grown young males (for sale)");
  addNum(sec.chicks, "females", "Grown young females (not yet in a group)");
  addNum(sec.rabbits, "males", "Rabbit males");
  addNum(sec.rabbits, "females", "Rabbit females");
  addNum(sec.rabbits, "young", "Young rabbits");
  addNum(sec.tilapia, "ponds", "Fish ponds");
  addNum(sec.figs, "trees", "Fig trees");
  addNum(sec.incubators, "running", "Eggs in the running incubator");
  addNum(sec.incubators, "onHold", "Eggs in the incubator on hold");

  form.append(el("<h3>Your % splits</h3>"));
  const elecIns = [
    addNum(set, "splits.electricity.incubator", "Electricity: incubator %"),
    addNum(set, "splits.electricity.ro", "Electricity: RO machine %"),
    addNum(set, "splits.electricity.house", "Electricity: worker's house %"),
    addNum(set, "splits.electricity.other", "Electricity: other %"),
  ];
  form.append(pctWarn("Electricity", elecIns));
  addNum(set, "splits.roFigShare", "RO water: fig trees get %");
  const labIns = [
    addNum(set, "splits.labour.chickens", "Labour: chickens %"),
    addNum(set, "splits.labour.chicks", "Labour: chicks %"),
    addNum(set, "splits.labour.pigeons", "Labour: pigeons %"),
    addNum(set, "splits.labour.rabbits", "Labour: rabbits %"),
    addNum(set, "splits.labour.figs", "Labour: figs %"),
    addNum(set, "splits.labour.tilapia", "Labour: fish pond %"),
  ];
  form.append(pctWarn("Labour", labIns));

  form.append(el("<h3>Money</h3>"));
  addNum(set, "salary", "Salary per month", "0.01");
  addNum(set, "localPrices.rooster.low", "Roosters sell for, low", "0.01");
  addNum(set, "localPrices.rooster.high", "Roosters sell for, high", "0.01");
  addNum(set, "shopPrices.egg", "One egg costs this much at the shop", "0.01");
  addNum(set, "shopPrices.figKg", "Figs per kg at the shop", "0.01");

  form.append(el("<h3>Spent before 22 Nov 2026</h3>"));
  form.append(el('<p class="hint">Kept apart and used only for payback. Leave 0 if nothing.</p>'));
  // Running the setup again must never add the start-up money twice: a section that already
  // has its "spent before" entry shows it instead of a box (change it in Entries if it is wrong).
  const spent = {};
  for (const [id, label] of [["chickens", "Chickens"], ["incubators", "Incubators"], ["pigeons", "Pigeons"], ["rabbits", "Rabbits"], ["tilapia", "Fish pond"], ["figs", "Figs"]]) {
    const done = data.entries.filter((e) => e.type === "spentBefore" && e.section === id);
    if (done.length) {
      form.append(el(`<p class="hint">${label}: already entered, ${money(done.reduce((a, e) => a + (Number(e.amount) || 0), 0))}</p>`));
      continue;
    }
    spent[id] = 0;
    addNum(spent, id, "Spent on " + label, "0.01");
  }
  form.append(el("<h3>Old farm spending (not counted)</h3>"));
  form.append(el('<p class="hint">Greenhouses, generator, RO machine, pumps. Written down for your records only: never counted in profit, payback or your goal.</p>'));
  const old = { oldTotal: 0 };
  const oldDone = data.entries.filter((e) => e.type === "oldSpend");
  if (oldDone.length) form.append(el(`<p class="hint">Already entered, ${money(oldDone.reduce((a, e) => a + (Number(e.amount) || 0), 0))}. Add more from Add entry.</p>`));
  else addNum(old, "oldTotal", "Old farm equipment, total", "0.01");

  const msg = el('<p class="hint" aria-live="polite"></p>');
  form.append(el('<button class="btn primary block" type="submit">Save and start</button>'), msg);
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    for (const [target, path, inp] of inputs) setPath(target, path, Number(inp.value) || 0);
    set.wizardDone = true;
    set.countsAtMs = Date.now(); // the counts typed now are the new starting point for live counts
    try {
      await store.saveSections(sec);
      await store.saveSettings(set);
      for (const [id, amount] of Object.entries(spent)) {
        if (amount > 0) await store.addEntry({ type: "spentBefore", section: id, amount, date: "2026-11-21", note: "Spent before 22 Nov" });
      }
      if (old.oldTotal > 0) await store.addEntry({ type: "oldSpend", section: "old", what: "Old farm equipment", amount: old.oldTotal, date: "2026-11-21", note: "Not counted" });
      toast("Farm set up");
      location.hash = "#/home";
      render();
    } catch (e) {
      msg.textContent = e.message;
    }
  });
  box.append(form);
  return box;
});

// ---- owner screen 5: incubators and batches ----

function monthlyElectricity(entries) {
  const bills = entries.filter((e) => e.type === "bill" && e.kind === "electricity");
  const months = new Set(bills.map((e) => (e.date || "").slice(0, 7))).size || 1;
  return bills.reduce((a, e) => a + (Number(e.amount) || 0), 0) / months;
}

view("incubators", async () => {
  const data = await loadAll();
  const sec = data.sections.incubators || {};
  const prices = homePrices(data.settings);
  const chickens = calc.sectionStats({ entries: allocatedEntries(data), section: "chickens", shopPrices: prices, counts: data.sections.chickens });
  const costPerEgg = chickens.costByKind.eggs || 0;
  const log = calc.eggLog({ entries: data.entries, counts: data.sections.chickens });
  const eggsPerDay = log.reduce((a, r) => a + r.perDay, 0);
  const layingHens = log.reduce((a, r) => a + r.hens, 0);
  const perHen = calc.eggsPerHenPerDay({ eggsPerDay, hens: layingHens }) || 0.6;
  const helper = calc.start400Helper({ target: sec.onHold || 400, days: 7, eggsPerDayNow: eggsPerDay, eggsPerHenPerDay: perHen || 0.6 });
  const electric = monthlyElectricity(data.entries) * ((data.settings.splits.electricity.incubator || 0) / 100);

  const box = el('<div class="stack"></div>');
  box.append(el(`<div class="card"><div class="card-head"><a class="btn small quiet" href="#/home">${ICONS.back} Home</a></div><h2>Incubators</h2></div>`));

  const counts = el('<div class="card stack"><h3>Right now</h3></div>');
  counts.append(el(`<p class="hint">Running: ${sec.running || 0} eggs</p>`));
  counts.append(el(`<p class="hint">On hold: ${sec.onHold || 0} eggs</p>`));
  counts.append(el(`<p class="hint">Electricity share this month: ${money(electric)}</p>`));
  box.append(counts);

  const batches = data.entries.filter((e) => e.type === "incubatorBatch");
  const batchCard = el('<div class="card stack"><h3>Batches</h3></div>');
  if (!batches.length) batchCard.append(el('<p class="hint">No batch yet. Add one from Add entry → Incubator batch.</p>'));
  for (const b of batches) {
    const st = calc.batchStats({ batch: b, entries: data.entries, costPerEgg, incubatorElectric: electric });
    batchCard.append(el(`<div class="stack" style="gap:2px">
      <p><strong>${b.eggs} eggs from group ${b.group}</strong> · ${dayMonthYear(b.date)}</p>
      <p class="hint">Clear at candling: ${b.clear || 0} · hatched: ${st.hatched} · hatch rate ${st.hatchRate}%</p>
      <p class="hint">Cost per chick: ${st.costPerChick ? money(st.costPerChick) : "no chicks yet"} (batch cost ${money(st.cost)})</p>
    </div>`));
  }
  box.append(batchCard);

  const help = el('<div class="card stack"><h3>When to start the 400</h3></div>');
  help.append(el(`<p class="hint">To fill ${sec.onHold || 400} eggs in 7 days you need <strong>${helper.needed} eggs a day</strong>.</p>`));
  help.append(el(`<p class="hint">You collect about ${helper.now} a day now, so ${helper.more} more are needed.</p>`));
  help.append(el(`<p class="hint">That is about <strong>${helper.moreHens} more laying hens</strong> (at ${calc.round1(perHen || 0.6)} eggs per hen a day).</p>`));
  box.append(help);
  return box;
});

// ---- owner screen 6: ducks planning ----

view("ducks", async () => {
  const data = await loadAll();
  const chickens = data.sections.chickens || { groups: {} };
  const hens = Object.values(chickens.groups || {}).reduce((a, g) => a + (g.hens || 0) + (g.roosters || 0), 0);
  const p = data.sections.pigeons || {};
  const heads = { chickens: hens, pigeons: (p.males || 0) + (p.females || 0) + (p.young || 0) };
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const layer30 = data.entries.filter((e) => e.type === "bought" && e.what === "layer" && e.date >= cutoff).reduce((a, e) => a + (Number(e.price) || 0), 0);
  const threeAgo = new Date();
  threeAgo.setMonth(threeAgo.getMonth() - 3);
  const since = threeAgo.toISOString().slice(0, 10);
  const roMonthly = data.entries.filter((e) => e.type === "bill" && e.kind === "ro" && e.date >= since).reduce((a, e) => a + (Number(e.amount) || 0), 0) / 3;

  const box = el('<div class="stack"></div>');
  box.append(el(`<div class="card"><div class="card-head"><a class="btn small quiet" href="#/home">${ICONS.back} Home</a></div><h2>Ducks planning</h2><p class="hint">Nothing is bought or saved. This is only a what-if.</p></div>`));
  const card = el('<div class="card stack"></div>');
  card.append(el('<div class="field"><label for="duckCount">How many ducks are you thinking of?</label></div>'));
  const inp = el('<input class="input" id="duckCount" type="number" inputmode="numeric" min="0" step="1" value="10">');
  card.querySelector(".field").append(inp);
  card.append(el('<div class="field"><label for="duckLabour">Labour % for ducks (of the salary)</label></div>'));
  const labourInp = el('<input class="input" id="duckLabour" type="number" inputmode="decimal" min="0" max="100" step="1" value="5">');
  card.querySelectorAll(".field")[1].append(labourInp);
  const out = el('<div class="stack" data-out></div>');
  card.append(out);
  const calcIt = () => {
    const n = Number(inp.value) || 0;
    const plan = calc.ducksPlan({
      count: n, priceEach: 40, monthlyLayerFeed: layer30, heads, roMonthly,
      figShare: data.settings.splits.roFigShare, labourPct: Number(labourInp.value) || 0, salary: data.settings.salary,
    });
    out.innerHTML = "";
    const line = (l, v, cls = "") => out.append(el(`<div class="spread"><span class="hint">${l}</span><span class="${cls}">${v}</span></div>`));
    line("To buy", money(plan.purchase), "big-num");
    line("Layer feed a month", money(plan.feed));
    line("Water a month", money(plan.water));
    line("Labour share a month", money(plan.labour));
    line("Every month after that", money(plan.monthly), "big-num");
    out.append(el('<p class="hint">Feed is the duck share of the layer feed you bought in the last 30 days, weighted 1.5 per duck against 1 per chicken and 1/3 per pigeon.</p>'));
    out.append(el('<p class="hint">Water is the duck share of the RO bills from the last 3 months, after the fig trees take their %.</p>'));
  };
  inp.addEventListener("input", calcIt);
  labourInp.addEventListener("input", calcIt);
  calcIt();
  box.append(card);
  return box;
});

// ---- owner screen 8: monthly summary ----

view("summary", async () => {
  const data = await loadAll();
  const month = today().slice(0, 7);
  const allocated = allocatedEntries(data);
  const rows = allocated.filter((e) => (e.date || "").startsWith(month));
  const prices = homePrices(data.settings);
  const stats = sectionIds(data)
    .map((id) => calc.sectionStats({ entries: rows, section: id, shopPrices: prices, counts: data.sections[id] }));
  const sum = calc.monthlySummary({ stats });
  const everySection = allStats(data, allocated);
  const startBehind = data.entries.filter((e) => e.type === "spentBefore").reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const profitToDate = everySection.reduce((a, s) => a + s.cash, 0);
  const pay = calc.payback({ behind: Math.max(0, startBehind - profitToDate), profitPerMonth: Math.max(0, sum.rows.reduce((a, r) => a + r.cash, 0)) });

  const box = el('<div class="stack"></div>');
  box.append(el(`<div class="card"><div class="card-head"><a class="btn small quiet" href="#/home">${ICONS.back} Home</a></div><h2>Monthly summary</h2><p class="hint">${dayMonthYear(month + "-01").replace(/^\d+ /, "")}</p></div>`));

  const table = el('<div class="card stack"><h3>This month</h3></div>');
  if (!sum.rows.length) table.append(el('<p class="hint">No entries this month yet.</p>'));
  for (const r of sum.rows) {
    table.append(el(`<div class="spread"><span>${sectionName(data, r.section)}</span><span>${money(r.cash)}</span></div>`));
    table.append(el(`<p class="hint">Home value ${money(r.home)} · total benefit ${money(r.benefit)}</p>`));
  }
  box.append(table);
  const oldTotal = data.entries.filter((e) => e.type === "oldSpend").reduce((a, e) => a + (Number(e.amount) || 0), 0);
  if (oldTotal > 0) {
    box.append(el(`<div class="card stack"><h3>Old farm spending</h3><div class="spread"><span>Greenhouses, generator, RO machine, pumps</span><span>${money(oldTotal)}</span></div><p class="hint">For your records only. Not counted in profit, payback or your goal.</p></div>`));
  }

  if (sum.best) {
    const bw = el('<div class="card stack"><h3>Best and worst</h3></div>');
    bw.append(el(`<p class="hint">Best: ${(data.sections[sum.best.section] && data.sections[sum.best.section].name) || sum.best.section} at ${money(sum.best.benefit)}</p>`));
    bw.append(el(`<p class="hint">Worst: ${(data.sections[sum.worst.section] && data.sections[sum.worst.section].name) || sum.worst.section} at ${money(sum.worst.benefit)}</p>`));
    box.append(bw);
  }

  const payCard = el('<div class="card stack"><h3>Payback</h3></div>');
  payCard.append(el(`<p class="hint">Started ${money(startBehind)} behind. Now ${money(Math.max(0, startBehind - profitToDate))} behind.</p>`));
  payCard.append(el(`<p class="hint">${pay.months ? "About " + pay.months + " months to break even at this month's pace." : "Not making a profit this month, so no break-even date yet."}</p>`));
  box.append(payCard);
  return box;
});

// ---- Excel export (PLAN §8) ----

async function loadXLSX() {
  if (window.XLSX) return window.XLSX;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    s.onload = res;
    s.onerror = () => rej(new Error("Could not load the Excel library. Check the internet connection."));
    document.head.append(s);
  });
  return window.XLSX;
}

async function downloadExcel() {
  const data = await loadAll();
  const XLSX = await loadXLSX();
  const wb = XLSX.utils.book_new();
  const rows = data.entries.map((e) => ({
    Date: e.date, Time: timeOf(e.at), Type: e.type, Section: e.section || "",
    Who: e.byName, Details: entryTitle(e), Note: e.note || "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Entries");
  const monthly = [];
  const byMonth = calc.monthlyBySection(allocatedEntries(data), homePrices(data.settings));
  for (const [month, sections] of Object.entries(byMonth)) {
    for (const [section, cell] of Object.entries(sections)) {
      monthly.push({ Month: month, Section: section, Sales: cell.sales, Costs: cell.costs, Cash: cell.cash, "Home value": cell.home });
    }
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(monthly), "Monthly");
  XLSX.writeFile(wb, "my-farm-" + today() + ".xlsx");
}

boot();




