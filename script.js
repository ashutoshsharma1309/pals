/* =========================================================
   PALs Hack 2026 — premium interactions
   - Loader
   - Scroll progress bar
   - Nav scroll state + scrollspy + mobile toggle
   - Mouse-reactive cursor glow
   - Canvas particles + connection lines
   - Reveal-on-scroll (staggered)
   - Magnetic buttons
   - 3D-tilt cards
   - Animated number counters
   - Timeline progressive line fill
   - Track-card mouse-tracking glow
   - Primary button cursor-tracking highlight
   ========================================================= */

(() => {
  const $  = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- LOADER ----------
  window.addEventListener("load", () => {
    const loader = $("#loader");
    if (!loader) return;
    // Brief delay so the loader registers visually
    setTimeout(() => loader.classList.add("is-done"), 650);
    setTimeout(() => { loader.style.display = "none"; }, 1400);
  });

  // ---------- NAV ----------
  const nav = $("#nav");
  const navToggle = $(".nav-toggle");
  const navLinks = $(".nav-links");
  const navAnchors = $$(".nav-links a");

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 24);
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, y / max) : 0;
    const bar = $(".scroll-progress");
    if (bar) bar.style.width = (p * 100) + "%";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    navAnchors.forEach((a) =>
      a.addEventListener("click", () => {
        navLinks.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  // Scrollspy
  const sections = $$("main section[id]");
  if (sections.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.id;
            navAnchors.forEach((a) =>
              a.classList.toggle("is-active", a.getAttribute("href") === "#" + id)
            );
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));
  }

  // ---------- CURSOR GLOW ----------
  const cursorGlow = $(".cursor-glow");
  if (cursorGlow && !prefersReducedMotion) {
    let tx = window.innerWidth / 2,
      ty = window.innerHeight / 2,
      cx = tx,
      cy = ty;
    document.body.classList.add("cursor-active");
    window.addEventListener("pointermove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
    });
    const animate = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      cursorGlow.style.transform = `translate3d(${cx - 240}px, ${cy - 240}px, 0)`;
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  // ---------- CANVAS PARTICLES + SHOOTING STARS ----------
  const canvas = $("#bg-canvas");
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext("2d", { alpha: true });
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];
    let shootingStars = [];
    let mouse = { x: -9999, y: -9999 };
    let lastStarSpawn = performance.now();
    let nextStarDelay = 2200;

    const resize = () => {
      w = canvas.clientWidth = window.innerWidth;
      h = canvas.clientHeight = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.min(120, Math.floor((w * h) / 16000));
      particles = new Array(target).fill(0).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.4,
        hue: Math.random() < 0.6 ? "cyan" : Math.random() < 0.5 ? "blue" : "red",
      }));
    };

    const colors = {
      cyan: "rgba(0, 240, 255, ALPHA)",
      blue: "rgba(58, 82, 255, ALPHA)",
      red: "rgba(255, 23, 68, ALPHA)",
    };

    const spawnShootingStar = () => {
      const fromLeft = Math.random() < 0.5;
      const angle = (Math.PI / 6) + (Math.random() * Math.PI) / 8; // 30°–52°
      const speed = 9 + Math.random() * 6;
      const tints = [
        { core: "rgba(255,255,255,", trail: "rgba(0,240,255," },
        { core: "rgba(255,255,255,", trail: "rgba(124,160,255," },
        { core: "rgba(255,255,255,", trail: "rgba(255,140,170," },
      ];
      shootingStars.push({
        x: fromLeft ? -80 : w + 80,
        y: Math.random() * h * 0.55,
        vx: (fromLeft ? 1 : -1) * Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: 90 + Math.random() * 110,
        life: 1,
        decay: 0.012 + Math.random() * 0.008,
        tint: tints[Math.floor(Math.random() * tints.length)],
      });
    };

    const draw = (now) => {
      ctx.clearRect(0, 0, w, h);

      // Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let boost = 0;
        if (dist < 160) {
          const f = (160 - dist) / 160;
          boost = f * 0.6;
          p.x += (dx / dist) * f * 0.6;
          p.y += (dy / dist) * f * 0.6;
        }

        ctx.beginPath();
        ctx.fillStyle = colors[p.hue].replace("ALPHA", 0.55 + boost);
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Connection lines
      ctx.lineWidth = 0.7;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 110 * 110) {
            const alpha = (1 - Math.sqrt(d2) / 110) * 0.16;
            ctx.strokeStyle = `rgba(124, 160, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Mouse-reactive halo
      if (mouse.x > -1000) {
        const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 220);
        g.addColorStop(0, "rgba(0, 240, 255, 0.08)");
        g.addColorStop(1, "rgba(0, 240, 255, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(mouse.x - 220, mouse.y - 220, 440, 440);
      }

      // Shooting stars — spawn occasionally
      if (now - lastStarSpawn > nextStarDelay) {
        spawnShootingStar();
        lastStarSpawn = now;
        nextStarDelay = 2200 + Math.random() * 5200;
      }

      // Render shooting stars
      ctx.lineCap = "round";
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= s.decay;

        if (s.life <= 0 || s.x < -200 || s.x > w + 200 || s.y > h + 200) {
          shootingStars.splice(i, 1);
          continue;
        }

        const tx = s.x - (s.vx / Math.hypot(s.vx, s.vy)) * s.len;
        const ty = s.y - (s.vy / Math.hypot(s.vx, s.vy)) * s.len;

        // Outer glow trail
        const grad = ctx.createLinearGradient(s.x, s.y, tx, ty);
        grad.addColorStop(0, s.tint.core + (0.95 * s.life) + ")");
        grad.addColorStop(0.4, s.tint.trail + (0.6 * s.life) + ")");
        grad.addColorStop(1, s.tint.trail + "0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Bright head
        ctx.beginPath();
        ctx.fillStyle = "rgba(255,255,255," + (0.9 * s.life) + ")";
        ctx.arc(s.x, s.y, 2.4, 0, Math.PI * 2);
        ctx.fill();

        // Soft head glow
        const headGlow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 18);
        headGlow.addColorStop(0, s.tint.trail + (0.45 * s.life) + ")");
        headGlow.addColorStop(1, s.tint.trail + "0)");
        ctx.fillStyle = headGlow;
        ctx.fillRect(s.x - 18, s.y - 18, 36, 36);
      }

      requestAnimationFrame(draw);
    };

    window.addEventListener("pointermove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    window.addEventListener("pointerleave", () => {
      mouse.x = mouse.y = -9999;
    });
    window.addEventListener("resize", resize);
    resize();
    requestAnimationFrame(draw);
  }

  // ---------- SCROLL PARALLAX (aurora depth) ----------
  if (!prefersReducedMotion) {
    const auroraBlue = $(".aurora-blue");
    const auroraRed = $(".aurora-red");
    const auroraCyan = $(".aurora-cyan");
    const grid = $(".bg-grid");
    let scrollY = window.scrollY;
    let ticking = false;

    const applyParallax = () => {
      // Different speeds → depth illusion
      if (auroraBlue) auroraBlue.style.transform = `translate3d(0, ${scrollY * -0.18}px, 0)`;
      if (auroraRed)  auroraRed.style.transform  = `translate3d(0, ${scrollY * -0.10}px, 0)`;
      if (auroraCyan) auroraCyan.style.transform = `translate3d(0, ${scrollY * -0.26}px, 0)`;
      if (grid)       grid.style.transform       = `translate3d(0, ${scrollY * 0.04}px, 0)`;
      ticking = false;
    };

    window.addEventListener("scroll", () => {
      scrollY = window.scrollY;
      if (!ticking) {
        requestAnimationFrame(applyParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  // ---------- REVEAL ON SCROLL ----------
  const revealEls = $$("[data-reveal]");
  revealEls.forEach((el) => {
    const s = el.getAttribute("data-stagger");
    if (s) el.style.setProperty("--stagger", s);
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // ---------- TIMELINE LINE FILL ----------
  const timeline = $(".timeline");
  if (timeline && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          timeline.classList.add("is-active");
          io.disconnect();
        }
      }),
      { threshold: 0.18 }
    );
    io.observe(timeline);
  }

  // ---------- MAGNETIC BUTTONS ----------
  if (!prefersReducedMotion) {
    $$("[data-magnetic]").forEach((el) => {
      const strength = 0.28;
      el.addEventListener("pointermove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
        // Update inner glow position for primary buttons
        const px = ((e.clientX - rect.left) / rect.width) * 100;
        const py = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty("--x", px + "%");
        el.style.setProperty("--y", py + "%");
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
      });
    });
  }

  // ---------- 3D TILT ----------
  if (!prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
    $$("[data-tilt]").forEach((el) => {
      const max = 6;
      let rafId = null;
      let tx = 0, ty = 0;

      const onMove = (e) => {
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const px = (mx / rect.width) - 0.5;
        const py = (my / rect.height) - 0.5;
        tx = -py * max;
        ty = px * max;
        // Pass mouse position to children that need it (track glow)
        el.style.setProperty("--mx", mx + "px");
        el.style.setProperty("--my", my + "px");
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          el.style.transform = `perspective(900px) rotateX(${tx}deg) rotateY(${ty}deg)`;
        });
      };
      const onLeave = () => {
        if (rafId) cancelAnimationFrame(rafId);
        el.style.transform = "";
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
    });
  }

  // ---------- ANIMATED COUNTERS ----------
  const counters = $$("[data-counter]");
  if (counters.length && "IntersectionObserver" in window) {
    const animate = (el) => {
      const target = parseInt(el.getAttribute("data-counter"), 10) || 0;
      const suffix = el.getAttribute("data-suffix") || "";
      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const v = Math.round(target * eased);
        el.textContent = v + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          animate(e.target);
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.3 }
    );
    counters.forEach((c) => io.observe(c));
  }

  // ---------- SMOOTH ANCHOR SCROLL ----------
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  });
})();
