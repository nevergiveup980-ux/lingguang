const GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";
const ALLOWED_RANGES = new Set([1, 7, 30]);

const ANALYTICS_QUERY = `
query LingguangPulse($accountTag: string!, $start: Time!, $end: Time!, $host: string!) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      totals: rumPageloadEventsAdaptiveGroups(
        limit: 1
        filter: { datetime_geq: $start, datetime_leq: $end, requestHost: $host, bot: 0 }
      ) { count sum { visits } }
      trend: rumPageloadEventsAdaptiveGroups(
        limit: 100
        orderBy: [date_ASC]
        filter: { datetime_geq: $start, datetime_leq: $end, requestHost: $host, bot: 0 }
      ) { count sum { visits } dimensions { date } }
      pages: rumPageloadEventsAdaptiveGroups(
        limit: 100
        orderBy: [count_DESC]
        filter: { datetime_geq: $start, datetime_leq: $end, requestHost: $host, bot: 0 }
      ) { count sum { visits } dimensions { requestPath } }
      countries: rumPageloadEventsAdaptiveGroups(
        limit: 100
        orderBy: [count_DESC]
        filter: { datetime_geq: $start, datetime_leq: $end, requestHost: $host, bot: 0 }
      ) { count sum { visits } dimensions { countryName } }
      browsers: rumPageloadEventsAdaptiveGroups(
        limit: 100
        orderBy: [count_DESC]
        filter: { datetime_geq: $start, datetime_leq: $end, requestHost: $host, bot: 0 }
      ) { count sum { visits } dimensions { userAgentBrowser } }
      devices: rumPageloadEventsAdaptiveGroups(
        limit: 100
        orderBy: [count_DESC]
        filter: { datetime_geq: $start, datetime_leq: $end, requestHost: $host, bot: 0 }
      ) { count sum { visits } dimensions { deviceType } }
      referrers: rumPageloadEventsAdaptiveGroups(
        limit: 100
        orderBy: [count_DESC]
        filter: { datetime_geq: $start, datetime_leq: $end, requestHost: $host, bot: 0 }
      ) { count sum { visits } dimensions { refererHost } }
    }
  }
}`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({ ok: true, service: "LINGGUANG Pulse", readOnly: true });
    }

    if (url.pathname === "/api/analytics") {
      if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405 });
      const requestedDays = Number.parseInt(url.searchParams.get("days") || "7", 10);
      const days = ALLOWED_RANGES.has(requestedDays) ? requestedDays : 7;
      try {
        return json(await fetchAnalytics(env, days), 200, { "Cache-Control": "private, max-age=60" });
      } catch (error) {
        console.error("LINGGUANG Pulse analytics error", error);
        return json({ error: "Analytics query failed" }, 502, { "Cache-Control": "no-store" });
      }
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    return new Response(DASHBOARD_HTML, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
        "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff"
      }
    });
  }
};

async function fetchAnalytics(env, days) {
  if (!env.CF_ANALYTICS_TOKEN) throw new Error("Missing CF_ANALYTICS_TOKEN secret");
  if (!env.CF_ACCOUNT_ID) throw new Error("Missing CF_ACCOUNT_ID secret");

  const host = env.LINGGUANG_HOST || "lingguanghealth.com";
  const homeCountry = env.LINGGUANG_HOME_COUNTRY || "CA";
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CF_ANALYTICS_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      query: ANALYTICS_QUERY,
      variables: { accountTag: env.CF_ACCOUNT_ID, start: start.toISOString(), end: end.toISOString(), host }
    })
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(`Cloudflare GraphQL returned HTTP ${response.status}`);
  if (payload.errors?.length) throw new Error(payload.errors.map((item) => item.message).join("; "));

  const account = payload?.data?.viewer?.accounts?.[0];
  if (!account) throw new Error("No Cloudflare analytics account data returned");

  const totalRow = account.totals?.[0] || {};
  const pageViews = num(totalRow.count);
  const visits = num(totalRow.sum?.visits);
  const pages = combinePages(account.pages || []);
  const countries = normalizeGroups(account.countries, "countryName", "Unknown");
  const browsers = normalizeGroups(account.browsers, "userAgentBrowser", "Unknown");
  const devices = normalizeGroups(account.devices, "deviceType", "Unknown");
  const referrers = normalizeGroups(account.referrers, "refererHost", "Direct / no referrer");
  const trend = (account.trend || []).map((row) => ({
    date: row.dimensions?.date || "",
    views: num(row.count),
    visits: num(row.sum?.visits)
  }));
  const outsideHome = countries
    .filter((item) => item.name && item.name !== homeCountry && item.name !== "Unknown")
    .reduce((sum, item) => sum + item.views, 0);

  return {
    meta: {
      host,
      days,
      generatedAt: new Date().toISOString(),
      source: "Cloudflare Web Analytics / RUM",
      botsExcluded: true,
      readOnly: true,
      publicTrafficOnly: true
    },
    summary: {
      pageViews,
      visits,
      pagesPerVisit: visits > 0 ? round(pageViews / visits, 2) : 0,
      outsideHomeViews: outsideHome
    },
    trend,
    pages,
    countries,
    browsers,
    devices,
    referrers,
    note: "Aggregate public-site traffic only. No patient records, form contents, visitor identities, or IP addresses are queried or displayed."
  };
}

