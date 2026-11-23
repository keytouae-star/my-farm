// My Farm calculations: pure functions only. No DOM, no storage, no dates from the clock
// unless passed in. Money is AED, rounded to 2 decimals at the end of each step.

export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
export const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;

// F10: the app's date format everywhere: 22 Oct 2026.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function fmtDate(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  return Number(d) + " " + (MONTHS[Number(m) - 1] || "") + " " + y;
}

// PLAN §4: layer feed is shared by head count, weighted chicken 1, duck 1.5, pigeon 1/3.
export const FEED_WEIGHT = { chicken: 1, duck: 1.5, pigeon: 1 / 3 };

export function splitLayerFeed({ amount, chickens = 0, pigeons = 0, ducks = 0 }) {
  const parts = {
    chickens: chickens * FEED_WEIGHT.chicken,
    ducks: ducks * FEED_WEIGHT.duck,
    pigeons: pigeons * FEED_WEIGHT.pigeon,
  };
  const total = parts.chickens + parts.ducks + parts.pigeons;
  const share = (w) => (total ? round2((amount * w) / total) : 0);
  return { chickens: share(parts.chickens), ducks: share(parts.ducks), pigeons: share(parts.pigeons), totalWeight: total };
}

// PLAN §4: RO water. Fig trees get the owner's %; the rest is split between all animals by head count.
export function splitRO({ amount, figShare, heads = {} }) {
  const figs = round2((amount * (figShare || 0)) / 100);
  const rest = round2(amount - figs);
  const totalHeads = Object.values(heads).reduce((a, b) => a + (Number(b) || 0), 0);
  const shares = {};
  for (const [k, v] of Object.entries(heads)) shares[k] = totalHeads ? round2((rest * (Number(v) || 0)) / totalHeads) : 0;
  return { figs, rest, shares, totalHeads };
}

// PLAN §4: fertilizer and spray are spread evenly over 12 months.
export function fertilizerPerMonth({ amounts = [] }) {
  const total = amounts.reduce((a, b) => a + (Number(b) || 0), 0);
  return round2(total / 12);
}

// F11: shared costs reach the animals. Returns a NEW entries list for the stats only;
// the original entries stay as they are for the Entries list and Excel "Entries" sheet.
const monthOf = (iso) => String(iso || "").slice(0, 7);
const pad2 = (n) => String(n).padStart(2, "0");
function addMonths(key, n) {
  const [y, m] = key.split("-").map(Number);
  const i = y * 12 + (m - 1) + n;
  return Math.floor(i / 12) + "-" + pad2((i % 12) + 1);
}
const nowMonth = (now) => now.getFullYear() + "-" + pad2(now.getMonth() + 1);

// Head counts as they are now, used for every month (F11).
export function headCounts(counts = {}) {
  const ch = counts.chickens || {};
  const chickens = Object.values(ch.groups || {}).reduce((a, g) => a + (Number(g.roosters) || 0) + (Number(g.hens) || 0), 0);
  const ck = counts.chicks || {};
  const chicks = (Number(ck.starter) || 0) + (Number(ck.grower) || 0) + (Number(ck.males) || 0) + (Number(ck.females) || 0);
  const p = counts.pigeons || {};
  const pigeons = (Number(p.males) || 0) + (Number(p.females) || 0) + (Number(p.young) || 0) + (Number(p.flying) || 0);
  const r = counts.rabbits || {};
  const rabbits = (Number(r.males) || 0) + (Number(r.females) || 0) + (Number(r.young) || 0);
  return { chickens, chicks, pigeons, rabbits };
}

