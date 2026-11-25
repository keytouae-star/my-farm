// My Farm storage: one set of functions for both backends.
// Demo backend keeps everything in localStorage (or any injected storage object).
// Firebase backend talks to Firestore; the rules in firestore.rules enforce the same limits online.
import { firebaseConfig } from "./firebase-config.js";

export const DEMO_KEY = "myfarm-demo";
export const EDIT_WINDOW_MS = 10 * 60 * 1000;

export const WORKER_TYPES = ["eggs", "figs", "born", "moved", "died", "weighed", "bought", "openedFeed", "sold", "home", "salaryFromSales", "candled"];
export const OWNER_TYPES = ["bill", "salaryPaid", "spentBefore", "oldSpend", "incubatorBatch", "health", "feedCount"];
export const MONEY_FIELDS = ["price", "amount", "cost", "value", "shopPrice", "margin", "total", "paid"];

export const DEFAULT_SETTINGS = {
  splits: {
    electricity: { incubator: 30, ro: 20, house: 20, other: 30 },
    roFigShare: 50,
    labour: { chickens: 40, chicks: 20, pigeons: 10, rabbits: 10, figs: 15, other: 5 },
  },
  margins: { figs: 25, liveAnimals: 35 },
  localPrices: { rooster: { low: 25, high: 30 }, pigeon: { low: 0, high: 0 } },
  shopPrices: { egg: 0.7, figKg: 12, roosterKg: 18, chicken: 30, pigeon: 15, rabbit: 40, tilapiaKg: 20 },
  feedWeights: { starter: 25, grower: 25, layer: 25 },
  salary: 1200,
  stageAges: { starterWeeks: 4, growerWeeks: 10 },
  roFilterDate: "",
  exampleLoaded: false,
};

export const DEFAULT_SECTIONS = {
  chickens: { name: "Chickens", groups: { A: { roosters: 1, hens: 1 }, B: { roosters: 2, hens: 12 }, C: { roosters: 1, hens: 2 } } },
  chicks: { name: "Chicks and growing birds", starter: 0, grower: 0, males: 0, females: 0 },
  incubators: { name: "Incubators", running: 128, onHold: 400 },
  pigeons: { name: "Pigeons", males: 4, females: 4, young: 42, flying: 0 },
  rabbits: { name: "Rabbits", males: 1, females: 1, young: 1 },
  tilapia: { name: "Tilapia", ponds: 1 },
  figs: { name: "Fig trees", trees: 0 },
  ducks: { name: "Ducks", count: 0 },
};

const clone = (v) => JSON.parse(JSON.stringify(v));
const uid = () => "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function localToday(d = new Date()) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function blank() {
  return {
    session: null,
    users: {
      "demo-owner": { uid: "demo-owner", role: "owner", name: "You (owner)" },
      "demo-worker": { uid: "demo-worker", role: "worker", name: "Worker" },
    },
    entries: [],
    settings: clone(DEFAULT_SETTINGS),
    sections: clone(DEFAULT_SECTIONS),
  };
}

function readDb(storage) {
  const raw = storage.getItem(DEMO_KEY);
  if (!raw) return blank();
  try {
    const db = JSON.parse(raw);
    return { ...blank(), ...db, settings: { ...clone(DEFAULT_SETTINGS), ...(db.settings || {}) } };
  } catch (e) {
    return blank();
  }
}

function writeDb(storage, db) {
  storage.setItem(DEMO_KEY, JSON.stringify(db));
}

