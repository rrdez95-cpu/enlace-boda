import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import RsvpForm from './rsvp-form'

export const revalidate = 60

type Evento = { id: number; nombre: string; hora: string; cat: string; desc: string }

export default async function InvitacionPage({
  params,
}: {
  params: Promise<{ codigo: string }>
}) {
  const { codigo } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.rpc('get_invitacion_publica', { p_codigo: codigo })

  if (error || !data) return notFound()

  const inv = data.config || {}
  const tema = inv.tema || 'marfil'
  const novios = data.novios || 'Los novios'
  const fecha = data.fecha ? new Date(data.fecha) : null
  const finca = data.finca || ''
  const eventos: Evento[] = (data.eventos || []).filter(
    (e: Evento) => !['prep', 'otro'].includes(e.cat)
  )
  const buses = eventos.filter((e: Evento) => e.cat === 'autobus')
  const bodaId = data.boda_id
  const mensaje = inv.mensaje || 'Con mucha alegría os invitamos a celebrar nuestra boda.'
  const fotoPortada = inv.fotoPortada
  const foto2 = inv.foto2
  const fechaLimite = inv.fechaLimiteRsvp

  const fechaStr = fecha
    ? fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  const TARGET = fecha ? fecha.getTime() : 0

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Barlow:wght@300;400;500&family=Barlow+Condensed:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Montserrat:wght@300;400;500&family=Fraunces:ital,wght@0,300;0,700;1,300;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{overflow-x:hidden}

        [data-theme="marfil"]{--bg:#F7F3ED;--bg2:#EEE8DF;--ink:#1A1714;--ink2:#5C5249;--ink3:#8A7D70;--accent:#A0713A;--accent2:#C49256;--line:rgba(160,113,58,.18);--btn:#1A1714;--btnfg:#F7F3ED;--dfont:'Cormorant Garamond',serif;--bfont:'Barlow',sans-serif;--lfont:'Barlow Condensed',sans-serif;--bradius:2px}
        [data-theme="jardin"]{--bg:#F0EBE2;--bg2:#E3DDD4;--ink:#263020;--ink2:#4E5E46;--ink3:#7A8A72;--accent:#5B7A52;--accent2:#8FAB85;--line:rgba(91,122,82,.2);--btn:#263020;--btnfg:#F0EBE2;--dfont:'Playfair Display',serif;--bfont:'Barlow',sans-serif;--lfont:'Barlow',sans-serif;--bradius:12px}
        [data-theme="marino"]{--bg:#F3EFE7;--bg2:#E8E2D8;--ink:#1B2A4A;--ink2:#3A4E6C;--ink3:#6A7A90;--accent:#C4A05A;--accent2:#D8B878;--line:rgba(196,160,90,.22);--btn:#1B2A4A;--btnfg:#F3EFE7;--dfont:'EB Garamond',serif;--bfont:'Montserrat',sans-serif;--lfont:'Montserrat',sans-serif;--bradius:0px}
        [data-theme="rosa"]{--bg:#FAF6F3;--bg2:#F2EAE5;--ink:#2E1F1C;--ink2:#7A5A54;--ink3:#B08880;--accent:#B87060;--accent2:#D49A8C;--line:rgba(184,112,96,.18);--btn:#2E1F1C;--btnfg:#FAF6F3;--dfont:'Fraunces',serif;--bfont:'Barlow',sans-serif;--lfont:'Barlow',sans-serif;--bradius:28px}
        [data-theme="grafito"]{--bg:#FFFFFF;--bg2:#F4F4F4;--ink:#111;--ink2:#555;--ink3:#999;--accent:#111;--accent2:#777;--line:rgba(0,0,0,.1);--btn:#111;--btnfg:#fff;--dfont:'DM Sans',sans-serif;--bfont:'DM Sans',sans-serif;--lfont:'DM Sans',sans-serif;--bradius:0px}

        .page{background:var(--bg);color:var(--ink);font-family:var(--bfont);min-height:100vh;transition:background .4s}
        section{width:100%}

        /* HERO */
        .hero{min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:64px 28px 80px;position:relative;overflow:hidden;background:var(--bg)}
        .hero-bg{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 35%,var(--bg2),transparent 70%);pointer-events:none}
        [data-theme="grafito"] .hero-bg{background:none}
        .hero-pre{font-family:var(--lfont);font-size:10px;letter-spacing:4px;text-transform:uppercase;color:var(--accent);margin-bottom:24px;position:relative;z-index:1}
        [data-theme="jardin"] .hero-pre,[data-theme="rosa"] .hero-pre{text-transform:none;letter-spacing:.5px;font-size:13px;font-style:italic}
        .hero-names{font-family:var(--dfont);font-size:clamp(52px,12vw,104px);font-weight:300;line-height:.92;color:var(--ink);letter-spacing:-1px;position:relative;z-index:1}
        [data-theme="jardin"] .hero-names{font-style:italic;font-weight:400}
        [data-theme="rosa"] .hero-names{font-weight:700;letter-spacing:-2px}
        [data-theme="grafito"] .hero-names{font-weight:600;letter-spacing:-2px}
        .hero-amp{display:block;font-style:italic;color:var(--accent2);font-size:clamp(32px,6vw,56px);margin:8px 0;font-weight:300}
        [data-theme="grafito"] .hero-amp{font-style:normal;color:var(--ink3);font-weight:300}
        [data-theme="marino"] .hero-amp{font-style:normal;font-family:var(--lfont);font-size:12px;letter-spacing:6px;text-transform:uppercase;color:var(--accent);margin:18px 0}
        .hero-date{font-family:var(--lfont);font-size:13px;letter-spacing:4px;text-transform:uppercase;color:var(--ink2);margin-top:28px}
        [data-theme="jardin"] .hero-date,[data-theme="rosa"] .hero-date{text-transform:none;letter-spacing:1px;font-size:14px}
        .hero-finca{font-family:var(--dfont);font-size:17px;font-style:italic;color:var(--ink3);margin-top:6px}
        [data-theme="grafito"] .hero-finca{font-style:normal;font-weight:300}
        .hero-orn{width:1px;height:56px;background:linear-gradient(to bottom,transparent,var(--accent));margin:28px auto;opacity:.5}
        [data-theme="grafito"] .hero-orn{width:40px;height:3px;background:var(--ink);opacity:.3}
        [data-theme="marino"] .hero-orn{width:48px;height:1px;background:var(--accent)}
        .hero-scroll{position:absolute;bottom:28px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;opacity:.35;animation:bob 2.2s ease-in-out infinite}
        @keyframes bob{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(7px)}}
        .hero-scroll-line{width:1px;height:28px;background:linear-gradient(to bottom,var(--accent),transparent)}
        .hero-scroll-txt{font-family:var(--lfont);font-size:8px;letter-spacing:3px;text-transform:uppercase;color:var(--ink3)}

        /* FOTO */
        .foto{width:100%;overflow:hidden;background:var(--bg2);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
        .foto img{width:100%;height:100%;object-fit:cover;display:block}
        .foto-placeholder{display:flex;align-items:center;justify-content:center;opacity:.15;font-family:var(--dfont);font-style:italic;font-size:14px;color:var(--ink2)}

        /* CUENTA ATRÁS */
        .countdown{padding:68px 28px;text-align:center;background:var(--bg2);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
        .cd-title{font-family:var(--dfont);font-size:clamp(18px,3vw,24px);font-style:italic;font-weight:300;color:var(--ink2);margin-bottom:32px}
        [data-theme="grafito"] .cd-title{font-style:normal;font-weight:400;font-size:15px;letter-spacing:.5px}
        .cd-grid{display:flex;justify-content:center;max-width:460px;margin:0 auto}
        .cd-item{flex:1;padding:0 8px;position:relative}
        .cd-item+.cd-item::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-60%);width:1px;height:40px;background:var(--line)}
        .cd-num{font-family:var(--dfont);font-size:clamp(36px,8vw,60px);font-weight:300;color:var(--ink);line-height:1;display:block}
        [data-theme="grafito"] .cd-num{font-weight:600}
        [data-theme="rosa"] .cd-num{font-weight:700}
        .cd-key{font-family:var(--lfont);font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);margin-top:6px;display:block}
        [data-theme="jardin"] .cd-key{text-transform:none;font-size:11px;font-style:italic}

        /* EL DÍA */
        .el-dia{padding:80px clamp(24px,6vw,64px);max-width:700px;margin:0 auto}
        .sec-eyebrow{font-family:var(--lfont);font-size:10px;letter-spacing:4px;text-transform:uppercase;color:var(--accent);display:block;margin-bottom:10px}
        [data-theme="jardin"] .sec-eyebrow,[data-theme="rosa"] .sec-eyebrow{text-transform:none;font-style:italic;font-size:13px;letter-spacing:.5px;font-family:var(--dfont)}
        .sec-title{font-family:var(--dfont);font-size:clamp(28px,5vw,42px);font-weight:300;font-style:italic;color:var(--ink);margin-bottom:44px;line-height:1.1}
        [data-theme="grafito"] .sec-title{font-style:normal;font-weight:600;font-size:clamp(22px,4vw,32px);letter-spacing:-1px}
        [data-theme="rosa"] .sec-title{font-weight:700;letter-spacing:-1px}
        .timeline{position:relative;padding-left:0}
        .timeline::before{content:'';position:absolute;left:56px;top:8px;bottom:8px;width:1px;background:linear-gradient(to bottom,transparent,var(--accent2) 8%,var(--accent2) 92%,transparent)}
        [data-theme="grafito"] .timeline::before{left:0;width:2px;background:var(--ink);opacity:.1}
        [data-theme="grafito"] .timeline{padding-left:22px}
        .t-item{display:flex;gap:20px;margin-bottom:34px;align-items:flex-start}
        .t-time{font-family:var(--lfont);font-size:12px;letter-spacing:1px;color:var(--ink3);min-width:44px;padding-top:3px;text-align:right}
        [data-theme="grafito"] .t-time{display:none}
        [data-theme="rosa"] .t-time{font-family:var(--dfont);font-style:italic;color:var(--accent);font-size:14px}
        .t-dot{width:10px;height:10px;border-radius:50%;border:1.5px solid var(--accent);background:var(--bg);flex-shrink:0;margin-top:4px;position:relative;z-index:1}
        [data-theme="grafito"] .t-dot{border-radius:0;margin-left:-5px;width:8px;height:8px}
        [data-theme="jardin"] .t-dot{background:var(--accent)}
        .t-name{font-family:var(--dfont);font-size:19px;font-weight:400;color:var(--ink);margin-bottom:3px}
        [data-theme="grafito"] .t-name{font-weight:500;font-size:15px}
        .t-time-inline{display:none;font-size:11px;color:var(--ink3);margin-right:8px}
        [data-theme="grafito"] .t-time-inline{display:inline}
        .t-desc{font-size:13px;font-weight:300;color:var(--ink2);line-height:1.55}

        /* LUGAR */
        .lugar{padding:72px clamp(24px,6vw,64px);background:var(--bg2);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
        .lugar-inner{max-width:700px;margin:0 auto}
        .lugar-name{font-family:var(--dfont);font-size:clamp(24px,4vw,38px);font-weight:300;font-style:italic;color:var(--ink);margin:12px 0 6px}
        [data-theme="grafito"] .lugar-name{font-style:normal;font-weight:600}
        .lugar-addr{font-size:14px;font-weight:300;color:var(--ink2);line-height:1.7;margin-bottom:20px}
        .map-box{width:100%;height:200px;background:var(--bg);border:1px solid var(--line);border-radius:var(--bradius);display:flex;align-items:center;justify-content:center}
        [data-theme="grafito"] .map-box{border:2px solid var(--ink)}

        /* TRANSPORTE */
        .transporte{padding:72px clamp(24px,6vw,64px);max-width:700px;margin:0 auto}
        .bus-card{border:1px solid var(--line);border-radius:var(--bradius);padding:16px 20px;display:flex;gap:16px;align-items:center;margin-bottom:10px;background:var(--bg)}
        [data-theme="marino"] .bus-card{border-color:var(--accent)}
        .bus-nombre{font-family:var(--dfont);font-size:18px;font-weight:400;color:var(--ink);margin-bottom:3px}
        .bus-det{font-size:13px;font-weight:300;color:var(--ink2)}

        /* RSVP */
        .rsvp-sec{padding:80px clamp(24px,6vw,64px) 100px;max-width:560px;margin:0 auto}
        .rsvp-intro{font-family:var(--dfont);font-size:16px;font-style:italic;color:var(--ink2);line-height:1.75;margin-bottom:36px}
        [data-theme="grafito"] .rsvp-intro{font-style:normal;font-weight:300;font-size:14px}

        /* PIE */
        .pie{padding:44px 28px;text-align:center;border-top:1px solid var(--line);background:var(--bg2)}
        .pie-names{font-family:var(--dfont);font-size:20px;font-style:italic;font-weight:300;color:var(--ink2);margin-bottom:7px}
        .pie-marca{font-family:var(--lfont);font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--accent);opacity:.5}

        @media(max-width:600px){
          .hero-names{font-size:clamp(44px,14vw,72px)}
          .cd-grid{max-width:300px}
          .timeline::before{left:42px}
          .t-time{min-width:36px;font-size:11px}
        }
        @media(prefers-reduced-motion:reduce){.hero-scroll{animation:none}}
      `}</style>

      <div className="page" data-theme={tema}>

        {/* HERO */}
        <section className="hero">
          <div className="hero-bg" />
          <p className="hero-pre">Con mucha alegría os invitamos a celebrar nuestra boda</p>
          <h1 className="hero-names">
            {novios.split(' y ').map((n: string, i: number, arr: string[]) => (
              <span key={i}>{n}{i < arr.length - 1 && <span className="hero-amp">&</span>}</span>
            ))}
          </h1>
          <div className="hero-orn" />
          <p className="hero-date">{fechaStr}</p>
          {finca && <p className="hero-finca">{finca}</p>}
          <div className="hero-scroll">
            <span className="hero-scroll-txt">Desliza</span>
            <div className="hero-scroll-line" />
          </div>
        </section>

        {/* FOTO PORTADA */}
        {fotoPortada && (
          <div className="foto" style={{ height: 'clamp(200px,32vw,420px)' }}>
            <img src={fotoPortada} alt="Portada" />
          </div>
        )}

        {/* CUENTA ATRÁS */}
        <section className="countdown">
          <p className="cd-title">hasta que digamos que sí</p>
          <div className="cd-grid">
            <div className="cd-item"><span className="cd-num" id="cd-d">—</span><span className="cd-key">días</span></div>
            <div className="cd-item"><span className="cd-num" id="cd-h">—</span><span className="cd-key">horas</span></div>
            <div className="cd-item"><span className="cd-num" id="cd-m">—</span><span className="cd-key">minutos</span></div>
            <div className="cd-item"><span className="cd-num" id="cd-s">—</span><span className="cd-key">segundos</span></div>
          </div>
        </section>

        {/* EL DÍA */}
        {eventos.length > 0 && (
          <section className="el-dia">
            <span className="sec-eyebrow">El gran día</span>
            <h2 className="sec-title">Así será nuestra boda</h2>
            <div className="timeline">
              {eventos.map(e => (
                <div key={e.id} className="t-item">
                  <span className="t-time">{e.hora}</span>
                  <div className="t-dot" />
                  <div>
                    <div className="t-name">
                      <span className="t-time-inline">{e.hora} · </span>{e.nombre}
                    </div>
                    {e.desc && <div className="t-desc">{e.desc}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* LUGAR */}
        {finca && (
          <section className="lugar">
            <div className="lugar-inner">
              <span className="sec-eyebrow">Dónde celebramos</span>
              <h2 className="lugar-name">{finca}</h2>
              <div className="map-box">
                <span style={{ opacity: .3, fontSize: 13, fontStyle: 'italic' }}>Mapa</span>
              </div>
            </div>
          </section>
        )}

        {/* TRANSPORTE */}
        {buses.length > 0 && (
          <section className="transporte">
            <span className="sec-eyebrow">Transporte</span>
            <h2 className="sec-title">Autobuses</h2>
            {buses.map(b => (
              <div key={b.id} className="bus-card">
                <span style={{ fontSize: 22 }}>🚌</span>
                <div>
                  <div className="bus-nombre">{b.nombre}</div>
                  {b.desc && <div className="bus-det">{b.desc}</div>}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* FOTO 2 */}
        {foto2 && (
          <div className="foto" style={{ height: 'clamp(160px,24vw,320px)' }}>
            <img src={foto2} alt="Foto boda" />
          </div>
        )}

        {/* RSVP FORM (cliente) */}
        <section className="rsvp-sec">
          <span className="sec-eyebrow">Confirmación</span>
          <h2 className="sec-title">¿Contamos contigo?</h2>
          {mensaje && <p className="rsvp-intro">{mensaje}</p>}
          <RsvpForm
            codigo={codigo}
            bodaId={bodaId}
            buses={buses}
            fechaLimite={fechaLimite}
          />
        </section>

        <footer className="pie">
          <div className="pie-names">{novios}</div>
          <div className="pie-marca">Creado con Enlace · enlaceboda.es</div>
        </footer>

        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var t = ${TARGET};
            function tick(){
              var d = t - Date.now();
              if(d<=0)return;
              document.getElementById('cd-d').textContent = Math.floor(d/86400000);
              document.getElementById('cd-h').textContent = String(Math.floor((d%86400000)/3600000)).padStart(2,'0');
              document.getElementById('cd-m').textContent = String(Math.floor((d%3600000)/60000)).padStart(2,'0');
              document.getElementById('cd-s').textContent = String(Math.floor((d%60000)/1000)).padStart(2,'0');
            }
            tick(); setInterval(tick,1000);
          })();
        `}} />
      </div>
    </>
  )
}