export function allocateShared({ entries = [], settings = {}, counts = {}, now = new Date() }) {
  const splits = settings.splits || {};
  const elec = splits.electricity || {};
  const lab = splits.labour || {};
  const figShare = Number(splits.roFigShare) || 0;
  const salary = Number(settings.salary) || 0;
  const heads = headCounts(counts);
  const ducks = Number((counts.ducks || {}).count) || 0;
  const out = [];
  const labourPool = {};
  const roPool = {};
  const push = (section, amount, date, from) => {
    const amt = round2(amount);
    if (amt > 0) out.push({ type: "share", section, amount: amt, date, from });
  };
  const add = (pool, month, amount) => { if (amount) pool[month] = (pool[month] || 0) + amount; };

  for (const e of entries) {
    const month = monthOf(e.date);
    if (e.type === "bill" && e.kind === "electricity") {
      const amt = Number(e.amount) || 0;
      const inc = round2(amt * ((Number(elec.incubator) || 0) / 100));
      const ro = round2(amt * ((Number(elec.ro) || 0) / 100));
      const house = round2(amt * ((Number(elec.house) || 0) / 100));
      const other = round2(amt * ((Number(elec.other) || 0) / 100));
      push("incubators", inc, e.date, "electricity:incubator");
      push("farm", other, e.date, "electricity:other");
      push("farm", round2(amt - inc - ro - house - other), e.date, "electricity:leftover");
      add(roPool, month, ro);
      add(labourPool, month, house);
    } else if (e.type === "bill" && e.kind === "ro") {
      add(roPool, month, Number(e.amount) || 0);
    } else if (e.type === "bought" && (e.what === "roFilters" || e.what === "roChemicals")) {
      add(roPool, month, Number(e.price) || 0);
    } else if (e.type === "bought" && e.what === "layer") {
      const parts = splitLayerFeed({ amount: Number(e.price) || 0, chickens: heads.chickens, pigeons: heads.pigeons, ducks });
      push("chickens", parts.chickens, e.date, "layer feed");
      push("pigeons", parts.pigeons, e.date, "layer feed");
      push("ducks", parts.ducks, e.date, "layer feed");
    } else if (e.type === "bought" && (e.what === "fertilizer" || e.what === "spray")) {
      const per = round2((Number(e.price) || 0) / 12);
      for (let i = 0; i < 12; i++) push("figs", per, addMonths(month, i) + "-01", e.what);
    } else {
      out.push(e);
    }
  }

  // Salary: one labour pool a month, from the first entry's month to now.
  const dated = entries.map((e) => e.date).filter(Boolean).sort();
  const first = dated.length ? monthOf(dated[0]) : null;
  if (first && salary) {
    const last = nowMonth(now);
    const end = first > last ? first : last;
    let m = first;
    while (m <= end) { add(labourPool, m, salary); m = addMonths(m, 1); }
  }

  // Labour pool (salary + the house share of electricity), split by the labour %.
  // "other" and anything the boxes leave over stay under Farm general.
  for (const [month, pool] of Object.entries(labourPool)) {
    if (!pool) continue;
    let used = 0;
    for (const key of ["chickens", "chicks", "pigeons", "rabbits", "figs", "tilapia"]) {
      const amt = round2(pool * ((Number(lab[key]) || 0) / 100));
      if (amt > 0) { push(key, amt, month + "-01", "labour"); used += amt; }
    }
    push("farm", round2(pool - used), month + "-01", "labour:other");
  }

  // RO pool (RO bills + filters and chemicals + the RO electricity share).
  for (const [month, pool] of Object.entries(roPool)) {
    if (!pool) continue;
    const split = splitRO({ amount: pool, figShare, heads });
    push("figs", split.figs, month + "-01", "ro:figs");
    for (const [key, amt] of Object.entries(split.shares)) push(key, amt, month + "-01", "ro:heads");
  }
  return out;
}

// PLAN §5: cost per unit = all costs of the section ÷ all units produced
// (including those used at home, thrown away or died).
export function costPerUnit({ costs = 0, units = 0 }) {
  return units ? round2(costs / units) : 0;
}

// PLAN §5: cost per egg counts every egg laid, sold, eaten or thrown.
export function costPerEgg({ cost, eggs, sold = 0, home = 0, shopPrice = 0 }) {
  const perEgg = eggs ? round2(cost / eggs) : 0;
  return { perEgg, homeValue: round2(home * shopPrice), sold, home };
}

