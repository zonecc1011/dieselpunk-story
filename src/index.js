const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

function cors(response, origin) {
  const h = new Headers(response.headers);
  h.set("access-control-allow-origin", origin || "null");
  h.set("access-control-allow-headers", "content-type, authorization");
  h.set("access-control-allow-methods", "GET, POST, OPTIONS");
  h.set("vary", "Origin");
  return new Response(response.body, { status: response.status, headers: h });
}
function auth(req, env) {
  const expected = env.ADMIN_TOKEN;
  if (!expected) return false;
  return req.headers.get("authorization") === `Bearer ${expected}`;
}
async function body(req) { try { return await req.json(); } catch { return {}; } }
async function rows(db, sql, ...args) { return (await db.prepare(sql).bind(...args).all()).results || []; }
async function one(db, sql, ...args) { return db.prepare(sql).bind(...args).first(); }

const seedBible = {
  title: "A CIDADE DE FERRO",
  genre: "Dieselpunk, mistério, aventura e ficção especulativa",
  premise: "Em 1937 de uma linha do tempo alternativa, a cidade vertical de Ferrúria sobrevive graças a um motor colossal enterrado sob suas fundações. Quando o motor começa a emitir sinais impossíveis, moradores comuns descobrem que a cidade foi construída sobre um segredo.",
  era: "1937 alternativo, tecnologia diesel-elétrica, dirigíveis, rádios valvulados, aço rebitado e neblina industrial.",
  visual: "Dieselpunk cinematográfico; carvão, cobre envelhecido, verde-petróleo, âmbar de lâmpadas, chuva, fumaça volumétrica, textura analógica e arquitetura monumental.",
  rules: [
    "A história é ficcional; não afirmar que eventos fictícios são notícias reais.",
    "Personagens de seguidores só entram no cânone após aprovação do administrador.",
    "Não matar, humilhar ou atribuir ações criminosas a personagens de seguidores sem consentimento.",
    "Decisões que alterem o mistério central, destino de personagens principais ou regras do universo exigem aprovação.",
    "Manter cronologia, locais, objetos e relações consistentes."
  ],
  cast: [
    { name: "Mara Voss", role: "mecânica de locomotivas", trait: "curiosa, prática e desconfiada", secret: "ouve uma voz codificada nos motores desligados" },
    { name: "Elias Rook", role: "locutor da Rádio 9", trait: "carismático, observador e cauteloso", secret: "recebe transmissões datadas de amanhã" },
    { name: "Doutora Íris Vale", role: "engenheira-chefe do subsolo", trait: "brilhante e reservada", secret: "conhece a origem do motor, mas omite parte dela" }
  ],
  canon: [],
  season: 1
};

function makeEpisode(number, previous = "") {
  const beats = [
    { title: "A Frequência Debaixo da Cidade", synopsis: "Um sinal atravessa os rádios de Ferrúria durante um apagão de onze segundos.", script: "ABERTURA — A chuva risca as janelas da Rádio 9. Todos os relógios param às 03:17.\n\nELIAS (no microfone): Se alguém estiver ouvindo, não responda à voz que vem pelo fio vermelho.\n\nMARA (pelo rádio): Elias, o motor está desligado. Então por que a cidade está respirando?\n\nUma sequência de três batidas ecoa sob o estúdio. No painel, uma luz âmbar acende sozinha. O alto-falante pronuncia o nome de Mara — com a voz dela, mas muito mais velha.\n\nCORTE PARA PRETO. Texto: 'A transmissão não terminou.'"},
    { title: "O Mapa que Não Existia", synopsis: "Mara encontra um mapa novo gravado na fuligem de uma parede centenária.", script: "ABERTURA — Mara ilumina a parede com uma lanterna. Sob a fuligem surge o desenho de túneis que não aparecem em nenhuma planta.\n\nMARA: Isso não foi desenhado. Foi queimado por dentro.\n\nElias compara o mapa com a transmissão. Os túneis formam o símbolo da Rádio 9. Um ponto pulsa sob a estação central.\n\nELIAS: Alguém construiu a cidade ao redor de uma mensagem.\n\nAo longe, um trem sem maquinista acende seus faróis. CORTE."},
    { title: "O Trem das 03:17", synopsis: "Um trem sem maquinista chega à plataforma lacrada da estação central.", script: "ABERTURA — Trilhos vibram sob uma estação abandonada. Um trem negro chega sem emitir ruído.\n\nMARA: Essa linha foi fechada há quarenta anos.\n\nAs portas se abrem. Dentro, há jornais com a data de amanhã e uma fotografia de três pessoas diante do motor subterrâneo. Uma delas ainda não nasceu.\n\nÍRIS (no escuro): Vocês não deveriam ter encontrado a plataforma.\n\nAs luzes apagam. Uma porta bate no último vagão. CORTE."}
  ];
  const beat = beats[(number - 1) % beats.length];
  return { id: uid(), number, title: beat.title, synopsis: beat.synopsis, script: beat.script + (previous ? "\n\nCONTINUIDADE: " + previous : ""), caption: `FERRÚRIA, 03:17. ${beat.synopsis}\n\nO que você faria? Comente sua teoria. Personagens da comunidade podem entrar na história após análise e aprovação.\n\n#CidadeDeFerro #Dieselpunk #HistoriaInterativa #Ficcao #Reels`, hashtags: "#CidadeDeFerro #Dieselpunk #HistoriaInterativa #Ficcao #Reels", status: "draft" };
}