// Demo backend: same method names as the Firebase one. `storage` only needs getItem/setItem.
export function createDemoBackend(storage) {
  if (!storage) throw new Error("demo backend needs a storage object");
  const save = (db) => writeDb(storage, db);
  return {
    kind: "demo",
    async session() {
      const db = readDb(storage);
      return db.session && db.users[db.session] ? { ...db.users[db.session] } : null;
    },
    async signIn({ role, email, password }) {
      const db = readDb(storage);
      if (role) {
        const user = role === "owner" ? db.users["demo-owner"] : db.users["demo-worker"];
        db.session = user.uid;
        save(db);
        return { ...user };
      }
      if (!email || !password) throw new Error("Email and password are needed");
      const user = Object.values(db.users).find((u) => u.email === email);
      if (!user || user.password !== password) throw new Error("Email or password is wrong");
      db.session = user.uid;
      save(db);
      return { ...user };
    },
    async signOut() {
      const db = readDb(storage);
      db.session = null;
      save(db);
    },
    async listEntries() {
      return readDb(storage).entries.map((e) => ({ ...e }));
    },
    async getEntry(id) {
      const row = readDb(storage).entries.find((e) => e.id === id);
      return row ? { ...row } : null;
    },
    async addEntry(entry) {
      const db = readDb(storage);
      const row = { ...entry, id: uid() };
      db.entries.push(row);
      save(db);
      return { ...row };
    },
    async updateEntry(id, patch) {
      const db = readDb(storage);
      const i = db.entries.findIndex((e) => e.id === id);
      if (i < 0) throw new Error("Entry not found");
      db.entries[i] = { ...db.entries[i], ...patch, id };
      save(db);
      return { ...db.entries[i] };
    },
    async deleteEntry(id) {
      const db = readDb(storage);
      db.entries = db.entries.filter((e) => e.id !== id);
      save(db);
    },
    async getSettings() {
      return clone(readDb(storage).settings);
    },
    async saveSettings(patch) {
      const db = readDb(storage);
      db.settings = { ...db.settings, ...patch };
      save(db);
      return clone(db.settings);
    },
    async getSections() {
      return clone(readDb(storage).sections);
    },
    async saveSections(patch) {
      const db = readDb(storage);
      db.sections = { ...db.sections, ...patch };
      save(db);
      return clone(db.sections);
    },
    async replaceAll(data) {
      const db = readDb(storage);
      if (data.entries) db.entries = data.entries;
      if (data.settings) db.settings = { ...db.settings, ...data.settings };
      if (data.sections) db.sections = { ...db.sections, ...data.sections };
      save(db);
    },
    async clearEntries() {
      const db = readDb(storage);
      db.entries = [];
      save(db);
    },
  };
}

// Firebase backend: loaded only when firebase-config.js has a config.
export async function createFirebaseBackend(config) {
  const base = "https://www.gstatic.com/firebasejs/10.12.2/";
  const { initializeApp } = await import(base + "firebase-app.js");
  const authMod = await import(base + "firebase-auth.js");
  const fsMod = await import(base + "firebase-firestore.js");
  const app = initializeApp(config);
  const auth = authMod.getAuth(app);
  const db = fsMod.initializeFirestore(app, { localCache: fsMod.persistentLocalCache() });
  const { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc } = fsMod;

  const roleOf = async (user) => {
    const snap = await getDoc(doc(db, "users", user.uid));
    return snap.exists() ? snap.data() : { role: "worker", name: user.email };
  };
  const me = async (user, data) => ({ uid: user.uid, role: data.role || "worker", name: data.name || user.email, email: user.email });

  return {
    kind: "firebase",
    async session() {
      // Nov 25: wait until Firebase has restored the saved login, or a logged-in phone
      // is sent to the login page / "Please log in first" when the app opens.
      if (auth.authStateReady) await auth.authStateReady();
      else await new Promise((res) => { const off = authMod.onAuthStateChanged(auth, () => { off(); res(); }); });
      const user = auth.currentUser;
      if (!user) return null;
      return me(user, await roleOf(user));
    },
    async signIn({ email, password }) {
      const cred = await authMod.signInWithEmailAndPassword(auth, email, password);
      return me(cred.user, await roleOf(cred.user));
    },
    async signOut() {
      await authMod.signOut(auth);
    },
    async listEntries(scope) {
      if (!scope) {
        const snap = await getDocs(collection(db, "entries"));
        return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      }
      const q = fsMod.query(collection(db, "entries"), fsMod.where("by", "==", scope.by), fsMod.where("atMs", ">", scope.sinceMs));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
    },
    async getEntry(id) {
      const snap = await getDoc(doc(db, "entries", id));
      return snap.exists() ? { ...snap.data(), id } : null;
    },
    async addEntry(entry) {
      const ref = await addDoc(collection(db, "entries"), entry);
      return { ...entry, id: ref.id };
    },
    async updateEntry(id, patch) {
      await updateDoc(doc(db, "entries", id), patch);
      return { ...patch, id };
    },
    async deleteEntry(id) {
      await deleteDoc(doc(db, "entries", id));
    },
    async getSettings() {
      const snap = await getDoc(doc(db, "settings", "main"));
      return snap.exists() ? snap.data() : clone(DEFAULT_SETTINGS);
    },
    async saveSettings(patch) {
      await setDoc(doc(db, "settings", "main"), patch, { merge: true });
      return this.getSettings();
    },
    async getSections() {
      const snap = await getDoc(doc(db, "sections", "main"));
      return snap.exists() ? snap.data() : clone(DEFAULT_SECTIONS);
    },
    async saveSections(patch) {
      await setDoc(doc(db, "sections", "main"), patch, { merge: true });
      return this.getSections();
    },
    async replaceAll(data) {
      if (data.entries) for (const e of data.entries) await setDoc(doc(db, "entries", e.id), e, { merge: true });
      if (data.settings) await setDoc(doc(db, "settings", "main"), data.settings, { merge: true });
      if (data.sections) await setDoc(doc(db, "sections", "main"), data.sections, { merge: true });
    },
    async clearEntries() {
      for (const e of await this.listEntries()) await deleteDoc(doc(db, "entries", e.id));
    },
  };
}

