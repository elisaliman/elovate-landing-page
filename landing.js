(() => {
  // ============================================================
  // SECTION 1 — DOM handles + outfit catalog
  // ============================================================

  const sparkLayer = document.getElementById('sparkles');
  const ribbon     = document.getElementById('ribbonWrap');
  const path       = document.querySelector('.ribbon-path');
  const outfit     = document.getElementById('outfit');
  const page       = document.getElementById('page');
  const tileGrid   = document.getElementById('tileGrid');

  // Each outfit maps slot → image url. The first entry MUST match the intro
  // animation's photos (outfit_1). Drop a new outfits/outfit_N folder and add
  // an entry here to extend the rotation; mixed extensions are fine.
  const OUTFITS = [
    { shirt: 'outfits/outfit_1/shirt.png', pants: 'outfits/outfit_1/pants.png', belt: 'outfits/outfit_1/belt.png', shoes: 'outfits/outfit_1/shoes.png' },
    { shirt: 'outfits/outfit_2/shirt.png', pants: 'outfits/outfit_2/pants.png', belt: 'outfits/outfit_2/belt.png', shoes: 'outfits/outfit_2/shoes.png' },
    { shirt: 'outfits/outfit_3/shirt.png', pants: 'outfits/outfit_3/pants.png', belt: 'outfits/outfit_3/belt.png', shoes: 'outfits/outfit_3/shoes.png' },
  ];
  let outfitIdx = 0;

  // Preload so a cycle never flashes a half-loaded photo.
  OUTFITS.forEach(o => { for (const k in o) { const im = new Image(); im.src = o[k]; } });

  // ±13deg, applied to a pair of <img> elements so they don't read as a clone
  function jitterRotation(elA, elB, range = 26) {
    const r1 = (Math.random() - 0.5) * range;
    const r2 = (Math.random() - 0.5) * range;
    if (elA) elA.style.transform = `rotate(${r1.toFixed(1)}deg)`;
    if (elB) elB.style.transform = `rotate(${r2.toFixed(1)}deg)`;
  }
  function randomizeFlatLayShoes() {
    jitterRotation(
      outfit.querySelector('.piece.sneakers .shoe-l'),
      outfit.querySelector('.piece.sneakers .shoe-r')
    );
  }
  function applyOutfit(idx) {
    const o = OUTFITS[idx % OUTFITS.length];
    outfit.querySelectorAll('img.photo').forEach(img => {
      const slot = img.dataset.slot;
      if (o[slot]) img.src = o[slot];
    });
    randomizeFlatLayShoes();
  }
  // outfit_1 is hard-coded in the markup; this seeds shoe rotations.
  applyOutfit(0);

  // ============================================================
  // SECTION 2 — ambient sparkles
  // ============================================================

  function spawnSpark(persistent = false) {
    const s = document.createElement('div');
    s.className = 'spark';
    s.style.left = (Math.random() * 100) + 'vw';
    s.style.top  = (Math.random() * 100) + 'vh';
    s.style.setProperty('--dx', ((Math.random() - 0.5) * 30) + 'px');
    s.style.setProperty('--dy', (-10 - Math.random() * 30) + 'px');
    const dur = 2800 + Math.random() * 3200;
    s.style.animation = `twinkle ${dur}ms ease-in-out ${persistent ? 'infinite' : '1'}`;
    if (Math.random() < 0.3) { s.style.width = '9px'; s.style.height = '9px'; }
    sparkLayer.appendChild(s);
    if (!persistent) setTimeout(() => s.remove(), dur + 200);
  }
  for (let i = 0; i < 14; i++) setTimeout(spawnSpark, i * 180);
  for (let i = 0; i < 4; i++) spawnSpark(true);
  setInterval(spawnSpark, 1600);

  // ============================================================
  // SECTION 3 — intro sequence (ribbon → drop → converge → tile reveal)
  // ============================================================

  const items = [
    { el: document.getElementById('item-shirt'),    dropT: 0.20, finalClass: 'shirt' },
    { el: document.getElementById('item-jeans'),    dropT: 0.42, finalClass: 'jeans' },
    { el: document.getElementById('item-hat'),      dropT: 0.62, finalClass: 'hat' },
    { el: document.getElementById('item-sneakers'), dropT: 0.82, finalClass: 'sneakers' },
  ];

  // randomize each intro shoe ±15deg so the pair doesn't look like a clone
  jitterRotation(
    document.querySelector('#item-sneakers .shoe-l'),
    document.querySelector('#item-sneakers .shoe-r'),
    30
  );

  let svgEl = null;
  function getPathPoint(t) {
    if (!svgEl || !path) return { x: innerWidth / 2, y: innerHeight / 2 };
    const L = path.getTotalLength();
    const p = path.getPointAtLength(L * t);
    // viewBox is 1600x900 stretched to fill via preserveAspectRatio="none"
    return { x: p.x * innerWidth / 1600, y: p.y * innerHeight / 900 };
  }

  function startSequence() {
    svgEl = document.querySelector('.ribbon-wrap svg');
    setTimeout(() => ribbon.classList.add('active'), 500);

    items.forEach((item) => {
      const dropDelay = 500 + item.dropT * 1600; // along the 1.8s ribbon draw
      // One-shot anchor offset: ±25% of width horizontally, ±10% vertically.
      // Each piece dangles off the path at a different point so motion never
      // feels lockstep. Captured at spawn — no per-frame jitter.
      const w = item.el.offsetWidth  || parseFloat(item.el.style.width)  || 80;
      const h = item.el.offsetHeight || parseFloat(item.el.style.height) || 80;
      const halfW = w / 2, halfH = h / 2;
      const anchorX = (Math.random() - 0.5) * 0.5 * w;
      const anchorY = (Math.random() - 0.5) * 0.2 * h;

      setTimeout(() => {
        const p = getPathPoint(item.dropT);
        item.el.style.transition = 'none';
        item.el.style.left = p.x + 'px';
        item.el.style.top  = p.y + 'px';
        item.el.style.marginLeft = (-halfW + anchorX) + 'px';
        item.el.style.marginTop  = (-halfH + anchorY) + 'px';
        item.el.style.opacity = '0';
        item.el.style.transform = `translate(0,0) rotateX(60deg) rotateY(0deg) rotateZ(0deg) scale(0.4)`;
        requestAnimationFrame(() => {
          item.el.style.transition = 'transform 900ms cubic-bezier(.2,.7,.3,1.2), opacity 300ms ease';
          item.el.style.opacity = '1';
          const rX = 360 + Math.random() * 360;
          const rY = 360 + Math.random() * 360;
          const rZ = (Math.random() - 0.5) * 240;
          item.el.style.transform = `translate(${(Math.random()-0.5)*60}px, ${(Math.random()-0.5)*40}px) rotateX(${rX}deg) rotateY(${rY}deg) rotateZ(${rZ}deg) scale(1)`;
        });
      }, dropDelay);
    });

    // Critical timing — the tile flip MUST cover the screen before any item
    // settles into its flat-lay slot, so the swap from "flying" to "static
    // outfit" happens completely under the cover (no visible snap):
    //   2200ms  converge() — items animate toward center over 1100ms
    //   2350ms  doTileFlip() — kicks off ~halfway into convergence
    //   ~3200ms full radial cover reached — items still mid-motion
    //   3300ms  swap items → static outfit (HIDDEN under tiles)
    //   3750ms  hold ends, tile grid begins fading
    //   4250ms  fade complete, landing page visible
    setTimeout(converge,   2200);
    setTimeout(doTileFlip, 2350);
    setTimeout(() => {
      items.forEach(item => { item.el.style.opacity = '0'; });
      outfit.classList.add('show');
      page.classList.add('show');
      // Reveal the sticky header at the same moment as the landing chrome.
      const header = document.getElementById('siteHeader');
      if (header) header.classList.add('show');
      // Intro is fully revealed; unlock scroll so the user can move into the
      // onboarding/pricing/faq sections. Snap behavior is defined in CSS.
      document.documentElement.classList.add('scrollable');
    }, 3300);

    // First cycle 10s after the reveal completes (~4250ms), then every 10s.
    setTimeout(() => {
      cycleOutfit();
      setInterval(cycleOutfit, 10000);
    }, 14000);
  }

  function converge() {
    const cx = innerWidth / 2, cy = innerHeight / 2;
    const offsets = {
      shirt:    { x: 0,   y: -90,  rY: 720, rZ: 0  },
      jeans:    { x: 0,   y: 30,   rY: 720, rZ: 0  },
      sneakers: { x: 0,   y: 140,  rY: 360, rZ: 0  },
      hat:      { x: 110, y: -100, rY: 720, rZ: 12 },
    };
    items.forEach((item) => {
      const o = offsets[item.finalClass];
      if (!o) return;
      item.el.style.transition = 'transform 1100ms cubic-bezier(.4,.0,.2,1), left 1100ms cubic-bezier(.4,.0,.2,1), top 1100ms cubic-bezier(.4,.0,.2,1), opacity 600ms ease';
      item.el.style.left = cx + 'px';
      item.el.style.top  = cy + 'px';
      item.el.style.transform = `translate(${o.x}px, ${o.y}px) rotateX(0deg) rotateY(${o.rY}deg) rotateZ(${o.rZ}deg) scale(1)`;
    });
    setTimeout(() => { ribbon.style.opacity = '0'; }, 400);
  }

  function doTileFlip() {
    const ROWS = 8, COLS = 8;
    tileGrid.innerHTML = '';
    tileGrid.style.display = '';
    tileGrid.style.opacity = '';
    tileGrid.style.transition = '';
    tileGrid.classList.add('active');

    // Integer pixel sizing + 1px overlap kills sub-pixel seams between tiles.
    const cellW = Math.ceil(innerWidth  / COLS);
    const cellH = Math.ceil(innerHeight / ROWS);
    const tileW = cellW + 1, tileH = cellH + 1;

    const cr = (ROWS - 1) / 2, cc = (COLS - 1) / 2;
    const maxDist = Math.hypot(cr, cc);

    const tiles = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = document.createElement('div');
        t.className = 'tile';
        t.style.left   = (c * cellW) + 'px';
        t.style.top    = (r * cellH) + 'px';
        t.style.width  = tileW + 'px';
        t.style.height = tileH + 'px';

        const front = document.createElement('div'); front.className = 'face front';
        const back  = document.createElement('div'); back.className  = 'face back';
        const hueShift = ((r * COLS + c) % 5) - 2;
        const l = 94 + hueShift;
        back.style.background = `linear-gradient(to bottom, hsl(208 55% ${l}%), hsl(208 60% ${Math.min(l + 4, 99)}%))`;
        back.style.backgroundColor = '#E8F2FB';

        t.appendChild(front);
        t.appendChild(back);
        tileGrid.appendChild(t);
        tiles.push({ el: t, dist: Math.hypot(r - cr, c - cc) });
      }
    }

    // Closest-to-center tiles flip first; once 60% have started, the rest go
    // in a quick burst so the cover finishes radially.
    tiles.sort((a, b) => a.dist - b.dist);
    const threshold = Math.floor(tiles.length * 0.6);
    tiles.forEach((tile, idx) => {
      const delay = idx < threshold
        ? (tile.dist / maxDist) * 450
        : 480 + (idx - threshold) * 2;
      setTimeout(() => tile.el.classList.add('flipping'), delay);
    });

    // Last tile starts flipping ~530ms in, mid-flip (cover) ~855ms in. Hold
    // ~545ms, then fade. force-flipped pins every tile to its final state so
    // none can be caught mid-rotation while opacity drops.
    setTimeout(() => {
      tiles.forEach(t => t.el.classList.add('force-flipped'));
      tileGrid.style.transition = 'opacity 500ms ease';
      tileGrid.style.opacity = '0';
      setTimeout(() => { tileGrid.style.display = 'none'; tileGrid.innerHTML = ''; }, 540);
    }, 1400);
  }

  // ============================================================
  // SECTION 4 — outfit cycling choreographies
  // ============================================================
  // All exit/enter motion runs via WAAPI on the .fly wrapper. .bob keeps
  // running on .bob underneath, so when a choreography finishes and we cancel
  // its WAAPI animation, .fly returns to identity and bob composes seamlessly.

  const EASE_OUT   = 'cubic-bezier(.4, .1, .3, 1)';
  const EASE_IN    = 'cubic-bezier(.5, 0, .85, .2)';
  const EASE_INOUT = 'cubic-bezier(.4, 0, .2, 1)';

  // Each function returns a Promise that resolves when the choreography is done.

  // Run a per-fly WAAPI animation in parallel and resolve when all finish.
  // `framesFn(i)` returns the keyframe array for fly index `i`. `opts` is the
  // WAAPI options — either a plain object (same for every fly) or a function
  // `(i) => opts` so per-index staggers can vary `delay`. `fill: 'forwards'`
  // is applied by default. Used by every choreography below to remove the
  // Promise.all/map/animate boilerplate that was otherwise duplicated 12+ times.
  function animateAll(flys, framesFn, opts) {
    return Promise.all(flys.map((fly, i) => {
      const o = typeof opts === 'function' ? opts(i) : opts;
      return fly.animate(framesFn(i), { fill: 'forwards', ...o }).finished;
    }));
  }

  // A) CONGA LINE — exit one by one off one edge; entry one by one from the opposite.
  function exitConga(flys) {
    const dir = Math.random() < 0.5 ? -1 : 1;
    const dx  = dir * (innerWidth * 0.7 + 240);
    return animateAll(flys, () => {
      const vy = (Math.random() - 0.5) * 60;
      const vr = (Math.random() - 0.5) * 30;
      return [
        { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 },
        { transform: `translate(${dx*0.45}px, ${vy*0.5}px) rotate(${dir*30 + vr}deg) scale(0.95)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx}px, ${vy}px) rotate(${dir*90 + vr}deg) scale(0.7)`, opacity: 0 }
      ];
    }, (i) => ({ duration: 600, delay: i * 130, easing: EASE_IN }));
  }
  function enterConga(flys) {
    const dir = Math.random() < 0.5 ? -1 : 1;
    const sx  = -dir * (innerWidth * 0.7 + 240);
    return animateAll(flys, () => {
      const vy = (Math.random() - 0.5) * 60;
      const vr = (Math.random() - 0.5) * 30;
      return [
        { transform: `translate(${sx}px, ${vy}px) rotate(${-dir*90 + vr}deg) scale(0.7)`, opacity: 0 },
        { opacity: 1, offset: 0.18 },
        { transform: `translate(${sx*0.4}px, ${vy*0.5}px) rotate(${-dir*30 + vr}deg) scale(0.95)`, opacity: 1, offset: 0.6 },
        { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 }
      ];
    }, (i) => ({ duration: 700, delay: i * 130, easing: EASE_OUT }));
  }

  // B) SWIRL BREAK — gather into orbital ring, spin as a group, then break out.
  function exitSwirl(flys) {
    const N = flys.length;
    const radius = 130;
    return animateAll(flys, (i) => {
      const a0 = (i / N) * Math.PI * 2;
      const a1 = a0 + Math.PI * 1.1;
      return [
        { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(a0)*radius}px, ${Math.sin(a0)*radius}px) rotate(${a0*180/Math.PI}deg) scale(0.95)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${Math.cos(a1)*radius}px, ${Math.sin(a1)*radius}px) rotate(${a1*180/Math.PI}deg) scale(0.95)`, opacity: 1 }
      ];
    }, { duration: 600, easing: EASE_INOUT })
    .then(() => animateAll(flys, (i) => {
      const a1 = (i / N) * Math.PI * 2 + Math.PI * 1.1;
      const fromX = Math.cos(a1) * radius, fromY = Math.sin(a1) * radius;
      const dir = Math.random() * Math.PI * 2;
      const dist = 700 + Math.random() * 300;
      return [
        { transform: `translate(${fromX}px, ${fromY}px) rotate(${a1*180/Math.PI}deg) scale(0.95)`, opacity: 1 },
        { transform: `translate(${Math.cos(dir)*dist}px, ${Math.sin(dir)*dist}px) rotate(${(Math.random()-0.5)*900}deg) scale(0.5)`, opacity: 0 }
      ];
    }, { duration: 500, easing: EASE_IN }));
  }
  function enterSwirl(flys) {
    const N = flys.length;
    const radius = 130;
    return animateAll(flys, (i) => {
      const a0 = (i / N) * Math.PI * 2;
      const dir = Math.random() * Math.PI * 2;
      const dist = 700 + Math.random() * 300;
      return [
        { transform: `translate(${Math.cos(dir)*dist}px, ${Math.sin(dir)*dist}px) rotate(${(Math.random()-0.5)*900}deg) scale(0.5)`, opacity: 0 },
        { opacity: 1, offset: 0.25 },
        { transform: `translate(${Math.cos(a0)*radius}px, ${Math.sin(a0)*radius}px) rotate(${a0*180/Math.PI}deg) scale(0.95)`, opacity: 1 }
      ];
    }, { duration: 600, easing: EASE_OUT })
    .then(() => animateAll(flys, (i) => {
      const a0 = (i / N) * Math.PI * 2;
      const a1 = a0 + Math.PI * 0.9;
      return [
        { transform: `translate(${Math.cos(a0)*radius}px, ${Math.sin(a0)*radius}px) rotate(${a0*180/Math.PI}deg) scale(0.95)`, opacity: 1 },
        { transform: `translate(${Math.cos(a1)*radius}px, ${Math.sin(a1)*radius}px) rotate(${a1*180/Math.PI}deg) scale(0.95)`, opacity: 1 }
      ];
    }, { duration: 350, easing: EASE_INOUT }))
    .then(() => animateAll(flys, (i) => {
      const a1 = (i / N) * Math.PI * 2 + Math.PI * 0.9;
      return [
        { transform: `translate(${Math.cos(a1)*radius}px, ${Math.sin(a1)*radius}px) rotate(${a1*180/Math.PI}deg) scale(0.95)`, opacity: 1 },
        { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 }
      ];
    }, { duration: 400, easing: EASE_OUT }));
  }

  // C) SHATTER — explode in random directions; entry converges from random offscreen.
  function exitShatter(flys) {
    return animateAll(flys, () => {
      const ang = Math.random() * Math.PI * 2;
      const dist = 800 + Math.random() * 400;
      const rot = (Math.random() - 0.5) * 1080;
      return [
        { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(ang)*dist}px, ${Math.sin(ang)*dist}px) rotate(${rot}deg) scale(0.5)`, opacity: 0 }
      ];
    }, { duration: 700, easing: EASE_IN });
  }
  function enterShatter(flys) {
    return animateAll(flys, () => {
      const ang = Math.random() * Math.PI * 2;
      const dist = 750 + Math.random() * 400;
      const rot = (Math.random() - 0.5) * 1080;
      return [
        { transform: `translate(${Math.cos(ang)*dist}px, ${Math.sin(ang)*dist}px) rotate(${rot}deg) scale(0.5)`, opacity: 0 },
        { opacity: 1, offset: 0.2 },
        { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 }
      ];
    }, { duration: 850, easing: EASE_OUT });
  }

  // D) PAGE TURN — coordinated horizontal sweep, like flipping a magazine page.
  function exitPageTurn(flys) {
    const off = innerWidth * 0.7 + 200;
    return animateAll(flys, () => {
      const vy = (Math.random() - 0.5) * 30;
      return [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${-off}px, ${vy}px) rotate(${-12 + (Math.random()-0.5)*8}deg)`, opacity: 0 }
      ];
    }, (i) => ({ duration: 800, delay: i * 60, easing: EASE_IN }));
  }
  function enterPageTurn(flys) {
    const off = innerWidth * 0.7 + 200;
    return animateAll(flys, () => {
      const vy = (Math.random() - 0.5) * 30;
      return [
        { transform: `translate(${off}px, ${vy}px) rotate(${12 + (Math.random()-0.5)*8}deg)`, opacity: 0 },
        { opacity: 1, offset: 0.18 },
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 }
      ];
    }, (i) => ({ duration: 900, delay: i * 60, easing: EASE_OUT }));
  }

  // E) CURTAIN DROP — gravity fall down/in with a tiny bounce on settle.
  const GRAVITY_EASE = 'cubic-bezier(.55, 0, .9, .25)';
  function exitCurtain(flys) {
    const fallY = innerHeight * 0.7 + 200;
    return animateAll(flys, () => {
      const driftX = (Math.random() - 0.5) * 80;
      const rot = (Math.random() - 0.5) * 30;
      return [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${driftX}px, ${fallY}px) rotate(${rot}deg)`, opacity: 0 }
      ];
    }, (i) => ({ duration: 720, delay: i * 80, easing: GRAVITY_EASE }));
  }
  function enterCurtain(flys) {
    const startY = -(innerHeight * 0.7 + 200);
    return animateAll(flys, () => {
      const driftX = (Math.random() - 0.5) * 60;
      const rot = (Math.random() - 0.5) * 24;
      return [
        { transform: `translate(${driftX}px, ${startY}px) rotate(${rot}deg)`, opacity: 0 },
        { opacity: 1, offset: 0.12 },
        { transform: 'translate(0, 6px) rotate(0deg)', opacity: 1, offset: 0.78, easing: 'cubic-bezier(.4, 0, .3, 1)' },
        { transform: 'translate(0, -2px) rotate(0deg)', opacity: 1, offset: 0.9, easing: 'cubic-bezier(.4, 0, .6, 1)' },
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 }
      ];
    }, (i) => ({ duration: 880, delay: i * 80, easing: GRAVITY_EASE }));
  }

  // F) FLIPBOOK — staggered Y-axis flips, ~360ms each with 200ms overlap.
  function exitFlipbook(flys) {
    return animateAll(flys, () => [
      { transform: 'rotateY(0deg)',   opacity: 1 },
      { transform: 'rotateY(90deg)',  opacity: 1, offset: 0.5 },
      { transform: 'rotateY(180deg)', opacity: 0 }
    ], (i) => ({ duration: 360, delay: i * 200, easing: EASE_IN }));
  }
  function enterFlipbook(flys) {
    return animateAll(flys, () => [
      { transform: 'rotateY(-180deg)', opacity: 0 },
      { transform: 'rotateY(-90deg)',  opacity: 1, offset: 0.5 },
      { transform: 'rotateY(0deg)',    opacity: 1 }
    ], (i) => ({ duration: 400, delay: i * 200, easing: EASE_OUT }));
  }

  // G) ELEVATOR — rigid group slide. No rotation, no separation.
  function exitElevator(flys) {
    const offY = -(innerHeight * 0.55 + 220);
    return animateAll(flys, () => [
      { transform: 'translate(0, 0)',         opacity: 1 },
      { transform: `translate(0, ${offY}px)`, opacity: 1, offset: 0.85 },
      { transform: `translate(0, ${offY}px)`, opacity: 0 }
    ], { duration: 680, easing: 'cubic-bezier(.5, 0, .3, 1)' });
  }
  function enterElevator(flys) {
    const startY = innerHeight * 0.55 + 220;
    return animateAll(flys, () => [
      { transform: `translate(0, ${startY}px)`, opacity: 0 },
      { transform: `translate(0, ${startY}px)`, opacity: 1, offset: 0.12 },
      { transform: 'translate(0, 0)',           opacity: 1 }
    ], { duration: 760, easing: 'cubic-bezier(.2, .7, .3, 1)' });
  }

  // H) STATIC / GLITCH — discrete jitter then hard cut. Per-keyframe steps(1, end)
  // disables tweening, producing crisp digital flicker rather than smooth motion.
  function glitchFrames(N, fadeIn) {
    const frames = fadeIn
      ? [{ transform: 'translate(0, 0)', opacity: 0, easing: 'steps(1, end)' }]
      : [];
    for (let k = 0; k < N; k++) {
      const dx = (Math.random() - 0.5) * 14;
      const dy = (Math.random() - 0.5) * 14;
      frames.push({ transform: `translate(${dx}px, ${dy}px)`, opacity: 1, easing: 'steps(1, end)' });
    }
    frames.push({ transform: 'translate(0, 0)', opacity: fadeIn ? 1 : 0, easing: 'steps(1, end)' });
    return frames;
  }
  function exitGlitch(flys) {
    return animateAll(flys, () => glitchFrames(9, false), { duration: 240 });
  }
  function enterGlitch(flys) {
    return animateAll(flys, () => glitchFrames(9, true),  { duration: 280 });
  }

  // Choreography registry. Add a pair here and it's automatically in rotation.
  // NOTE: "vacuum" and "scatter & reform" intentionally omitted — both reduce
  // to "shrink + rotate outward in random direction", which is just Shatter.
  const CHOREOS = {
    conga:    { exit: exitConga,    enter: enterConga    },
    swirl:    { exit: exitSwirl,    enter: enterSwirl    },
    shatter:  { exit: exitShatter,  enter: enterShatter  },
    pageTurn: { exit: exitPageTurn, enter: enterPageTurn },
    curtain:  { exit: exitCurtain,  enter: enterCurtain  },
    flipbook: { exit: exitFlipbook, enter: enterFlipbook },
    elevator: { exit: exitElevator, enter: enterElevator },
    glitch:   { exit: exitGlitch,   enter: enterGlitch   },
  };
  const CHOREO_NAMES = Object.keys(CHOREOS);

  let cycling = false;
  let lastChoreoName = null;
  function pickChoreo() {
    const pool = CHOREO_NAMES.filter(n => n !== lastChoreoName);
    const name = pool[Math.floor(Math.random() * pool.length)];
    lastChoreoName = name;
    return name;
  }

  async function cycleOutfit() {
    if (cycling) return;
    cycling = true;
    const flys = [...outfit.querySelectorAll('.piece .fly')];
    flys.forEach(f => f.getAnimations().forEach(a => a.cancel()));

    const choreo = CHOREOS[pickChoreo()];
    try {
      await choreo.exit(flys);
      // Under-cover swap: photos swap while flys are at opacity 0.
      outfitIdx = (outfitIdx + 1) % OUTFITS.length;
      applyOutfit(outfitIdx);
      await choreo.enter(flys);
    } finally {
      // Cancel WAAPI so .fly returns to identity transform; .bob continues.
      flys.forEach(f => f.getAnimations().forEach(a => a.cancel()));
      cycling = false;
    }
  }

  // Click-to-spin: clicking a piece does a quick 360° rotation. We attach to
  // the .fly wrapper because that's the same element cycleOutfit drives —
  // .bob keeps composing its idle wobble inside, .grow hover scale keeps
  // working on top. We deliberately gate clicks on `cycling` so the simpler
  // option holds: a click during a transition is just ignored (not queued).
  // Per-element `spinning` re-entrancy guard prevents stacking spins from
  // rapid double-clicks; subsequent clicks are no-ops until the animation
  // ends. Same helper is reused below for FAQ flat-lay images.
  const SPIN_DURATION = 600;
  const SPIN_EASING   = 'cubic-bezier(0.45, 0, 0.55, 1)';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const spinning = new WeakSet();
  // composite: 'add' so the spin composes with any pre-existing transform
  // (the FAQ flat-lay imgs already carry inline rotate(-4deg) etc.) rather
  // than snapping them to 0° at the start of the animation.
  function spinElement(el) {
    if (reducedMotion.matches) return;
    if (spinning.has(el)) return;
    spinning.add(el);
    const anim = el.animate(
      [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(360deg)' },
      ],
      { duration: SPIN_DURATION, easing: SPIN_EASING, composite: 'add' }
    );
    const release = () => {
      anim.cancel();
      spinning.delete(el);
    };
    anim.onfinish = release;
    anim.oncancel = release;
  }
  outfit.addEventListener('click', (e) => {
    if (cycling) return;
    const piece = e.target.closest('.piece');
    if (!piece || !outfit.contains(piece)) return;
    const fly = piece.querySelector('.fly');
    if (!fly) return;
    spinElement(fly);
  });

  // FAQ flat-lay images get the same 360° click-spin. They have inline
  // rotations from CSS that we want to preserve, so spinElement uses
  // composite: 'add' to layer the rotation on top instead of resetting.
  document.querySelectorAll('.faq-flatlay .fl').forEach((img) => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => spinElement(img));
  });

  // ----- FAQ accordion (WAAPI) -----
  // The native <details> toggle plus the CSS grid-template-rows trick worked
  // on first open then snapped on subsequent opens (UA content-visibility
  // optimizations interfere with the cached track interpolation). Driving
  // height directly from JS sidesteps that and lets us control easing/
  // duration ourselves. Pattern: intercept the summary click, prevent the
  // default toggle, animate height, then commit/remove [open] at the end.
  const FAQ_DURATION = 280;
  const FAQ_EASING   = 'cubic-bezier(0.4, 0, 0.2, 1)';
  document.querySelectorAll('.faq-item').forEach((item) => {
    const summary = item.querySelector('summary');
    const body    = item.querySelector('.faq-body');
    if (!summary || !body) return;
    let running = null;
    summary.addEventListener('click', (e) => {
      e.preventDefault();
      // Cancel any in-flight animation and read current height as the start
      // so a mid-flight toggle reverses smoothly from where it is.
      if (running) running.cancel();
      const startHeight = body.getBoundingClientRect().height;
      const isOpen = item.hasAttribute('open');
      if (isOpen) {
        running = body.animate(
          [{ height: startHeight + 'px' }, { height: '0px' }],
          { duration: FAQ_DURATION, easing: FAQ_EASING }
        );
        running.onfinish = () => {
          item.removeAttribute('open');
          body.style.height = '';
          running = null;
        };
      } else {
        // Pin inline height before flipping [open] so the body doesn't flash
        // open at full size for a frame between the attribute change and the
        // animation's first composited keyframe.
        body.style.height = startHeight + 'px';
        item.setAttribute('open', '');
        const target = body.scrollHeight;
        running = body.animate(
          [{ height: startHeight + 'px' }, { height: target + 'px' }],
          { duration: FAQ_DURATION, easing: FAQ_EASING }
        );
        running.onfinish = () => {
          body.style.height = '';
          running = null;
        };
      }
    });
  });

  setTimeout(startSequence, 120);

  // ============================================================
  // SECTION 5 — chrome (marquee, timestamp, join button micro-flip, form)
  // ============================================================

  const campuses = [
    'NYU','Columbia','Parsons','FIT','Barnard','USC','UCLA','Stanford',
    'Brown','RISD','Yale','Harvard','MIT','UChicago','Michigan',
    'UT Austin','Vanderbilt','Duke','UNC','Emory','Tulane'
  ];
  const mq = document.getElementById('marquee');
  const buildMarquee = () => campuses.map(n => `<span>${n}</span><span class="bullet">•</span>`).join('');
  // double up so the linear translateX(-50%) loop is seamless
  mq.innerHTML = buildMarquee() + buildMarquee();

  const ts = document.getElementById('ts');
  const fmtTs = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };
  ts.textContent = fmtTs(new Date());
  setInterval(() => { ts.textContent = fmtTs(new Date()); }, 1000);

  // Join button micro-flip: 2x1 grid, low-contrast back face, ≤ 200ms total.
  // Front/back face colors live in CSS so they pick up theme tokens.
  document.querySelectorAll('.micro-host').forEach(host => {
    const micro = host.querySelector('.micro');
    if (!micro) return;
    const COLS = 2;
    const cc = (COLS - 1) / 2;
    for (let c = 0; c < COLS; c++) {
      const mt = document.createElement('div');
      mt.className = 'mtile';
      const mf = document.createElement('div'); mf.className = 'mf';
      const mb = document.createElement('div'); mb.className = 'mf mb';
      mt.appendChild(mf); mt.appendChild(mb);
      mt.style.transitionDelay = Math.min(Math.abs(c - cc) * 40, 40) + 'ms';
      micro.appendChild(mt);
    }
  });

  // Theme toggle. The icon does a vertical twist (squeeze in tall, swap glyph,
  // squeeze back out) while .dark on <body> swaps the CSS theme tokens; the
  // page-wide color transitions are driven by CSS on those variables.
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const glyph = themeToggle.querySelector('.theme-glyph');
    const TWIST_HALF = 170;
    const TWIST_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
    let twisting = false;

    const applyTheme = (isDark) => {
      document.body.classList.toggle('dark', isDark);
      themeToggle.setAttribute('aria-pressed', String(isDark));
      if (glyph) glyph.textContent = isDark ? '☾' : '☼';
    };

    themeToggle.addEventListener('click', async () => {
      if (twisting) return;
      const isDark = !document.body.classList.contains('dark');

      if (!glyph || reducedMotion.matches) {
        applyTheme(isDark);
        return;
      }

      twisting = true;
      try {
        const squeeze = glyph.animate(
          [
            { transform: 'scaleX(1) scaleY(1)' },
            { transform: 'scaleX(0) scaleY(1.25)' },
          ],
          { duration: TWIST_HALF, easing: TWIST_EASE, fill: 'forwards' },
        );
        await squeeze.finished;

        applyTheme(isDark);

        const expand = glyph.animate(
          [
            { transform: 'scaleX(0) scaleY(1.25)' },
            { transform: 'scaleX(1) scaleY(1)' },
          ],
          { duration: TWIST_HALF, easing: TWIST_EASE },
        );
        await expand.finished;

        // Drop the lingering forward-fill from the squeeze so the glyph
        // settles at its natural CSS transform (none) instead of a stuck
        // scaleX(0). Cancelling both animations clears all WAAPI commits.
        glyph.getAnimations().forEach((a) => a.cancel());
      } finally {
        twisting = false;
      }
    });
  }

  // Waitlist form → Formspree (AJAX, no redirect, no extra deps).
  const captureForm  = document.getElementById('capture');
  const emailInput   = document.getElementById('email');
  const joinBtn      = document.getElementById('join');
  const joinLabelEl  = joinBtn?.querySelector('.join-label');

  const shakeForm = () => captureForm.animate([
    { transform: 'translateX(-50%)' },
    { transform: 'translate(calc(-50% - 6px))' },
    { transform: 'translate(calc(-50% + 6px))' },
    { transform: 'translateX(-50%)' },
  ], { duration: 280 });

  // Success: replace the form with a thank-you state. We don't reuse this for
  // errors because the user needs the form back to retry.
  const showCaptureSuccess = (text) => {
    captureForm.innerHTML =
      `<div class="capture-status capture-status--ok" role="status" aria-live="polite">${text}</div>`;
  };

  // Error: keep the form intact, shake it, and surface the message via the
  // input's title so screen readers / hover get context. Restoring the button
  // label lets the user retry immediately.
  const handleCaptureError = (msg, originalLabel) => {
    joinBtn.disabled = false;
    if (joinLabelEl) joinLabelEl.textContent = originalLabel;
    emailInput.setAttribute('aria-invalid', 'true');
    emailInput.title = msg;
    shakeForm();
  };

  if (captureForm) {
    emailInput.addEventListener('input', () => {
      emailInput.removeAttribute('aria-invalid');
      emailInput.removeAttribute('title');
    });

    captureForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        handleCaptureError('please enter a valid email', joinLabelEl?.textContent ?? 'join');
        emailInput.focus();
        return;
      }

      const originalLabel = joinLabelEl?.textContent ?? 'join';
      joinBtn.disabled = true;
      if (joinLabelEl) joinLabelEl.textContent = 'sending…';

      try {
        const res = await fetch(captureForm.action, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(captureForm),
        });
        if (res.ok) {
          showCaptureSuccess('you’re on the list. ✿');
          return;
        }
        // Surface Formspree's error message when it gives one (invalid email,
        // rate limit, etc.), otherwise a friendly fallback.
        const data = await res.json().catch(() => ({}));
        const msg = data?.errors?.[0]?.message || 'something went wrong. try again?';
        handleCaptureError(msg, originalLabel);
      } catch (err) {
        handleCaptureError('network hiccup. try again?', originalLabel);
      }
    });
  }

  // Plan + final CTA buttons all funnel into the existing waitlist. We scroll
  // to the very top of the document (so the user lands on section 1 from its
  // top edge, not centered on the form mid-section), then focus the email
  // input once the smooth-scroll settles. Kept dependency-free (no second
  // Formspree form, no per-plan state to maintain).
  const scrollToTopAndFocus = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // 700ms covers a typical smooth scroll across the full document. preventScroll
    // stops focus from yanking the viewport off the snap point we just landed on.
    setTimeout(() => {
      const input = document.getElementById('email');
      if (input && typeof input.focus === 'function') input.focus({ preventScroll: true });
    }, 700);
  };
  document.querySelectorAll('.plan-cta, .faq-cta').forEach((btn) => {
    btn.addEventListener('click', scrollToTopAndFocus);
  });

  // Site header gains a translucent glass bar once the user scrolls past the
  // top of section 1, so it stays legible against the busier sections below.
  // We use a small threshold (40px) so it doesn't flicker on micro-scrolls.
  const siteHeader = document.getElementById('siteHeader');
  if (siteHeader) {
    let raf = 0;
    const updateHeader = () => {
      raf = 0;
      siteHeader.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(updateHeader);
    }, { passive: true });
  }
})();