function combinePages(rows) {
  const map = new Map();
  for (const row of rows) {
    const raw = row.dimensions?.requestPath || "/";
    const name = raw === "/" || raw === "/index.html" ? "Homepage" : raw;
    const current = map.get(name) || { name, views: 0, visits: 0 };
    current.views += num(row.count);
    current.visits += num(row.sum?.visits);
    map.set(name, current);
  }
  return [...map.values()].sort((a, b) => b.views - a.views);
}

function normalizeGroups(rows = [], dimension, emptyLabel) {
  return rows.map((row) => ({
    name: row.dimensions?.[dimension] || emptyLabel,
    views: num(row.count),
    visits: num(row.sum?.visits)
  })).sort((a, b) => b.views - a.views);
}

function num(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}
function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders
    }
  });
}

const DASHBOARD_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>LINGGUANG Pulse</title>
<style>
:root{--bg:#eef4f0;--panel:#fbfdfb;--ink:#17352d;--muted:#718079;--line:#d7e1dc;--accent:#1f6b57;--soft:#edf3ef;--warn:#8b5b46}
*{box-sizing:border-box}html{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--bg);color:var(--ink)}body{margin:0;background:linear-gradient(180deg,#f7fbf8,#edf4f0);min-height:100vh}.shell{width:min(1160px,calc(100% - 32px));margin:auto;padding:30px 0 64px}.top{display:flex;justify-content:space-between;gap:18px;align-items:center;margin-bottom:54px}.brand{font-size:13px;font-weight:700;letter-spacing:.18em}.back{font-size:12px;color:var(--muted);text-decoration:none}.hero{display:grid;grid-template-columns:1.3fr .7fr;gap:28px;align-items:end;margin-bottom:26px}.eyebrow{margin:0 0 12px;color:var(--muted);font-size:11px;letter-spacing:.16em;text-transform:uppercase}.hero h1{font-family:Georgia,serif;font-size:clamp(50px,8vw,92px);font-weight:400;line-height:.92;letter-spacing:-.05em;margin:0}.hero p{color:var(--muted);line-height:1.65;font-size:14px}.status{display:flex;gap:8px;align-items:center;color:var(--accent);font-size:12px}.dot{width:7px;height:7px;background:var(--accent);border-radius:50%}.controls{border-top:1px solid var(--line);padding:16px 0 22px;display:flex;align-items:center;justify-content:space-between;gap:12px}.ranges{display:flex;gap:6px}.range,.refresh{border:1px solid var(--line);background:rgba(255,255,255,.65);border-radius:999px;padding:8px 13px;font:inherit;font-size:12px;color:var(--ink);cursor:pointer}.range.active{background:var(--ink);color:white;border-color:var(--ink)}.updated{font-size:11px;color:var(--muted)}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px}.metric,.panel{background:rgba(251,253,251,.82);border:1px solid var(--line);border-radius:18px}.metric{padding:20px}.label{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:14px}.value{font-family:Georgia,serif;font-size:40px;letter-spacing:-.04em}.sub{font-size:11px;color:var(--muted);margin-top:7px}.grid{display:grid;grid-template-columns:1.3fr .7fr;gap:12px}.panel{padding:22px;min-width:0}.panel.wide{grid-column:1/-1}.panel h2{font-family:Georgia,serif;font-size:24px;font-weight:400;margin:0 0 5px}.note{font-size:11px;color:var(--muted);margin-bottom:18px;line-height:1.5}.chart{height:210px;display:flex;align-items:flex-end;gap:7px;border-bottom:1px solid var(--line);padding-top:12px}.bar-wrap{flex:1;min-width:0;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:7px}.bar{width:min(36px,80%);background:var(--accent);border-radius:5px 5px 0 0;min-height:2px}.bar-value,.bar-label{font-size:9px}.bar-label{color:var(--muted);white-space:nowrap}table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.07em;padding:0 8px 10px 0;border-bottom:1px solid var(--line)}td{padding:10px 8px 10px 0;border-bottom:1px solid var(--soft)}th.num,td.num{text-align:right;padding-right:0}.name{max-width:360px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.loading,.error{text-align:center;padding:44px 18px;color:var(--muted)}.error{color:var(--warn)}.privacy{margin-top:18px;padding:16px;border:1px solid var(--line);border-radius:14px;color:var(--muted);font-size:11px;line-height:1.55}.footer{margin-top:22px;padding-top:16px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:12px;font-size:10px;color:var(--muted)}
@media(max-width:820px){.hero,.grid{grid-template-columns:1fr}.metrics{grid-template-columns:1fr 1fr}.hero{gap:12px}.top{margin-bottom:38px}.panel.wide{grid-column:auto}.footer{flex-direction:column}.updated{display:none}}
@media(max-width:480px){.shell{width:min(100% - 22px,1160px)}.metrics{grid-template-columns:1fr 1fr}.metric{padding:16px}.value{font-size:33px}.panel{padding:17px}.controls{align-items:flex-start}.hero h1{font-size:52px}}
</style>
</head>
<body><main class="shell">
<div class="top"><div class="brand">LINGGUANG HEALTH</div><a class="back" href="https://lingguanghealth.com/">Public site ↗</a></div>
<section class="hero"><div><p class="eyebrow">Private traffic intelligence</p><h1>LINGGUANG<br>Pulse</h1></div><div><p>Quiet, read-only visibility into aggregate traffic on the public LINGGUANG Health website.</p><div class="status"><span class="dot"></span><span>Public traffic only · privacy boundary active</span></div></div></section>
<div class="controls"><div class="ranges"><button class="range" data-days="1">1 day</button><button class="range active" data-days="7">7 days</button><button class="range" data-days="30">30 days</button></div><div><span class="updated" id="updated">Loading…</span> <button class="refresh" id="refresh">Refresh</button></div></div>
<div id="app"><div class="loading">Loading aggregate analytics…</div></div>
<div class="privacy">LINGGUANG Pulse intentionally excludes patient records, assessment answers, contact-form contents, clinical data, visitor identities and IP addresses. Cloudflare Web Analytics aggregate data only.</div>
<div class="footer"><span>LINGGUANG Pulse V0.1</span><span>Read-only · noindex · Cloudflare Access protected</span></div>
</main>
<script>
const app=document.getElementById('app');const updated=document.getElementById('updated');let days=7;
document.querySelectorAll('.range').forEach(b=>b.addEventListener('click',()=>{days=Number(b.dataset.days);document.querySelectorAll('.range').forEach(x=>x.classList.toggle('active',x===b));load()}));
document.getElementById('refresh').addEventListener('click',load);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function table(title,note,rows){const total=rows.reduce((s,r)=>s+r.views,0)||1;return '<section class="panel"><h2>'+esc(title)+'</h2><div class="note">'+esc(note)+'</div><table><thead><tr><th>Name</th><th class="num">Views</th><th class="num">Share</th></tr></thead><tbody>'+rows.slice(0,12).map(r=>'<tr><td class="name" title="'+esc(r.name)+'">'+esc(r.name)+'</td><td class="num">'+r.views.toLocaleString()+'</td><td class="num">'+((r.views/total)*100).toFixed(1)+'%</td></tr>').join('')+'</tbody></table></section>'}
function render(d){const m=d.summary;const max=Math.max(1,...d.trend.map(x=>x.views));app.innerHTML='<section class="metrics"><div class="metric"><div class="label">Page Views</div><div class="value">'+m.pageViews.toLocaleString()+'</div><div class="sub">public page loads</div></div><div class="metric"><div class="label">Visits</div><div class="value">'+m.visits.toLocaleString()+'</div><div class="sub">Cloudflare visit metric</div></div><div class="metric"><div class="label">Pages / Visit</div><div class="value">'+m.pagesPerVisit+'</div><div class="sub">aggregate ratio</div></div><div class="metric"><div class="label">Outside Canada</div><div class="value">'+m.outsideHomeViews.toLocaleString()+'</div><div class="sub">geographic signal only</div></div></section><section class="grid"><section class="panel wide"><h2>Daily trend</h2><div class="note">Page views over the selected range.</div><div class="chart">'+d.trend.map(r=>'<div class="bar-wrap"><span class="bar-value">'+r.views+'</span><div class="bar" style="height:'+Math.max(2,(r.views/max)*145)+'px"></div><span class="bar-label">'+esc((r.date||'').slice(5))+'</span></div>').join('')+'</div></section>'+table('Top public pages','No form contents or patient data.',d.pages)+table('Countries','Aggregate location distribution.',d.countries)+table('Browsers','Browser family only.',d.browsers)+table('Devices','Aggregate device class.',d.devices)+'<section class="panel wide">'+tableInner('Referrers','Where public-site visits arrived from.',d.referrers)+'</section></section>';
updated.textContent='Updated '+new Date(d.meta.generatedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});}
function tableInner(title,note,rows){const total=rows.reduce((s,r)=>s+r.views,0)||1;return '<h2>'+esc(title)+'</h2><div class="note">'+esc(note)+'</div><table><thead><tr><th>Name</th><th class="num">Views</th><th class="num">Share</th></tr></thead><tbody>'+rows.slice(0,15).map(r=>'<tr><td class="name">'+esc(r.name)+'</td><td class="num">'+r.views.toLocaleString()+'</td><td class="num">'+((r.views/total)*100).toFixed(1)+'%</td></tr>').join('')+'</tbody></table>'}
async function load(){app.innerHTML='<div class="loading">Loading aggregate analytics…</div>';updated.textContent='Loading…';try{const r=await fetch('/api/analytics?days='+days,{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Request failed');render(d)}catch(e){app.innerHTML='<div class="error">Unable to load analytics. Check the read-only Cloudflare token, account ID, and Web Analytics setup.</div>';updated.textContent='Load failed'}}
load();
</script>
</body></html>`;
