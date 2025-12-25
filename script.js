(() => {
  const qs = new URLSearchParams(location.search);

  // Personalización por URL
  const to = (qs.get('para') || 'Sara Guevara').trim();
  const shortTo = to.split(' ')[0] || 'Sara';
  const from = (qs.get('de') || 'tu amigo').trim();

  const toName = document.getElementById('toName');
  const coverName = document.getElementById('coverName');
  const fromName = document.getElementById('fromName');
  if (toName) toName.textContent = to;
  if (coverName) coverName.textContent = shortTo;
  if (fromName) fromName.textContent = from;

  // Fecha local
  const todayEl = document.getElementById('today');
  if (todayEl) {
    const d = new Date();
    const opts = { year: 'numeric', month: 'short', day: '2-digit' };
    todayEl.textContent = d.toLocaleDateString('es-PE', opts);
  }

  const card = document.getElementById('card');
  const cardToggle = document.getElementById('cardToggle');
  const btnClose = document.getElementById('btnClose');
  const btnBurst = document.getElementById('btnBurst');
  const btnShare = document.getElementById('btnShare');
  const btnToggleFx = document.getElementById('btnToggleFx');
  const toast = document.getElementById('toast');

  // ✅ NUEVO: Música
  const btnMusic = document.getElementById('btnMusic');
  const bgm = document.getElementById('bgm');

  const insidePaper = document.querySelector('.inside__paper');

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mensaje con typewriter
  const typedEl = document.getElementById('typed');
  const message =
    `Que esta Navidad te regale paz, salud y un descanso bien merecido.\n\n` +
    `Y que cada paso en la vida y en tu carrera de enfermeria te acerque a tus sueños: ` +
    `a cuidar con amor, a sanar con conocimiento y a brillar con esa forma tuya de ser.`;

  let typedDone = false;
  function typewriter() {
    if (!typedEl || typedDone) return;
    typedDone = true;

    typedEl.textContent = '';

    // Si reduce motion, escribimos todo de frente.
    if (prefersReduced) {
      typedEl.textContent = message;
      return;
    }

    let i = 0;
    const tick = () => {
      typedEl.textContent = message.slice(0, i);
      i += 1;
      if (i <= message.length) requestAnimationFrame(tick);
    };
    tick();
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  // Campanita (fallback)
  function chime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.value = 0.06;
      master.connect(ctx.destination);

      const notes = [523.25, 659.25, 784.0, 659.25];
      notes.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.12);
        g.gain.setValueAtTime(0.0, now + idx * 0.12);
        g.gain.linearRampToValueAtTime(1.0, now + idx * 0.12 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.28);
        osc.connect(g);
        g.connect(master);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.32);
      });
      setTimeout(() => ctx.close(), 1200);
    } catch (_) {}
  }

  // ✅ Música real (necesita assets/musica.mp3)
  let musicOn = false;
  async function setMusic(on) {
    if (!bgm) {
      showToast('No existe <audio id="bgm">');
      return;
    }
    try {
      if (on) {
        await bgm.play(); // permitido si viene de click
        musicOn = true;
        btnMusic && (btnMusic.querySelector('.icon').textContent = '⏸');
        showToast('Música: ON');
      } else {
        bgm.pause();
        musicOn = false;
        btnMusic && (btnMusic.querySelector('.icon').textContent = '♫');
        showToast('Música: OFF');
      }
    } catch (e) {
      // si no hay archivo o el navegador bloquea, avisamos
      showToast('No se pudo reproducir. Verifica assets/musica.mp3');
    }
  }
  btnMusic?.addEventListener('click', () => setMusic(!musicOn));

  // Estado abrir/cerrar
  let isOpen = false;
  async function setOpen(next) {
    isOpen = next;
    card?.classList.toggle('is-open', isOpen);

    // accesibilidad interior
    insidePaper?.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

    if (cardToggle) cardToggle.setAttribute('aria-label', isOpen ? 'Tarjeta abierta' : 'Abrir tarjeta');

    if (isOpen) {
      typewriter();

      // Campanita + (intento) arrancar música
      chime();
      if (!musicOn) await setMusic(true);

      burst(220);
      showToast('✨ Tarjeta abierta');
    } else {
      showToast('Tarjeta cerrada');
    }
  }
  function toggleOpen() { setOpen(!isOpen); }

  cardToggle?.addEventListener('click', toggleOpen);
  btnClose?.addEventListener('click', () => setOpen(false));
  btnBurst?.addEventListener('click', () => burst(320));

  // Enter/Espacio
  cardToggle?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleOpen();
    }
  });

  // Compartir
  btnShare?.addEventListener('click', async () => {
    const url = location.href;
    const title = 'Feliz Navidad ✨';
    const text = `Una tarjetita para ${to}.`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Link copiado ✅');
      }
    } catch {
      showToast('No se pudo compartir.');
    }
  });

  // ====== FX CANVAS (nieve + confeti) ======
  const canvas = document.getElementById('fx');
  const ctx = canvas?.getContext('2d');
  let running = true;

  function resize() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(dpr, dpr);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  const snow = [];
  const confetti = [];
  const stars = [];

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function initSnow(n=140) {
    snow.length = 0;
    for (let i=0; i<n; i++) {
      snow.push({
        x: rand(0, window.innerWidth),
        y: rand(0, window.innerHeight),
        r: rand(0.8, 2.8),
        vy: rand(0.6, 2.2),
        vx: rand(-0.5, 0.5),
        o: rand(0.35, 0.95)
      });
    }
  }

  function initStars(n=55){
    stars.length = 0;
    for(let i=0;i<n;i++){
      stars.push({
        x: rand(0, window.innerWidth),
        y: rand(0, window.innerHeight),
        r: rand(0.6, 1.6),
        a: rand(0.15, 0.6),
        t: rand(0, Math.PI*2),
        s: rand(0.008, 0.02)
      });
    }
  }

  function burst(n=240) {
    if (!ctx) return;

    // ✅ Si reduce motion, bajamos cantidad pero no lo apagamos
    const count = prefersReduced ? Math.min(90, n) : n;

    const cx = window.innerWidth * 0.5;
    const cy = window.innerHeight * 0.30;

    for (let i=0; i<count; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(2.2, 7.8);
      confetti.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - rand(1.5, 4),
        g: rand(0.07, 0.14),
        s: rand(2.5, 6.5),
        r: rand(0, Math.PI),
        vr: rand(-0.25, 0.25),
        life: rand(90, 170),
        hue: rand(0, 360)
      });
    }
  }

  function step() {
    if (!ctx || !canvas) return;
    requestAnimationFrame(step);
    if (!running) return;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // estrellas suaves
    for(const st of stars){
      st.t += st.s;
      const pulse = (Math.sin(st.t)+1)*0.5; // 0..1
      ctx.globalAlpha = st.a + pulse*0.25;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r + pulse*0.6, 0, Math.PI*2);
      ctx.fillStyle = 'white';
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // nieve con glow
    for (const f of snow) {
      f.x += f.vx;
      f.y += f.vy;

      if (f.y > window.innerHeight + 10) { f.y = -10; f.x = rand(0, window.innerWidth); }
      if (f.x > window.innerWidth + 10) f.x = -10;
      if (f.x < -10) f.x = window.innerWidth + 10;

      ctx.globalAlpha = f.o;

      // glow
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r*2.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fill();

      // núcleo
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // confeti
    for (let i = confetti.length - 1; i >= 0; i--) {
      const p = confetti[i];
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      p.life -= 1;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 170));
      ctx.fillStyle = `hsl(${p.hue} 95% 70%)`;
      ctx.fillRect(-p.s, -p.s, p.s * 2, p.s * 2);
      ctx.restore();

      if (p.life <= 0 || p.y > window.innerHeight + 60) confetti.splice(i, 1);
    }
    ctx.globalAlpha = 1;
  }

  // ✅ Setup: no lo apagues a 0 aunque haya reduce motion
  initSnow(prefersReduced ? 55 : 140);
  initStars(prefersReduced ? 22 : 55);
  requestAnimationFrame(step);

  // Toggle FX
  btnToggleFx?.addEventListener('click', () => {
    running = !running;
    showToast(running ? 'Animación: ON' : 'Animación: OFF');
  });

  // Abrir auto
  if (qs.get('open') === '1') setOpen(true);
  
})();