// PLAN §5: cost per rooster includes the birds that died.
export function costPerRooster({ batchCost, males, died = 0 }) {
  const sold = Math.max(0, males - died);
  return sold ? round2(batchCost / sold) : 0;
}

// PLAN §5: hatch rate = hatched ÷ eggs set (clear eggs at candling do not change the denominator).
export function hatchRate({ set, clear = 0, hatched }) {
  return set ? round1((hatched / set) * 100) : 0;
}

// PLAN §5: green below the local range, amber inside it, red above it.
export function localPriceCheck({ cost, low, high }) {
  if (cost < low) return "green";
  if (cost <= high) return "amber";
  return "red";
}

export const PRICE_ADVICE = {
  green: "Your cost is below what buyers pay. Good.",
  amber: "Your cost is inside the local range: only sales near the top make money.",
  red: "Your cost is above the local range. Sell younger, keep fewer males, or change feed.",
};

// PLAN §5: suggested price = cost per unit + margin.
export function suggestedPrice({ cost, marginPct }) {
  return round2(cost * (1 + (marginPct || 0) / 100));
}

// PLAN §5: cash profit and home value are shown apart, never mixed.
export function cashProfit({ sales = 0, costs = 0 }) {
  return round2(sales - costs);
}

export function homeValue({ home = 0, shopPrice = 0 }) {
  return round2(home * shopPrice);
}

export function totalBenefit({ cash = 0, home = 0 }) {
  return round2(cash + home);
}

// PLAN §5: payback. "started X behind, now Y behind, about Z months to break even at this pace".
export function payback({ behind, profitPerMonth }) {
  const months = profitPerMonth > 0 ? round1(behind / profitPerMonth) : null;
  return { behind: round2(behind), months };
}

export function paybackNow({ startBehind, profitToDate }) {
  const nowBehind = round2(startBehind - profitToDate);
  return { startedBehind: round2(startBehind), nowBehind, months: null };
}

// PLAN §5: sell now when the next 2 weeks' feed costs more than the extra price the bird will fetch.
export function sellNow({ feedCost2w, extraPrice }) {
  return feedCost2w > extraPrice ? "sell now" : "keep growing";
}

// PLAN §3 / §5: salary due, paid by the owner, taken from sales, still owed.
export function salaryOwed({ due, paidByOwner = 0, fromSales = 0 }) {
  return round2(Math.max(0, due - paidByOwner - fromSales));
}

// PLAN §5: "based on N weeks of entries" = whole weeks since the section's first entry.
export function weeksBasedOn(firstDate, now = new Date()) {
  if (!firstDate) return 0;
  const start = new Date(firstDate + "T00:00:00");
  const days = Math.floor((now - start) / 86400000);
  return Math.max(0, Math.floor(days / 7));
}

// PLAN §6: Keep / Watch / Drop, judged on at least 3 months.
export function keepWatchDrop({ months = 0, cash = 0, home = 0 }) {
  if (months < 3) return null;
  if (cash > 0) return "keep";
  if (cash + home > 0) return "watch";
  return "drop";
}

// PLAN §6 screen 5: "when to start the 400" — eggs per day to fill it in N days,
// against eggs per day now, and how many more laying hens that means.
export function start400Helper({ target = 400, days = 7, eggsPerDayNow = 0, eggsPerHenPerDay = 0.6 }) {
  const needed = round1(target / days);
  const more = round1(Math.max(0, needed - eggsPerDayNow));
  const moreHens = eggsPerHenPerDay > 0 ? Math.ceil(more / eggsPerHenPerDay) : 0;
  return { needed, now: round1(eggsPerDayNow), more, moreHens };
}

// PLAN §6 screen 1: the three goal steps tick off as they are reached.
export function goalSteps({ monthCash = 0, profitToDate = 0, startBehind = 0, totalBenefit = 0 }) {
  return [
    { n: 1, label: "Covers feed and salary", done: monthCash >= 0 },
    { n: 2, label: "Break even on start-up costs", done: startBehind > 0 && profitToDate >= startBehind },
    { n: 3, label: "Profit", done: totalBenefit > 0 },
  ];
}

