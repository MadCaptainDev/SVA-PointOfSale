// SVA Mart POS — Daily Earnings widget for Scriptable (iOS)
//
// Setup:
//   1. Paste this file into a new Scriptable script, name it "SVA Mart Earnings".
//   2. Run it once inside Scriptable and sign in with your POS email + password.
//      Only the login token is stored (in the iOS Keychain), never the password.
//   3. Add a Scriptable widget (small, medium or large) to the home screen,
//      long-press > Edit Widget > Script: "SVA Mart Earnings".
//   Run it inside Scriptable again any time to sign out / switch account.

const BASE_URL = "https://pos.svasilksandreadymades.com/api";
const TOKEN_KEY = "sva_mart_pos_token";
const REFRESH_MINUTES = 15;

const C = {
  bg: Color.dynamic(new Color("#FFFFFF"), new Color("#15171C")),
  text: Color.dynamic(new Color("#14161A"), new Color("#F2F3F5")),
  muted: Color.dynamic(new Color("#6B7280"), new Color("#9CA3AF")),
  accent: new Color("#7C3AED"),
  up: new Color("#16A34A"),
  down: new Color("#DC2626"),
};

const inr = (n, short = false) => {
  const v = Number(n) || 0;
  if (short && Math.abs(v) >= 100000) return "₹" + (v / 100000).toFixed(1) + "L";
  if (short && Math.abs(v) >= 1000) return "₹" + (v / 1000).toFixed(1) + "K";
  return "₹" + Math.round(v).toLocaleString("en-IN");
};

async function login() {
  const a = new Alert();
  a.title = "SVA Mart POS";
  a.message = "Sign in to show daily earnings";
  a.addTextField("Email");
  a.addSecureTextField("Password");
  a.addAction("Sign in");
  a.addCancelAction("Cancel");
  if ((await a.presentAlert()) === -1) return false;

  const req = new Request(BASE_URL + "/login");
  req.method = "POST";
  req.headers = { "Content-Type": "application/json", Accept: "application/json" };
  req.body = JSON.stringify({
    email: a.textFieldValue(0).trim().toLowerCase(),
    password: a.textFieldValue(1),
  });
  const res = await req.loadJSON();
  if (!res || !res.data || !res.data.token) {
    const e = new Alert();
    e.title = "Login failed";
    e.message = (res && res.message) || "Check email and password.";
    e.addAction("OK");
    await e.presentAlert();
    return false;
  }
  if (!(res.data.permissions || []).includes("manage_dashboard")) {
    const e = new Alert();
    e.title = "No dashboard access";
    e.message = "This user needs the Dashboard permission in SVA Mart POS.";
    e.addAction("OK");
    await e.presentAlert();
    return false;
  }
  Keychain.set(TOKEN_KEY, res.data.token);
  return true;
}

async function fetchEarnings() {
  if (!Keychain.contains(TOKEN_KEY)) return { error: "Open Scriptable to sign in" };
  const req = new Request(BASE_URL + "/widget/daily-earnings");
  req.headers = { Authorization: "Bearer " + Keychain.get(TOKEN_KEY), Accept: "application/json" };
  try {
    const res = await req.loadJSON();
    const status = req.response.statusCode;
    if (status === 401) {
      Keychain.remove(TOKEN_KEY);
      return { error: "Session expired — open Scriptable to sign in" };
    }
    if (status === 403) return { error: "No dashboard permission" };
    if (status !== 200 || !res.success) return { error: "Server error " + status };
    return { data: res.data };
  } catch (e) {
    return { error: "Offline — can't reach POS" };
  }
}

function sparkline(points, w, h) {
  const ctx = new DrawContext();
  ctx.size = new Size(w, h);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  const max = Math.max(...points, 1);
  const step = w / Math.max(points.length - 1, 1);
  const path = new Path();
  points.forEach((v, i) => {
    const p = new Point(i * step, h - 3 - (v / max) * (h - 6));
    i === 0 ? path.move(p) : path.addLine(p);
  });
  ctx.addPath(path);
  ctx.setStrokeColor(C.accent);
  ctx.setLineWidth(2.5);
  ctx.strokePath();
  return ctx.getImage();
}