async function generateEpisode(env, number, previous) {
  if (env.GEMINI_API_KEY) {
    try {
      const prompt = `Escreva um roteiro vertical de 30-45 segundos para a série dieselpunk A CIDADE DE FERRO. Episódio ${number}. Continuidade: ${previous || "início da série"}. Respeite o cânone: 1937 alternativo, Ferrúria, Mara Voss mecânica, Elias Rook locutor, Íris Vale engenheira, motor colossal subterrâneo, mistério de sinais impossíveis. Retorne JSON válido com title, synopsis, script, caption, hashtags. Não resolva o mistério central. Termine com gancho e uma pergunta ao público.`;
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.85 } }) });
      if (r.ok) {
        const data = await r.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (raw) return { ...JSON.parse(raw), id: uid(), number, status: "draft" };
      }
    } catch (e) { console.error("AI fallback:", e); }
  }
  return makeEpisode(number, previous);
}

async function graph(env, path, token, params = {}, method = "GET") {
  const base = `https://graph.instagram.com/${env.META_GRAPH_VERSION || "v26.0"}/${path.replace(/^\//, "")}`;
  const url = new URL(base);
  if (method === "GET") for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  const r = await fetch(url, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: method === "GET" ? undefined : JSON.stringify(params) });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || `Instagram API error ${r.status}`);
  return data;
}