// PLAN §5 and §6: one section's numbers for a period, from its entries.
export function sectionStats({ entries = [], section, settings = {}, shopPrices = {}, counts = null }) {
  const rows = entries.filter((e) => (e.section || "farm") === section);
  const realRows = rows.filter((e) => e.type !== "share");
  let sales = 0, costs = 0, home = 0, died = 0, eggs = 0;
  const byKind = {};
  const bump = (kind, n) => { byKind[kind] = (byKind[kind] || 0) + (Number(n) || 0); };
  const months = new Set(realRows.map((e) => (e.date || "").slice(0, 7)).filter(Boolean));
  for (const e of rows) {
    if (e.type === "share") costs += Number(e.amount) || 0;
    if (e.type === "sold") { sales += Number(e.price) || 0; bump(e.what || "bird", e.count); }
    if (e.type === "bought") costs += Number(e.price) || 0;
    if (e.type === "bill") costs += Number(e.amount) || 0;
    if (e.type === "health") costs += Number(e.cost) || 0;
    if (e.type === "home") {
      home += (Number(e.count) || 0) * (shopPrices[e.what] ?? 0);
      bump(e.what || "bird", e.count);
    }
    if (e.type === "died") { died += Number(e.count) || 0; bump(e.what || "bird", e.count); }
    if (e.type === "eggs") { eggs += Number(e.eggs) || 0; bump("eggs", e.eggs); }
    if (e.type === "figs") bump("figs", (Number(e.kg) || 0) + (Number(e.thrown) || 0));
  }
  const cash = round2(sales - costs);
  const homeVal = round2(home);
  const units = Object.values(byKind).reduce((a, b) => a + b, 0);
  const kinds = Object.entries(byKind).sort((a, b) => b[1] - a[1]);
  const mainKind = kinds.length ? kinds[0][0] : null;
  const costByKind = {};
  // Each product carries the section's costs over its own count. Roosters are the exception:
  // PLAN §5 says the females join the flock, so the males carry the batch cost alone,
  // and the birds that died are still part of the cost (worked example 5).
  for (const [kind, n] of Object.entries(byKind)) {
    let denom = n;
    if (kind === "rooster") {
      const raised = Number(counts && counts.males) || n;
      denom = Math.max(0, raised - died);
    }
    costByKind[kind] = denom ? round2(costs / denom) : 0;
  }
  const perUnit = mainKind ? costByKind[mainKind] : 0;
  const first = realRows.map((e) => e.date).filter(Boolean).sort()[0];
  const monthCount = months.size;
  return {
    section, entries: realRows.length, sales: round2(sales), costs: round2(costs), home: homeVal,
    cash, benefit: round2(cash + homeVal), units, unitsByKind: byKind, mainKind, costByKind,
    died, eggs, costPerUnit: perUnit,
    months: monthCount, weeks: weeksBasedOn(first),
    badge: keepWatchDrop({ months: monthCount, cash, home: homeVal }),
  };
}

// PLAN §7 / §6 screen 1: a sale under the section's "don't sell below" figure for that product.
export function salesBelowMinimum({ entries = [], stats = [] }) {
  const out = [];
  for (const e of entries) {
    if (e.type !== "sold" || !e.count) continue;
    const kind = e.what || "bird";
    if (kind === "eggs") continue;
    const s = stats.find((x) => x.section === (e.section || "farm"));
    const minimum = s && s.costByKind ? s.costByKind[kind] || 0 : 0;
    if (!minimum) continue;
    const each = round2((Number(e.price) || 0) / Number(e.count));
    if (each < minimum) out.push({ entry: e, each, minimum, section: s.section, kind });
  }
  return out;
}