let backend = null;
let cachedUser = null;

export function useBackend(b) {
  backend = b;
  cachedUser = null;
  return backend;
}

export function isDemo() {
  return !firebaseConfig;
}

export async function initStore() {
  if (backend) return backend;
  if (firebaseConfig) backend = await createFirebaseBackend(firebaseConfig);
  else backend = createDemoBackend(window.localStorage);
  return backend;
}

function need() {
  if (!backend) throw new Error("Store not started");
  return backend;
}

export async function login(opts = {}) {
  cachedUser = await need().signIn(opts);
  return cachedUser;
}

export async function logout() {
  await need().signOut();
  cachedUser = null;
}

export async function currentUser() {
  if (!backend) return null;
  if (cachedUser) return cachedUser;
  cachedUser = await backend.session();
  return cachedUser;
}

function requireUser(user) {
  if (!user) throw new Error("Please log in first");
  return user;
}

function stripMoney(row) {
  const copy = { ...row };
  for (const f of MONEY_FIELDS) delete copy[f];
  return copy;
}

export async function addEntry(entry) {
  const user = requireUser(await currentUser());
  if (!entry.type) throw new Error("Entry needs a type");
  if (user.role !== "owner" && OWNER_TYPES.includes(entry.type)) throw new Error("Only the owner can add this");
  const row = { ...entry, date: entry.date || localToday(), at: entry.at || new Date().toISOString(), by: user.uid, byName: user.name };
  row.atMs = new Date(row.at).getTime();
  delete row.id;
  return need().addEntry(row);
}

async function findEntry(id) {
  const row = await need().getEntry(id);
  if (!row) throw new Error("Entry not found");
  return row;
}

function checkCanChange(user, row) {
  if (user.role === "owner") return;
  if (row.by !== user.uid) throw new Error("You can only change your own entry");
  if (Date.now() - new Date(row.at).getTime() > EDIT_WINDOW_MS) throw new Error("Too late: entries can only be fixed for 10 minutes");
}

export async function updateEntry(id, patch) {
  const user = requireUser(await currentUser());
  const row = await findEntry(id);
  checkCanChange(user, row);
  const clean = { ...patch };
  delete clean.id;
  delete clean.by;
  delete clean.at;
  return need().updateEntry(id, clean);
}

export async function deleteEntry(id) {
  const user = requireUser(await currentUser());
  const row = await findEntry(id);
  checkCanChange(user, row);
  return need().deleteEntry(id);
}

export async function listEntries(filter = {}) {
  const user = requireUser(await currentUser());
  let rows = await need().listEntries(user.role === "owner" ? null : { by: user.uid, sinceMs: Date.now() - 86400000 });
  if (user.role !== "owner") {
    const today = localToday();
    rows = rows.filter((e) => e.by === user.uid && e.date === today).map(stripMoney);
  }
  if (filter.from) rows = rows.filter((e) => e.date >= filter.from);
  if (filter.to) rows = rows.filter((e) => e.date <= filter.to);
  if (filter.date) rows = rows.filter((e) => e.date === filter.date);
  if (filter.section) rows = rows.filter((e) => e.section === filter.section);
  if (filter.by) rows = rows.filter((e) => e.by === filter.by);
  if (filter.type) rows = rows.filter((e) => e.type === filter.type);
  return rows.sort((a, b) => (a.at < b.at ? 1 : -1));
}

export async function getSettings() {
  const user = requireUser(await currentUser());
  if (user.role !== "owner") throw new Error("Settings are the owner's");
  return need().getSettings();
}

export async function saveSettings(patch) {
  const user = requireUser(await currentUser());
  if (user.role !== "owner") throw new Error("Settings are the owner's");
  return need().saveSettings(patch);
}

export async function getSections() {
  requireUser(await currentUser());
  return stripMoney(await need().getSections());
}

export async function saveSections(patch) {
  const user = requireUser(await currentUser());
  if (user.role !== "owner") throw new Error("Only the owner can change the farm counts");
  return need().saveSections(patch);
}

export async function replaceAll(data) {
  requireUser(await currentUser());
  return need().replaceAll(data);
}

export async function clearEntries() {
  requireUser(await currentUser());
  return need().clearEntries();
}