function addText(stack, str, size, color, bold = false) {
  const t = stack.addText(str);
  t.font = bold ? Font.boldSystemFont(size) : Font.systemFont(size);
  t.textColor = color;
  t.lineLimit = 1;
  t.minimumScaleFactor = 0.6;
  return t;
}

function statRow(stack, label, value, color = C.text) {
  const row = stack.addStack();
  row.centerAlignContent();
  addText(row, label, 12, C.muted);
  row.addSpacer();
  addText(row, value, 12, color, true);
  stack.addSpacer(3);
}

function buildWidget(result, family) {
  const w = new ListWidget();
  w.backgroundColor = C.bg;
  w.setPadding(14, 14, 14, 14);
  w.refreshAfterDate = new Date(Date.now() + REFRESH_MINUTES * 60 * 1000);

  addText(w, "SVA MART · TODAY", 10, C.accent, true);
  w.addSpacer(4);

  if (result.error) {
    w.addSpacer();
    addText(w, result.error, 13, C.muted);
    w.addSpacer();
    return w;
  }

  const { today, yesterday, last_7_days, generated_at } = result.data;
  const change = yesterday.net_sales
    ? ((today.net_sales - yesterday.net_sales) / yesterday.net_sales) * 100
    : null;

  addText(w, inr(today.net_sales), family === "small" ? 26 : 30, C.text, true);
  const sub = w.addStack();
  addText(sub, `${today.bills} bills`, 11, C.muted);
  if (change !== null) {
    addText(sub, "  ·  ", 11, C.muted);
    addText(sub, `${change >= 0 ? "▲" : "▼"} ${Math.abs(change).toFixed(0)}% vs yday`, 11, change >= 0 ? C.up : C.down, true);
  }
  w.addSpacer(8);

  if (family === "small") {
    statRow(w, "Profit", inr(today.net_earning, true), today.net_earning >= 0 ? C.up : C.down);
    statRow(w, "Collected", inr(today.collected, true));
  } else {
    const cols = w.addStack();
    const left = cols.addStack();
    left.layoutVertically();
    statRow(left, "Net earning", inr(today.net_earning), today.net_earning >= 0 ? C.up : C.down);
    statRow(left, "Collected", inr(today.collected));
    statRow(left, "Returns", inr(today.returns));
    statRow(left, "Expenses", inr(today.expenses));
    cols.addSpacer(14);
    const right = cols.addStack();
    right.layoutVertically();
    addText(right, "7 DAYS", 9, C.muted, true);
    right.addSpacer(2);
    right.addImage(sparkline(last_7_days.map((d) => d.net_sales), 110, 50));

    if (family === "large") {
      w.addSpacer(10);
      addText(w, "COLLECTED BY MODE", 9, C.muted, true);
      w.addSpacer(4);
      const m = today.collected_by_mode;
      statRow(w, "Cash", inr(m.cash));
      statRow(w, "Bank transfer / UPI", inr(m.bank_transfer));
      statRow(w, "Cheque", inr(m.cheque));
      statRow(w, "Other", inr(m.other));
      w.addSpacer(6);
      statRow(w, "Gross sales", inr(today.sales));
      statRow(w, "Gross profit", inr(today.gross_profit));
      statRow(w, "Yesterday net sales", inr(yesterday.net_sales));
    }
  }

  w.addSpacer();
  const time = new Date(generated_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  addText(w, "Updated " + time, 9, C.muted);
  w.url = "https://pos.svasilksandreadymades.com";
  return w;
}

if (!config.runsInWidget) {
  if (Keychain.contains(TOKEN_KEY)) {
    const a = new Alert();
    a.title = "SVA Mart Earnings";
    a.addAction("Preview widget");
    a.addDestructiveAction("Sign out");
    a.addCancelAction("Close");
    const choice = await a.presentAlert();
    if (choice === 1) {
      Keychain.remove(TOKEN_KEY);
      await login();
    } else if (choice === -1) {
      Script.complete();
      return;
    }
  } else {
    await login();
  }
}

const widget = buildWidget(await fetchEarnings(), config.widgetFamily || "medium");
if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentMedium();
Script.complete();