// PLAN §5: egg log per group — eggs per day and eggs per hen per day, side by side.
export function eggLog({ entries = [], counts = {} }) {
  const groups = Object.keys((counts && counts.groups) || { A: {}, B: {}, C: {} });
  return groups.map((g) => {
    const rows = entries.filter((e) => e.type === "eggs" && e.group === g);
    const total = rows.reduce((a, e) => a + (Number(e.eggs) || 0), 0);
    const days = new Set(rows.map((e) => e.date)).size;
    const hens = Number((counts.groups && counts.groups[g] && counts.groups[g].hens) || 0);
    const perDay = days ? total / days : 0;
    return { group: g, eggs: total, days, perDay: round1(perDay), perHen: hens ? round1(perDay / hens) : 0, hens };
  });
}

// PLAN §5: one incubator batch — hatch rate and cost per chick.
export function batchStats({ batch = {}, entries = [], costPerEgg = 0, incubatorElectric = 0 }) {
  const set = Number(batch.eggs) || 0;
  const clear = Number(batch.clear) || 0;
  const hatched = entries
    .filter((e) => e.type === "born" && e.kind === "chicks" && (!batch.date || e.date >= batch.date))
    .reduce((a, e) => a + (Number(e.count) || 0), 0);
  const died = entries
    .filter((e) => e.type === "died" && e.section === "chicks")
    .reduce((a, e) => a + (Number(e.count) || 0), 0);
  const feed = entries
    .filter((e) => e.type === "bought" && e.section === "chicks")
    .reduce((a, e) => a + (Number(e.price) || 0), 0);
  const cost = set * costPerEgg + (Number(incubatorElectric) || 0) + feed;
  const alive = Math.max(0, hatched - died);
  return { set, clear, hatched, died, hatchRate: hatchRate({ set, clear, hatched }), cost: round2(cost), costPerChick: alive ? round2(cost / alive) : 0 };
}

// PLAN §5: pigeons — costs so far this year against the December sales, and the floor price.
export function pigeonStats({ entries = [], counts = {}, year = new Date().getFullYear() }) {
  const rows = entries.filter((e) => e.section === "pigeons" && (e.date || "").startsWith(String(year)));
  const costs = rows.filter((e) => ["bought", "bill", "health"].includes(e.type)).reduce((a, e) => a + (Number(e.price ?? e.amount ?? e.cost) || 0), 0);
  const sales = rows.filter((e) => e.type === "sold").reduce((a, e) => a + (Number(e.price) || 0), 0);
  const flying = Number(counts.flying) || 0;
  return { costs: round2(costs), sales: round2(sales), flying, floorPrice: flying ? round2(costs / flying) : 0 };
}

// PLAN §6 screen 6: what a number of ducks would cost to buy and to keep.
// F8: a hen lays at most about one egg a day, so the rate is all eggs over all laying hens.
export function eggsPerHenPerDay({ eggsPerDay = 0, hens = 0 }) {
  return hens ? round1(eggsPerDay / hens) : 0;
}

// F9: what a number of ducks would cost to buy and to keep.
// Water is the ducks' head-count share of the RO cost after the fig trees take their %.
// Labour is the share of the salary the owner types on the card (default 5%).
export function ducksPlan({ count = 0, priceEach = 40, monthlyLayerFeed = 0, heads = {}, roMonthly = 0, figShare = 0, labourPct = 5, salary = 0 }) {
  const purchase = round2(count * priceEach);
  const feed = splitLayerFeed({ amount: monthlyLayerFeed, chickens: heads.chickens || 0, pigeons: heads.pigeons || 0, ducks: count }).ducks;
  const water = splitRO({ amount: roMonthly, figShare, heads: { ...heads, ducks: count } }).shares.ducks || 0;
  const labour = round2((Number(salary) || 0) * ((Number(labourPct) || 0) / 100));
  return { purchase, feed, water, labour, monthly: round2(feed + water + labour) };
}

// PLAN §6 screen 8: the month's numbers for every section, best and worst.
export function monthlySummary({ stats = [] }) {
  const rows = stats.filter((s) => s.entries > 0).map((s) => ({ section: s.section, cash: s.cash, home: s.home, benefit: s.benefit }));
  const sorted = [...rows].sort((a, b) => b.benefit - a.benefit);
  return { rows, best: sorted[0] || null, worst: sorted[sorted.length - 1] || null };
}

