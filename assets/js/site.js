(() => {
  'use strict';

  const body = document.body;
  const preloader = document.getElementById('preloader');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  body.classList.add('hero-armed');

  /* ---------------- preloader ---------------- */
  const loaderNumber = document.getElementById('loader-number');
  let loaderDone = false;

  function finishLoader() {
    if (loaderDone) return;
    loaderDone = true;
    body.classList.remove('is-loading');
    body.classList.add('is-ready');
    if (loaderNumber) loaderNumber.textContent = '100';
    if (preloader) {
      preloader.classList.add('is-done');
      window.setTimeout(() => preloader.remove(), 900);
    }
  }

  if (reduceMotion) {
    finishLoader();
  } else {
    if (document.readyState === 'complete') {
      window.setTimeout(finishLoader, 500);
    } else {
      window.addEventListener('load', () => window.setTimeout(finishLoader, 500), { once: true });
    }
    window.setTimeout(finishLoader, 3200);

    if (loaderNumber) {
      const begun = performance.now();
      const count = (now) => {
        const progress = Math.min(1, (now - begun) / 950);
        loaderNumber.textContent = String(Math.round(progress * 100)).padStart(2, '0');
        if (progress < 1) requestAnimationFrame(count);
      };
      requestAnimationFrame(count);
    }
  }

  /* ---------------- reveals no scroll ---------------- */
  const revealItems = Array.from(document.querySelectorAll('.reveal'));
  if (!reduceMotion && 'IntersectionObserver' in window) {
    body.classList.add('motion-ready');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  /* ---------------- contadores ---------------- */
  const counters = Array.from(document.querySelectorAll('[data-count]'));
  const countUp = (element) => {
    if (element.dataset.counted === 'true') return;
    element.dataset.counted = 'true';
    const target = Number(element.dataset.count);
    if (!Number.isFinite(target)) return;
    const pad = Number(element.dataset.pad || 0);
    const suffix = element.dataset.suffix || '';
    const duration = 1150;
    const start = performance.now();

    const frame = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      element.textContent = String(value).padStart(pad, '0') + suffix;
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((counter) => counterObserver.observe(counter));
  }

  /* ---------------- cabecalho, progresso e navegacao ativa ---------------- */
  const header = document.getElementById('site-header');
  const scrollBar = document.getElementById('scroll-bar');
  const toTop = document.querySelector('.to-top');
  const navLinks = Array.from(document.querySelectorAll('.nav a'));
  const sectionLinks = navLinks
    .map((link) => link.getAttribute('href'))
    .filter((href) => href && href.startsWith('#'));
  const sections = sectionLinks
    .map((href) => document.querySelector(href))
    .filter(Boolean);

  let ticking = false;

  function updateScrollUI() {
    ticking = false;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(1, scrollTop / maxScroll) : 0;

    if (scrollBar) scrollBar.style.transform = `scaleX(${progress.toFixed(4)})`;
    if (header) header.classList.toggle('is-scrolled', scrollTop > 20);
    if (toTop) toTop.classList.toggle('is-visible', scrollTop > 700);

    const probe = window.innerHeight * 0.34;
    let currentId = '';
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= probe && rect.bottom > probe) currentId = section.id;
    });
    if (maxScroll > 0 && scrollTop >= maxScroll - 2) currentId = 'contact';
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${currentId}`);
    });
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateScrollUI);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateScrollUI();

  /* ---------------- relógio e ano ---------------- */
  const clock = document.getElementById('clock');
  const year = document.getElementById('current-year');
  const updateClock = () => {
    if (clock) {
      clock.textContent = new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      }).format(new Date());
    }
    if (year) year.textContent = String(new Date().getFullYear());
  };
  updateClock();
  window.setInterval(updateClock, 30000);

  /* ---------------- cursor personalizado ---------------- */
  const cursor = document.getElementById('cursor');
  const cursorLabel = document.getElementById('cursor-label');

  if (cursor && cursorLabel && finePointer && !reduceMotion) {
    body.classList.add('cursor-enabled');

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let cursorRaf = 0;

    const renderCursor = () => {
      cursorRaf = 0;
      currentX += (targetX - currentX) * 0.56;
      currentY += (targetY - currentY) * 0.56;
      const settled = Math.abs(targetX - currentX) < 0.4 && Math.abs(targetY - currentY) < 0.4;
      if (settled) { currentX = targetX; currentY = targetY; }
      cursor.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
      if (!settled) cursorRaf = requestAnimationFrame(renderCursor);
    };
    const queueCursor = () => { if (!cursorRaf) cursorRaf = requestAnimationFrame(renderCursor); };

    window.addEventListener('pointermove', (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!cursor.classList.contains('is-visible')) {
        currentX = targetX;
        currentY = targetY;
        cursor.classList.add('is-visible');
      }
      queueCursor();
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && cursorRaf) {
        cancelAnimationFrame(cursorRaf);
        cursorRaf = 0;
      } else if (!document.hidden) {
        queueCursor();
      }
    });

    document.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    document.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
    document.addEventListener('pointerenter', () => cursor.classList.add('is-visible'));

    document.addEventListener('pointerover', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const interactive = target.closest('a, button, [role="button"], .p-card, .cap, .learning-item');
      cursor.classList.toggle('is-hover', Boolean(interactive));

      const labelled = target.closest('[data-cursor]');
      if (labelled) {
        cursorLabel.textContent = labelled.dataset.cursor || '';
        cursor.classList.add('has-label');
      } else {
        cursor.classList.remove('has-label');
        cursorLabel.textContent = '';
      }
    });
  }

  /* ---------------- botões magnéticos e spotlight ---------------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.magnetic').forEach((element) => {
      let rect = null;
      let frame = 0;
      let mouseX = 0;
      let mouseY = 0;

      const apply = () => {
        frame = 0;
        if (!rect) return;
        const offsetX = (mouseX - (rect.left + rect.width / 2)) * 0.12;
        const offsetY = (mouseY - (rect.top + rect.height / 2)) * 0.18;
        element.style.transform = `translate(${offsetX.toFixed(2)}px, ${offsetY.toFixed(2)}px)`;
      };

      element.addEventListener('pointerenter', () => {
        rect = element.getBoundingClientRect();
      });
      element.addEventListener('pointermove', (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
        if (!frame) frame = requestAnimationFrame(apply);
      }, { passive: true });
      element.addEventListener('pointerleave', () => {
        if (frame) { cancelAnimationFrame(frame); frame = 0; }
        rect = null;
        element.style.transform = '';
      });
    });

    document.querySelectorAll('.p-card[data-project], .cap').forEach((card) => {
      let rect = null;
      let frame = 0;
      let px = 0;
      let py = 0;

      const apply = () => {
        frame = 0;
        if (!rect) return;
        card.style.setProperty('--px', `${(px - rect.left).toFixed(1)}px`);
        card.style.setProperty('--py', `${(py - rect.top).toFixed(1)}px`);
      };

      card.addEventListener('pointerenter', () => {
        rect = card.getBoundingClientRect();
      });
      card.addEventListener('pointermove', (event) => {
        px = event.clientX;
        py = event.clientY;
        if (!frame) frame = requestAnimationFrame(apply);
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        if (frame) { cancelAnimationFrame(frame); frame = 0; }
        rect = null;
      });
    });
  }

  /* ---------------- efeito de digitação ---------------- */
  const typewriter = document.getElementById('typewriter');
  if (typewriter && !reduceMotion) {
    const phrases = [
      'interfaces que respondem',
      'APIs que sustentam',
      'dados que fazem sentido',
      'hardware que conversa'
    ];
    let phraseIndex = 0;
    let charIndex = phrases[0].length;
    let deleting = true;

    const tick = () => {
      const phrase = phrases[phraseIndex];
      if (!deleting) {
        charIndex += 1;
        typewriter.textContent = phrase.slice(0, charIndex);
        if (charIndex >= phrase.length) {
          deleting = true;
          window.setTimeout(tick, 1800);
          return;
        }
        window.setTimeout(tick, 50);
      } else {
        charIndex -= 1;
        typewriter.textContent = phrase.slice(0, Math.max(0, charIndex));
        if (charIndex <= 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          window.setTimeout(tick, 240);
          return;
        }
        window.setTimeout(tick, 26);
      }
    };
    window.setTimeout(tick, 3600);
  }

  /* ---------------- menu mobile ---------------- */
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  function closeMenu(returnFocus) {
    if (!body.classList.contains('menu-open')) return;
    body.classList.remove('menu-open');
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Abrir menu');
    }
    if (returnFocus && menuToggle) menuToggle.focus();
  }

  function openMenu() {
    if (!menuToggle || !mobileMenu) return;
    body.classList.add('menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Fechar menu');
    const firstLink = mobileMenu.querySelector('a');
    if (firstLink) window.setTimeout(() => firstLink.focus(), 220);
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      if (body.classList.contains('menu-open')) closeMenu(true);
      else openMenu();
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => closeMenu(false));
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1000) closeMenu(false);
    });

    document.addEventListener('keydown', (event) => {
      if (!body.classList.contains('menu-open')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
        return;
      }
      if (event.key !== 'Tab' || !menuToggle) return;
      const focusables = [menuToggle, ...mobileMenu.querySelectorAll('a, button')];
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* ---------------- detalhes dos projetos ---------------- */
  const projects = {
    eventflow: {
      index: '01',
      name: 'EventFlow',
      kicker: 'eventos · pagamentos · recomendações',
      description: 'Plataforma de eventos com venda de ingressos, pagamentos sandbox e recomendações personalizadas. O projeto começou pela fundação do backend e cresceu em quatro serviços independentes.',
      points: [
        'Quatro microsserviços com autenticação JWT e PostgreSQL por domínio.',
        'Outbox e RabbitMQ para eventos assíncronos, notificações e consistência.',
        'Reserva de estoque, idempotência no pagamento e gateway sandbox.',
        'Testes de integração, migrações com Flyway e Testcontainers.'
      ],
      tags: ['Java 21', 'Spring Boot', 'RabbitMQ', 'PostgreSQL', 'Docker'],
      note: 'O backend já cobre o fluxo principal. Frontend, CI/CD e deploy continuam no roadmap.',
      subject: 'EventFlow — backend de eventos',
      shot: 'assets/img/proj-eventflow.jpg',
      metrics: ['4 microsserviços independentes', 'outbox + RabbitMQ', 'idempotência no pagamento'],
      links: []
    },
    maquete: {
      index: '02',
      name: 'Maquete.OS',
      kicker: 'gêmeo digital · websocket · hardware',
      description: 'Sistema de monitoramento e controle para uma maquete industrial com quatro módulos: ferrovia, mineradora, porto logístico e química.',
      points: [
        'Dashboard em tempo real com Socket.IO e seis páginas de operação.',
        'Backend Express, PostgreSQL e Redis para estado, histórico e alertas.',
        'Gateway Bluetooth/Serial conectando o software ao Arduino.',
        'App Android em Kotlin e firmware para ferrovia e caminhão basculante.'
      ],
      tags: ['React', 'Node.js', 'Socket.IO', 'Arduino', 'Kotlin', 'PostgreSQL'],
      note: 'Um projeto que atravessa a tela: do dashboard ao sinal elétrico que move a maquete.',
      subject: 'Maquete.OS — gêmeo digital industrial',
      shot: 'assets/img/proj-maquete.jpg',
      metrics: ['4 módulos de operação', 'dashboard em tempo real', 'gateway Bluetooth/Serial'],
      links: []
    },
    chem: {
      index: '03',
      name: 'Chem Toolkit',
      kicker: 'química · lógica · interface',
      description: 'Ferramenta de química construída em TypeScript puro: tabela periódica interativa, cálculo de massa molar e balanceamento de equações.',
      points: [
        'Núcleo sem framework, com foco em lógica, clareza e performance.',
        'Visualização interativa dos elementos e propriedades periódicas.',
        'Rotinas de cálculo e testes unitários com Vitest.',
        'Interface responsiva construída com Vite.'
      ],
      tags: ['TypeScript', 'Vite', 'Vitest', 'CSS'],
      note: 'Uma ferramenta pequena com uma regra grande: a conta precisa fechar antes da tela ficar bonita.',
      subject: 'Chem Toolkit — ferramenta de química',
      shot: 'assets/img/proj-chem.jpg',
      metrics: ['118 elementos interativos', '11 suítes de teste', 'licença MIT'],
      links: [
        { label: 'Ver código no GitHub', href: 'https://github.com/wenderson-hgs/projeto' },
        { label: 'Ver demo online', href: 'https://wenderson-hgs.github.io/projeto/' }
      ]
    },
    interclasse: {
      index: '04',
      name: 'Interclasse',
      kicker: 'futsal · chaveamento · tempo real',
      description: 'Aplicativo para organizar campeonatos escolares de futsal, do cadastro de times ao placar ao vivo e à página pública da competição.',
      points: [
        'Chaveamentos em todos-contra-todos, eliminatória e grupos + mata-mata.',
        'Agenda sem conflitos de quadra e convites com papéis de organizador e anotador.',
        'Supabase com RLS, sincronização em nuvem e fallback local.',
        'Regras e validações cobertas por testes automatizados.'
      ],
      tags: ['TypeScript', 'Vite', 'Supabase', 'PostgreSQL', 'RLS'],
      note: 'O modo local continua disponível. Com o Supabase configurado, o campeonato sincroniza entre as contas.',
      subject: 'Interclasse — gestão de campeonato',
      shot: 'assets/img/proj-interclasse.jpg',
      metrics: ['3 formatos de chaveamento', 'placar ao vivo', 'RLS + fallback local'],
      links: []
    }
  };

  const modal = document.getElementById('project-modal');
  const modalFile = document.getElementById('modal-file');
  const modalKicker = document.getElementById('modal-kicker');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalPoints = document.getElementById('modal-points');
  const modalTags = document.getElementById('modal-tags');
  const modalNote = document.getElementById('modal-note');
  const modalCta = document.getElementById('modal-cta');
  const modalShot = document.getElementById('modal-shot');
  const modalMetrics = document.getElementById('modal-metrics');
  const modalLinks = document.getElementById('modal-links');
  let lastFocused = null;

  function openProject(projectId, trigger) {
    const project = projects[projectId];
    if (!project || !modal || typeof modal.showModal !== 'function') return;

    lastFocused = trigger || document.activeElement;
    if (modalFile) modalFile.textContent = `// case_${project.index} · ${projectId}`;
    if (modalKicker) modalKicker.textContent = project.kicker;
    if (modalTitle) {
      modalTitle.textContent = '';
      modalTitle.append(document.createTextNode(project.name));
      const dot = document.createElement('span');
      dot.className = 'accent';
      dot.textContent = '.';
      modalTitle.append(dot);
    }
    if (modalDesc) modalDesc.textContent = project.description;
    if (modalPoints) {
      modalPoints.textContent = '';
      project.points.forEach((point) => {
        const item = document.createElement('li');
        item.textContent = point;
        modalPoints.append(item);
      });
    }
    if (modalTags) {
      modalTags.textContent = '';
      project.tags.forEach((tag) => {
        const chip = document.createElement('span');
        chip.className = 'tag';
        chip.textContent = tag;
        modalTags.append(chip);
      });
    }
    if (modalNote) modalNote.textContent = project.note;
    if (modalShot) {
      if (project.shot) {
        modalShot.src = project.shot;
        modalShot.alt = 'Tela do projeto ' + project.name;
        modalShot.hidden = false;
      } else {
        modalShot.hidden = true;
        modalShot.removeAttribute('src');
      }
    }
    if (modalMetrics) {
      modalMetrics.textContent = '';
      const metrics = project.metrics || [];
      metrics.forEach((metric) => {
        const item = document.createElement('li');
        item.textContent = metric;
        modalMetrics.append(item);
      });
      modalMetrics.hidden = metrics.length === 0;
    }
    if (modalLinks) {
      modalLinks.textContent = '';
      const links = project.links || [];
      links.forEach((link) => {
        const anchor = document.createElement('a');
        anchor.href = link.href;
        anchor.target = '_blank';
        anchor.rel = 'noopener';
        anchor.textContent = link.label;
        modalLinks.append(anchor);
      });
      modalLinks.hidden = links.length === 0;
    }
    if (modalCta) {
      modalCta.href = `mailto:wendersonhgs@gmail.com?subject=${encodeURIComponent(project.subject)}`;
    }

    body.classList.add('modal-open');
    modal.showModal();
    const closeButton = modal.querySelector('.modal-close');
    if (closeButton) window.setTimeout(() => closeButton.focus(), 80);
  }

  document.querySelectorAll('[data-project]').forEach((card) => {
    const trigger = () => openProject(card.dataset.project, card);
    card.addEventListener('click', trigger);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        trigger();
      }
    });
  });

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) modal.close();
    });
    modal.addEventListener('close', () => {
      body.classList.remove('modal-open');
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    });
  }

  /* ---------------- copiar e-mail + toast ---------------- */
  const toast = document.getElementById('toast');
  const copyButton = document.querySelector('[data-copy]');
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }

  function fallbackCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }
    area.remove();
    return copied;
  }

  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      const value = copyButton.dataset.copy || '';
      let copied = false;
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(value);
          copied = true;
        } catch (error) {
          copied = false;
        }
      }
      if (!copied) copied = fallbackCopy(value);
      showToast(copied ? 'E-mail copiado para a área de transferência' : 'Não foi possível copiar — o e-mail está logo acima');
      if (copied) {
        const label = document.getElementById('copy-label');
        if (label) {
          const original = label.textContent;
          label.textContent = 'copiado';
          window.setTimeout(() => { label.textContent = original; }, 2200);
        }
      }
    });
  }

  /* ---------------- bfcache ---------------- */
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      finishLoader();
      body.classList.remove('modal-open');
    }
  });
})();