async function api(req, env, ctx) {
  const url = new URL(req.url);
  const path = url.pathname;
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (path === "/api/health") return json({ ok: true, app: "dieselpunk-story", timestamp: now(), configured: { d1: !!env.DB, admin: !!env.ADMIN_TOKEN, meta: !!(env.META_APP_ID && env.META_APP_SECRET), ai: !!env.GEMINI_API_KEY } });
  if (path === "/api/meta/webhook" && req.method === "GET") {
    const mode = url.searchParams.get("hub.mode"), token = url.searchParams.get("hub.verify_token"), challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token && token === env.META_WEBHOOK_VERIFY_TOKEN) return new Response(challenge || "", { status: 200 });
    return new Response("Forbidden", { status: 403 });
  }
  if (path === "/api/meta/webhook" && req.method === "POST") {
    const payload = await body(req);
    // Store raw events for review. Do not auto-reply until webhook fields and app permissions are verified.
    await env.DB.prepare("INSERT INTO interactions (id, platform_id, kind, username, body, status) VALUES (?, ?, ?, ?, ?, 'new')").bind(uid(), null, "webhook", "instagram", JSON.stringify(payload).slice(0, 8000)).run();
    return json({ received: true });
  }
  if (path === "/api/meta/callback" && req.method === "GET") {
    const code = url.searchParams.get("code");
    if (!code) return new Response("Autorização cancelada ou código ausente.", { status: 400 });
    if (!env.META_APP_ID || !env.META_APP_SECRET) return new Response("Configure META_APP_ID e META_APP_SECRET.", { status: 503 });
    const redirect = `${url.origin}/api/meta/callback`;
    const tokenUrl = new URL("https://api.instagram.com/oauth/access_token");
    const form = new URLSearchParams({ client_id: env.META_APP_ID, client_secret: env.META_APP_SECRET, grant_type: "authorization_code", redirect_uri: redirect, code });
    const tokenRes = await fetch(tokenUrl, { method: "POST", body: form });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) return json({ error: tokenData.error_message || "Falha ao trocar código OAuth." }, 400);
    const longUrl = new URL("https://graph.instagram.com/access_token");
    longUrl.search = new URLSearchParams({ grant_type: "ig_exchange_token", client_secret: env.META_APP_SECRET, access_token: tokenData.access_token }).toString();
    const longRes = await fetch(longUrl);
    const longData = await longRes.json();
    const access = longData.access_token || tokenData.access_token;
    const profile = await graph(env, "me", access, { fields: "user_id,username" });
    await env.DB.prepare("INSERT INTO settings (key,value,updated_at) VALUES ('ig_token',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(access, now()).run();
    await env.DB.prepare("INSERT INTO settings (key,value,updated_at) VALUES ('ig_user',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(JSON.stringify(profile), now()).run();
    return Response.redirect(`${url.origin}/?connected=1`, 302);
  }
  if (!auth(req, env)) return json({ error: "Não autorizado. Configure e envie o token de administrador." }, 401);
  if (path === "/api/state" && req.method === "GET") {
    const [episodes, characters, approvals, interactions, logs, bible, igUser] = await Promise.all([
      rows(env.DB, "SELECT * FROM episodes ORDER BY number DESC LIMIT 30"),
      rows(env.DB, "SELECT * FROM characters ORDER BY created_at DESC LIMIT 100"),
      rows(env.DB, "SELECT * FROM approvals ORDER BY created_at DESC LIMIT 50"),
      rows(env.DB, "SELECT * FROM interactions ORDER BY created_at DESC LIMIT 50"),
      rows(env.DB, "SELECT * FROM publish_log ORDER BY created_at DESC LIMIT 30"),
      one(env.DB, "SELECT value FROM settings WHERE key='bible'"),
      one(env.DB, "SELECT value FROM settings WHERE key='ig_user'")
    ]);
    return json({ episodes, characters, approvals, interactions, logs, bible: bible ? JSON.parse(bible.value) : seedBible, instagram: igUser ? JSON.parse(igUser.value) : null });
  }
  if (path === "/api/bootstrap" && req.method === "POST") {
    const exists = await one(env.DB, "SELECT key FROM settings WHERE key='bible'");
    if (!exists) await env.DB.prepare("INSERT INTO settings (key,value,updated_at) VALUES ('bible',?,?)").bind(JSON.stringify(seedBible), now()).run();
    const count = await one(env.DB, "SELECT COUNT(*) AS n FROM episodes");
    if (!count?.n) {
      const e = makeEpisode(1);
      await env.DB.prepare("INSERT INTO episodes (id,number,title,synopsis,script,caption,hashtags,status) VALUES (?,?,?,?,?,?,?,'draft')").bind(e.id,e.number,e.title,e.synopsis,e.script,e.caption,e.hashtags).run();
    }
    return json({ ok: true, message: "Universo inicial criado." });
  }
  if (path === "/api/episodes/generate" && req.method === "POST") {
    const last = await one(env.DB, "SELECT number,synopsis FROM episodes ORDER BY number DESC LIMIT 1");
    const n = (last?.number || 0) + 1;
    const e = await generateEpisode(env, n, last?.synopsis || "");
    await env.DB.prepare("INSERT INTO episodes (id,number,title,synopsis,script,caption,hashtags,status) VALUES (?,?,?,?,?,?,?,'draft')").bind(e.id,e.number,e.title,e.synopsis,e.script,e.caption,e.hashtags).run();
    return json(e, 201);
  }
  if (path === "/api/episodes" && req.method === "POST") {
    const b = await body(req);
    if (!b.title || !b.script) return json({ error: "Título e roteiro são obrigatórios." }, 400);
    const id = uid();
    await env.DB.prepare("INSERT INTO episodes (id,number,title,synopsis,script,caption,hashtags,media_url,status,scheduled_at) VALUES (?,?,?,?,?,?,?,?,?,?)").bind(id, Number(b.number || 1), b.title, b.synopsis || "", b.script, b.caption || "", b.hashtags || "", b.media_url || null, b.status || "draft", b.scheduled_at || null).run();
    return json({ id }, 201);
  }
  const episodeMatch = path.match(/^\/api\/episodes\/([\w-]+)$/);
  if (episodeMatch && req.method === "POST") {
    const b = await body(req);
    await env.DB.prepare("UPDATE episodes SET title=COALESCE(?,title),synopsis=COALESCE(?,synopsis),script=COALESCE(?,script),caption=COALESCE(?,caption),hashtags=COALESCE(?,hashtags),media_url=COALESCE(?,media_url),status=COALESCE(?,status),scheduled_at=COALESCE(?,scheduled_at),updated_at=? WHERE id=?").bind(b.title ?? null,b.synopsis ?? null,b.script ?? null,b.caption ?? null,b.hashtags ?? null,b.media_url ?? null,b.status ?? null,b.scheduled_at ?? null,now(),episodeMatch[1]).run();
    return json({ ok: true });
  }
  if (path === "/api/approvals" && req.method === "POST") {
    const b = await body(req); if (!b.title || !b.details) return json({ error: "Título e detalhes obrigatórios." }, 400);
    const id = uid(); await env.DB.prepare("INSERT INTO approvals (id,kind,title,details,options) VALUES (?,?,?,?,?)").bind(id,b.kind || "story",b.title,b.details,JSON.stringify(b.options || [])).run(); return json({ id },201);
  }
  const approvalMatch = path.match(/^\/api\/approvals\/([\w-]+)\/decision$/);
  if (approvalMatch && req.method === "POST") {
    const b = await body(req); if (!["ACEITO","NÃO ACEITO","ACEITO PARCIALMENTE"].includes(b.decision)) return json({error:"Decisão inválida."},400);
    await env.DB.prepare("UPDATE approvals SET status='decided',decision=?,notes=?,decided_at=? WHERE id=?").bind(b.decision,b.notes || "",now(),approvalMatch[1]).run(); return json({ok:true});
  }
  if (path === "/api/characters" && req.method === "POST") {
    const b = await body(req); if (!b.instagram_handle || !b.description) return json({error:"Informe @ e descrição."},400);
    const id=uid(); await env.DB.prepare("INSERT INTO characters (id,instagram_handle,display_name,description,origin,status) VALUES (?,?,?,?,?,'pending')").bind(id,String(b.instagram_handle).replace(/^@/,""),b.display_name || b.instagram_handle,b.description,"community").run(); return json({id},201);
  }
  if (path === "/api/characters/decision" && req.method === "POST") {
    const b=await body(req); if (!b.id || !["approved","rejected"].includes(b.status)) return json({error:"Dados inválidos."},400);
    await env.DB.prepare("UPDATE characters SET status=? WHERE id=?").bind(b.status,b.id).run(); return json({ok:true});
  }
  if (path === "/api/meta/connect" && req.method === "GET") {
    if (!env.META_APP_ID) return json({error:"Falta configurar META_APP_ID e META_APP_SECRET no Cloudflare."},503);
    const redirect = `${url.origin}/api/meta/callback`;
    const scopes = "instagram_business_basic,instagram_business_content_publish,instagram_business_manage_comments,instagram_business_manage_messages,instagram_business_manage_insights";
    const oauth = new URL("https://www.instagram.com/oauth/authorize");
    oauth.search = new URLSearchParams({ client_id: env.META_APP_ID, redirect_uri: redirect, response_type: "code", scope: scopes, state: crypto.randomUUID() }).toString();
    return Response.redirect(oauth.toString(),302);
  }
  if (path === "/api/meta/publish" && req.method === "POST") {
    const b=await body(req); const e=await one(env.DB,"SELECT * FROM episodes WHERE id=?",b.episode_id);
    if (!e || !e.media_url) return json({error:"O episódio precisa ter uma URL pública HTTPS de vídeo."},400);
    const token=await one(env.DB,"SELECT value FROM settings WHERE key='ig_token'");
    const user=await one(env.DB,"SELECT value FROM settings WHERE key='ig_user'");
    if (!token || !user) return json({error:"Conecte primeiro a conta profissional do Instagram."},400);
    const ig=JSON.parse(user.value); const t=token.value;
    try {
      const container=await graph(env,`${ig.user_id}/media`,t,{media_type:"REELS",video_url:e.media_url,caption:e.caption + "\n\n" + e.hashtags});
      let status="IN_PROGRESS", attempts=0;
      while (status==="IN_PROGRESS" && attempts++<12) {
        await new Promise(r=>setTimeout(r,5000));
        const check=await graph(env,container.id,t,{fields:"status_code"});
        status=check.status_code;
      }
      if(status!=="FINISHED") throw new Error("Instagram ainda não concluiu o processamento do vídeo. Tente novamente mais tarde.");
      const published=await graph(env,`${ig.user_id}/media_publish`,t,{creation_id:container.id},"POST");
      await env.DB.prepare("UPDATE episodes SET status='published',instagram_media_id=?,updated_at=? WHERE id=?").bind(published.id,now(),e.id).run();
      await env.DB.prepare("INSERT INTO publish_log (id,episode_id,result,detail) VALUES (?,?,?,?)").bind(uid(),e.id,"success",published.id).run();
      return json({ok:true,media_id:published.id});
    } catch(err) {
      await env.DB.prepare("INSERT INTO publish_log (id,episode_id,result,detail) VALUES (?,?,?,?)").bind(uid(),e.id,"error",String(err.message)).run();
      return json({error:err.message},502);
    }
  }
  if (path === "/api/meta/reply-comment" && req.method === "POST") {
    const b=await body(req); const token=await one(env.DB,"SELECT value FROM settings WHERE key='ig_token'");
    if(!token || !b.comment_id || !b.message) return json({error:"Token, comentário e resposta são obrigatórios."},400);
    try { const result=await graph(env,`${b.comment_id}/replies`,token.value,{message:b.message},"POST"); return json({ok:true,result}); } catch(e) { return json({error:e.message},502); }
  }
  return json({ error: "Rota não encontrada." }, 404);
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) return cors(await api(req, env, ctx), req.headers.get("origin"));
    if (env.ASSETS) return env.ASSETS.fetch(req);
    return new Response("Assets não configurados.", { status: 503 });
  },
  async scheduled(event, env, ctx) {
    if (!env.DB) return;
    const due = await rows(env.DB, "SELECT * FROM episodes WHERE status='scheduled' AND scheduled_at <= ? ORDER BY scheduled_at LIMIT 5", now());
    for (const e of due) {
      // Publishing only proceeds when the owner has connected Instagram and supplied a public media URL.
      if (!e.media_url) {
        await env.DB.prepare("UPDATE episodes SET status='needs_media',updated_at=? WHERE id=?").bind(now(),e.id).run();
        continue;
      }
      // Use the same official publish flow from an internal request; no password automation or scraping.
      const token = await one(env.DB, "SELECT value FROM settings WHERE key='ig_token'");
      const user = await one(env.DB, "SELECT value FROM settings WHERE key='ig_user'");
      if (!token || !user) continue;
      try {
        const ig = JSON.parse(user.value);
        const container = await graph(env,`${ig.user_id}/media`,token.value,{media_type:"REELS",video_url:e.media_url,caption:e.caption + "\n\n" + e.hashtags});
        let status="IN_PROGRESS", attempts=0;
        while(status==="IN_PROGRESS" && attempts++<12) { await new Promise(r=>setTimeout(r,5000)); status=(await graph(env,container.id,token.value,{fields:"status_code"})).status_code; }
        if(status!=="FINISHED") throw new Error("Video processing did not finish");
        const result=await graph(env,`${ig.user_id}/media_publish`,token.value,{creation_id:container.id},"POST");
        await env.DB.prepare("UPDATE episodes SET status='published',instagram_media_id=?,updated_at=? WHERE id=?").bind(result.id,now(),e.id).run();
        await env.DB.prepare("INSERT INTO publish_log (id,episode_id,result,detail) VALUES (?,?,?,?)").bind(uid(),e.id,"success",result.id).run();
      } catch(err) {
        await env.DB.prepare("UPDATE episodes SET status='publish_error',updated_at=? WHERE id=?").bind(now(),e.id).run();
        await env.DB.prepare("INSERT INTO publish_log (id,episode_id,result,detail) VALUES (?,?,?,?)").bind(uid(),e.id,"error",String(err.message)).run();
      }
    }
  }
};