// PLAN §7: what is due. Pure: give it the entries and today's date, it returns the list.
export function reminders({ entries = [], settings = {}, now = new Date() }) {
  const dayMs = 86400000;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const parse = (d) => new Date(String(d).slice(0, 10) + "T00:00:00");
  const daysTo = (d) => Math.round((d - today) / dayMs);
  const out = [];
  const push = (kind, days, title, detail) => {
    if (days > 7 || days < -7) return;
    out.push({ kind, days, title, detail, due: days <= 0 });
  };

  for (const b of entries.filter((e) => e.type === "incubatorBatch")) {
    const set = parse(b.date);
    for (const [label, day] of [["Candling", 7], ["Last turn", 18], ["Hatch", 21]]) {
      const left = daysTo(new Date(set.getTime() + day * dayMs));
      push("incubator", left, label + (left < 0 ? " was due " + -left + " days ago" : left === 0 ? " today" : " in " + left + " days"),
        b.eggs + " eggs set " + fmtDate(b.date));
    }
  }

  const born = entries.filter((e) => e.type === "born" && e.kind === "chicks").map((e) => e.date).sort().pop();
  if (born) {
    const weeks = Number(settings.stageAges && settings.stageAges.starterWeeks) || 4;
    const left = daysTo(new Date(parse(born).getTime() + weeks * 7 * dayMs));
    push("chicks", left, "Move the chicks to the grower stage" + (left < 0 ? " (late)" : ""), "Hatched " + fmtDate(born));
  }

  const weighed = entries.filter((e) => e.type === "weighed").map((e) => e.date).sort().pop();
  if (weighed) {
    const left = daysTo(new Date(parse(weighed).getTime() + 14 * dayMs));
    push("weigh", left, "Weigh-in day" + (left < 0 ? " (late)" : ""), "Last weigh-in " + fmtDate(weighed));
  }

  for (const feed of ["layer", "grower", "starter"]) {
    const opens = entries.filter((e) => e.type === "openedFeed" && e.feed === feed).map((e) => e.date).sort();
    if (opens.length < 2) continue;
    const gaps = [];
    for (let i = 1; i < opens.length; i++) gaps.push((parse(opens[i]) - parse(opens[i - 1])) / dayMs);
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    if (!avg) continue;
    const left = daysTo(new Date(parse(opens[opens.length - 1]).getTime() + avg * dayMs));
    if (left <= 3) push("feed", left, "About " + Math.max(0, left) + " days of " + feed + " feed left", "A bag lasts about " + Math.round(avg) + " days");
  }

  if (settings.roFilterDate) {
    push("ro", daysTo(parse(settings.roFilterDate)), "RO filter change", "Set for " + fmtDate(settings.roFilterDate));
  }

  if (today.getDate() === 1) push("backup", 0, "Save the monthly Excel backup", "The 1st of the month");

  return out.sort((a, b) => a.days - b.days);
}

export function monthlyBySection(entries) {
  const out = {};
  for (const e of entries) {
    const month = (e.date || "").slice(0, 7);
    const section = e.section || "farm";
    out[month] = out[month] || {};
    out[month][section] = out[month][section] || { sales: 0, costs: 0, home: 0 };
    const cell = out[month][section];
    if (e.type === "sold") cell.sales += Number(e.price) || 0;
    if (e.type === "bought" || e.type === "bill" || e.type === "health") cell.costs += Number(e.price ?? e.amount ?? e.cost) || 0;
    if (e.type === "share") cell.costs += Number(e.amount) || 0;
    if (e.type === "home") cell.home += 1;
  }
  for (const month of Object.keys(out)) {
    for (const section of Object.keys(out[month])) {
      const c = out[month][section];
      c.sales = round2(c.sales);
      c.costs = round2(c.costs);
      c.cash = round2(c.sales - c.costs);
    }
  }
  return out;
}
