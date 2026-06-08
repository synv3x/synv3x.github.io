// ==========================================
// ACCESS GATE (entry screen + scroll lock)
// ==========================================

const pause = ms => new Promise(r => setTimeout(r, ms));

const gate       = document.getElementById('gate');
const gateBar    = document.getElementById('gate-bar');
const gateStatus = document.getElementById('gate-status');
const gateEnter  = document.getElementById('gate-enter');

let entered = false;

// Lock scrolling until the visitor steps through the gate
document.documentElement.classList.add('locked');
document.body.classList.add('locked');

async function runGate() {
    const steps = ['Initializing secure link', 'Verifying credentials', 'Clearance confirmed'];
    for (let i = 0; i < steps.length; i++) {
        if (gateStatus) gateStatus.textContent = steps[i];
        if (gateBar) gateBar.style.width = `${((i + 1) / steps.length) * 100}%`;
        await pause(430);
    }
    if (gateStatus) {
        gateStatus.textContent = 'Access granted';
        gateStatus.classList.add('granted');
    }
    if (gateEnter) {
        gateEnter.disabled = false;
        gateEnter.classList.add('ready');
    }
}

function enterSite() {
    if (entered || !gateEnter || gateEnter.disabled) return;
    entered = true;
    gate.classList.add('gate-out');
    document.documentElement.classList.remove('locked');
    document.body.classList.remove('locked');
    window.scrollTo(0, 0);
    setTimeout(() => { if (gate) gate.remove(); }, 800);
}

if (gateEnter) gateEnter.addEventListener('click', enterSite);
document.addEventListener('keydown', (e) => {
    if (!entered && gateEnter && !gateEnter.disabled && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        enterSite();
    }
});

runGate();

// ==========================================
// DEVICE / PERFORMANCE DETECTION
// ==========================================

const IS_SMALL  = window.innerWidth < 768;
const IS_COARSE = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const REDUCED   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ==========================================
// MATRIX RAIN BACKGROUND
// ==========================================

const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()-=+[]{}|;:<>?/\\アイウエオカキクケコ01';
let drops = [];

function initDrops() {
    const cols = Math.floor(canvas.width / 18) + 1;
    drops = Array.from({ length: cols }, () => Math.floor(Math.random() * -50));
}
initDrops();
window.addEventListener('resize', initDrops);

let lastMatrixTime = 0;
const MATRIX_INTERVAL = 1000 / (IS_SMALL ? 13 : 18);

function drawMatrix(timestamp) {
    if (timestamp - lastMatrixTime >= MATRIX_INTERVAL) {
        ctx.filter = 'none';
        ctx.fillStyle = 'rgba(10, 6, 18, 0.055)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.filter = `hue-rotate(${Math.sin(timestamp * 0.00007) * 24}deg)`;

        for (let i = 0; i < drops.length; i++) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            const brightness = Math.random();
            if (brightness > 0.95) {
                ctx.fillStyle = '#c084fc';
                ctx.shadowColor = '#a855f7';
                ctx.shadowBlur = 14;
            } else if (brightness > 0.88) {
                ctx.fillStyle = `rgba(168, 85, 247, ${0.72 + brightness * 0.26})`;
                ctx.shadowColor = '#a855f7';
                ctx.shadowBlur = 6;
            } else if (brightness > 0.65) {
                ctx.fillStyle = `rgba(168, 85, 247, ${0.44 + brightness * 0.34})`;
                ctx.shadowBlur = 0;
            } else {
                ctx.fillStyle = `rgba(124, 58, 173, ${0.22 + brightness * 0.26})`;
                ctx.shadowBlur = 0;
            }
            ctx.font = '13px "JetBrains Mono", Courier New';
            ctx.fillText(char, i * 18, drops[i] * 18);

            if (drops[i] * 18 > canvas.height && Math.random() > 0.966) drops[i] = 0;
            drops[i]++;
        }
        ctx.shadowBlur = 0;
        ctx.filter = 'none';
        lastMatrixTime = timestamp;
    }
    requestAnimationFrame(drawMatrix);
}
if (!REDUCED) requestAnimationFrame(drawMatrix);

// ==========================================
// INTERACTIVE PARTICLE NETWORK
// ==========================================

const netCanvas = document.getElementById('networkCanvas');
const netCtx = netCanvas.getContext('2d');

function resizeNetCanvas() {
    netCanvas.width  = window.innerWidth;
    netCanvas.height = window.innerHeight;
}
resizeNetCanvas();
window.addEventListener('resize', () => {
    resizeNetCanvas();
    netParticles.length = 0;
    initNetParticles();
});

let netMouseX = window.innerWidth / 2;
let netMouseY = window.innerHeight / 2;
let mouseOnPage = false;

document.addEventListener('mousemove', (e) => {
    netMouseX = e.clientX;
    netMouseY = e.clientY;
    mouseOnPage = true;
});
document.addEventListener('mouseleave', () => { mouseOnPage = false; });

// Touch — let fingers drag the network/cursor field on phones & tablets
function trackTouch(e) {
    if (!e.touches || !e.touches.length) return;
    netMouseX = e.touches[0].clientX;
    netMouseY = e.touches[0].clientY;
    mouseOnPage = true;
}
document.addEventListener('touchstart', trackTouch, { passive: true });
document.addEventListener('touchmove',  trackTouch, { passive: true });
document.addEventListener('touchend',   () => { mouseOnPage = false; }, { passive: true });

class NetParticle {
    constructor() { this.init(); }
    init() {
        this.x = Math.random() * netCanvas.width;
        this.y = Math.random() * netCanvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.r = Math.random() * 1.7 + 0.5;
        this.opacity = Math.random() * 0.55 + 0.24;
        this.phase = Math.random() * Math.PI * 2;
        // tri-tone palette: mostly violet, some cyan, a few magenta
        const roll = Math.random();
        this.c = roll < 0.62 ? '168, 85, 247' : roll < 0.88 ? '56, 189, 248' : '232, 121, 249';
    }
    update(t) {
        this.vx += Math.sin(t * 0.0008 + this.phase) * 0.007;
        this.vy += Math.cos(t * 0.0008 + this.phase) * 0.007;

        const dx = this.x - netMouseX;
        const dy = this.y - netMouseY;
        const dSq = dx * dx + dy * dy;
        if (dSq < 16900) {
            const d = Math.sqrt(dSq);
            const f = (130 - d) / 130 * 1.6;
            this.vx += (dx / d) * f;
            this.vy += (dy / d) * f;
        }

        this.vx *= 0.952;
        this.vy *= 0.952;
        const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (spd > 4) { this.vx = this.vx / spd * 4; this.vy = this.vy / spd * 4; }

        this.x += this.vx;
        this.y += this.vy;

        const m = 18;
        if (this.x < -m) this.x = netCanvas.width + m;
        if (this.x > netCanvas.width + m) this.x = -m;
        if (this.y < -m) this.y = netCanvas.height + m;
        if (this.y > netCanvas.height + m) this.y = -m;
    }
}

const NET_COUNT    = IS_SMALL ? 40 : 95;
const LINK_DIST    = 148;
const LINK_DIST_SQ = LINK_DIST * LINK_DIST;
const CURSOR_LINK  = 210;
const CURSOR_LINK_SQ = CURSOR_LINK * CURSOR_LINK;

const netParticles = [];
function initNetParticles() {
    for (let i = 0; i < NET_COUNT; i++) netParticles.push(new NetParticle());
}
initNetParticles();

function drawNetworkFrame(t) {
    netCtx.clearRect(0, 0, netCanvas.width, netCanvas.height);
    for (const p of netParticles) p.update(t);

    netCtx.lineWidth = 0.55;

    for (let i = 0; i < netParticles.length; i++) {
        const a = netParticles[i];

        if (mouseOnPage) {
            const cdx = a.x - netMouseX;
            const cdy = a.y - netMouseY;
            const cdSq = cdx * cdx + cdy * cdy;
            if (cdSq < CURSOR_LINK_SQ) {
                const cd = Math.sqrt(cdSq);
                const alpha = (1 - cd / CURSOR_LINK) * 0.72;
                netCtx.beginPath();
                netCtx.moveTo(a.x, a.y);
                netCtx.lineTo(netMouseX, netMouseY);
                netCtx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
                netCtx.stroke();
            }
        }

        for (let j = i + 1; j < netParticles.length; j++) {
            const b = netParticles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dSq = dx * dx + dy * dy;
            if (dSq < LINK_DIST_SQ) {
                const alpha = (1 - dSq / LINK_DIST_SQ) * 0.42;
                netCtx.beginPath();
                netCtx.moveTo(a.x, a.y);
                netCtx.lineTo(b.x, b.y);
                netCtx.strokeStyle = `rgba(${a.c}, ${alpha})`;
                netCtx.stroke();
            }
        }

        netCtx.beginPath();
        netCtx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        netCtx.fillStyle = `rgba(${a.c}, ${a.opacity})`;
        netCtx.shadowColor = `rgba(${a.c}, 0.8)`;
        netCtx.shadowBlur = 6;
        netCtx.fill();
        netCtx.shadowBlur = 0;
    }

    if (mouseOnPage) {
        const pulseR = 4 + Math.sin(t * 0.004) * 1.5;
        netCtx.beginPath();
        netCtx.arc(netMouseX, netMouseY, pulseR, 0, Math.PI * 2);
        netCtx.strokeStyle = `rgba(168,85,247,${0.32 + Math.sin(t * 0.004) * 0.1})`;
        netCtx.lineWidth = 1;
        netCtx.stroke();
        netCtx.beginPath();
        netCtx.arc(netMouseX, netMouseY, 1.8, 0, Math.PI * 2);
        netCtx.fillStyle = 'rgba(168,85,247,0.65)';
        netCtx.fill();
    }

    requestAnimationFrame(drawNetworkFrame);
}
if (!REDUCED) requestAnimationFrame(drawNetworkFrame);

// ==========================================
// CUSTOM CURSOR
// ==========================================

const cursorRing = document.getElementById('cursor-ring');
const cursorDot  = document.getElementById('cursor-dot');

let cRingX = netMouseX, cRingY = netMouseY;
const RING_EASE = 0.13;

function animateCursor() {
    cRingX += (netMouseX - cRingX) * RING_EASE;
    cRingY += (netMouseY - cRingY) * RING_EASE;
    if (cursorRing) {
        cursorRing.style.left = cRingX + 'px';
        cursorRing.style.top  = cRingY + 'px';
    }
    if (cursorDot) {
        cursorDot.style.left = netMouseX + 'px';
        cursorDot.style.top  = netMouseY + 'px';
    }
    requestAnimationFrame(animateCursor);
}
animateCursor();

document.querySelectorAll('a, button, .skill-card, .project-card, .learning-card, .stat-card, .nav-link, .contact-link, .hero-card').forEach(el => {
    el.addEventListener('mouseenter', () => cursorRing && cursorRing.classList.add('expanded'));
    el.addEventListener('mouseleave', () => cursorRing && cursorRing.classList.remove('expanded'));
});

// Click ripple
document.addEventListener('click', (e) => {
    [0, 1].forEach(i => {
        const r = document.createElement('div');
        r.className = 'click-ripple' + (i ? ' click-ripple-2' : '');
        r.style.left = e.clientX + 'px';
        r.style.top  = e.clientY + 'px';
        document.body.appendChild(r);
        setTimeout(() => r.remove(), 780);
    });
});

// ==========================================
// SCROLL PROGRESS BAR
// ==========================================

const scrollProgress = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
    const scrollTop  = window.scrollY;
    const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
    const progress   = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (scrollProgress) scrollProgress.style.width = progress + '%';
});

// ==========================================
// INFINITE HACKING TERMINAL
// ==========================================

const HACKER_CMDS = [
    { cmd: 'nmap -sV --open -p 22,80,443,8080 192.168.1.1',         out: '[+] 22/ssh  80/http  443/https  8080/proxy',   type: 'good' },
    { cmd: 'hydra -l root -P rockyou.txt ssh://192.168.1.1',         out: '[+] password: r00t_2024  session active',      type: 'good' },
    { cmd: 'python3 exploit.py --target 192.168.1.1 --lport 4444',   out: '[!] meterpreter session 1 opened · TTY ✓',    type: 'warn' },
    { cmd: 'hashcat -m 1800 shadow.hash rockyou.txt --status',       out: '[*] 2.1 MH/s · ETA: 00:04:22 · 50% done',    type: ''     },
    { cmd: 'sqlmap -u "http://192.168.1.1/login" --batch --dbs',     out: '[+] injectable: id  dbs: admin, users, logs', type: 'good' },
    { cmd: 'airmon-ng start wlan0 && airodump-ng wlan0mon',          out: '[*] wlan0mon enabled · scanning APs...',       type: ''     },
    { cmd: 'msfconsole -x "use multi/handler; set LPORT 4444; run"', out: '[*] reverse handler 0.0.0.0:4444 active',     type: ''     },
    { cmd: 'gobuster dir -u http://192.168.1.1 -w common.txt',       out: '[+] /admin (200) /config (403) /api (200)',   type: 'good' },
    { cmd: 'volatility -f mem.dmp --profile=Win10x64 pslist',        out: '[*] 87 processes found · 3 anomalies flagged',type: ''     },
    { cmd: 'crackmapexec smb 192.168.1.0/24 -u admin -p pass123',    out: '[+] 192.168.1.50 PWNED · domain admin ✓',     type: 'good' },
    { cmd: 'nikto -h http://192.168.1.1 -Tuning 123',                out: '[!] XSS · CVE-2021-41773 · weak TLS',         type: 'warn' },
    { cmd: 'responder -I eth0 -rdwF',                                 out: '[*] NTLMv2 capture active · ARP poisoned',   type: ''     },
    { cmd: 'tcpdump -i eth0 "tcp port 443" -w cap.pcap',             out: '[*] 2,841 packets captured · 0 dropped',     type: ''     },
    { cmd: 'john --wordlist=rockyou.txt --format=NT hashes.txt',     out: '[+] 9 of 12 hashes cracked in 7.3s',          type: 'good' },
    { cmd: 'wpscan --url http://192.168.1.1 --enumerate vp,u',       out: '[!] 2 vulnerable plugins · admin exposed',    type: 'warn' },
];

window.addEventListener('load', () => {
    const termBody = document.getElementById('terminal-body');
    if (!termBody) return;

    let lineCount = 0;

    function makePromptLine() {
        const p = document.createElement('p');
        p.className = 'terminal-line';
        const pr = document.createElement('span');
        pr.className = 'terminal-prompt';
        pr.textContent = '$';
        const tx = document.createElement('span');
        tx.className = 'terminal-text';
        p.append(pr, document.createTextNode(' '), tx);
        termBody.appendChild(p);
        lineCount++;
        termBody.scrollTop = termBody.scrollHeight;
        return tx;
    }

    function makeOutputLine(type) {
        const p = document.createElement('p');
        p.className = 'terminal-line terminal-subtle';
        const s = document.createElement('span');
        if (type === 'good') s.className = 'term-out-good';
        else if (type === 'warn') s.className = 'term-out-warn';
        p.appendChild(s);
        termBody.appendChild(p);
        lineCount++;
        termBody.scrollTop = termBody.scrollHeight;
        return s;
    }

    function makeDivider(text) {
        const p = document.createElement('p');
        p.className = 'terminal-line terminal-subtle';
        p.style.cssText = 'color:rgba(168,85,247,0.28);font-size:11px;';
        p.textContent = text;
        termBody.appendChild(p);
        lineCount++;
        termBody.scrollTop = termBody.scrollHeight;
    }

    function typeEl(el, text, speed) {
        return new Promise(resolve => {
            let i = 0;
            const iv = setInterval(() => {
                el.textContent = text.slice(0, ++i);
                termBody.scrollTop = termBody.scrollHeight;
                if (i >= text.length) { clearInterval(iv); resolve(); }
            }, speed);
        });
    }

    async function clearTerminal() {
        termBody.style.transition = 'opacity 0.32s ease';
        termBody.style.opacity = '0';
        await pause(370);
        termBody.innerHTML = '';
        lineCount = 0;
        termBody.style.opacity = '1';
    }

    let cmdIdx = 0;

    async function termLoop() {
        makeDivider('── synv3x@hacker ~ ─────────────────────────');
        await pause(500);

        const w = makePromptLine();
        await typeEl(w, 'whoami', 90);
        await pause(320);
        const wo = makeOutputLine('good');
        await typeEl(wo, 'synv3x@hacker:~#', 36);
        await pause(520);

        while (true) {
            if (lineCount > 22) {
                await pause(900);
                await clearTerminal();
                makeDivider('── new session ──────────────────────────────');
                await pause(460);
            }

            const c = HACKER_CMDS[cmdIdx % HACKER_CMDS.length];
            cmdIdx++;

            const cmdEl = makePromptLine();
            const spd = Math.max(26, Math.min(54, Math.floor(2000 / c.cmd.length)));
            await typeEl(cmdEl, c.cmd, spd);
            await pause(190 + Math.random() * 280);

            const outEl = makeOutputLine(c.type);
            await typeEl(outEl, c.out, 12);
            await pause(380 + Math.random() * 340);
        }
    }

    termLoop();
});

// ==========================================
// SCROLL REVEAL ANIMATIONS
// ==========================================

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

const REVEAL_SELECTOR = '.reveal, .reveal-left, .reveal-right, .reveal-scale';
document.querySelectorAll(REVEAL_SELECTOR).forEach(el => revealObserver.observe(el));

// Cascade children in so each group "loads one by one"
document.querySelectorAll('.skills-grid, .projects-grid, .toolbox-grid, .timeline, .about-stats, .about-text, .contact-links').forEach((grid) => {
    grid.querySelectorAll(REVEAL_SELECTOR).forEach((child, i) => {
        child.style.setProperty('--reveal-delay', `${i * 0.1}s`);
    });
});

// ==========================================
// CARD MOUSE GLOW (radial spotlight)
// ==========================================

document.querySelectorAll('.skill-card, .project-card, .learning-card, .stat-card').forEach((el) => {
    const moveGlow = (clientX, clientY) => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mouse-x', `${clientX - rect.left}px`);
        el.style.setProperty('--mouse-y', `${clientY - rect.top}px`);
    };
    el.addEventListener('mousemove', (e) => moveGlow(e.clientX, e.clientY));
    el.addEventListener('touchstart', (e) => {
        if (e.touches.length) moveGlow(e.touches[0].clientX, e.touches[0].clientY);
        el.classList.add('touch-active');
    }, { passive: true });
    el.addEventListener('touchend', () => {
        setTimeout(() => el.classList.remove('touch-active'), 220);
    }, { passive: true });
});

// ==========================================
// 3D TILT ON HERO CARD
// ==========================================

const heroCard = document.querySelector('.hero-card');
if (heroCard) {
    let tiltRAF = null;

    heroCard.addEventListener('mousemove', function (e) {
        cancelAnimationFrame(tiltRAF);
        tiltRAF = requestAnimationFrame(() => {
            const rect = this.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top  + rect.height / 2;
            const dx = (e.clientX - cx) / (rect.width / 2);
            const dy = (e.clientY - cy) / (rect.height / 2);
            const rotX = dy * -10;
            const rotY = dx *  10;
            this.style.transition = 'transform 0.07s ease, box-shadow 0.4s ease, border-color 0.4s ease';
            this.style.transform  = `perspective(720px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(10px)`;
            this.style.boxShadow  = `${rotY * -1.5}px ${rotX * 1.5}px 60px rgba(168,85,247,0.18), 0 0 40px rgba(168,85,247,0.1)`;
        });
    });

    heroCard.addEventListener('mouseleave', function () {
        cancelAnimationFrame(tiltRAF);
        this.style.transition = 'transform 0.75s cubic-bezier(0.23,1,0.32,1), box-shadow 0.5s ease, border-color 0.4s ease';
        this.style.transform  = 'perspective(720px) rotateX(0deg) rotateY(0deg) translateZ(0)';
        this.style.boxShadow  = '';
    });
}

// ==========================================
// MAGNETIC BUTTONS
// ==========================================

document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', function (e) {
        const rect = this.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = (e.clientX - cx) * 0.22;
        const dy = (e.clientY - cy) * 0.22;
        this.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener('mouseleave', function () {
        this.style.transform = '';
    });
});

// ==========================================
// SMOOTH SCROLLING
// ==========================================

function scrollToSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        scrollToSection(this.getAttribute('href').substring(1));
    });
});

// ==========================================
// NAV ACTIVE STATE ON SCROLL
// ==========================================

const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach((section) => {
        if (pageYOffset >= section.offsetTop - 220) {
            current = section.getAttribute('id');
        }
    });
    navLinks.forEach((link) => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === current) {
            link.classList.add('active');
        }
    });
});

// ==========================================
// COUNTER ANIMATION
// ==========================================

function animateCounter(element, target, duration = 1400) {
    let current = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current) + (element.dataset.suffix || '');
    }, 16);
}

const statNumbers = document.querySelectorAll('.stat-number');
let countersAnimated = false;

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting && !countersAnimated) {
            countersAnimated = true;
            statNumbers.forEach((stat) => {
                const target = parseInt(stat.textContent.replace(/\D/g, '')) || 0;
                if (target > 0) animateCounter(stat, target);
            });
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.about-stats');
if (statsSection) counterObserver.observe(statsSection);

// ==========================================
// KEYBOARD NAVIGATION
// ==========================================

document.addEventListener('keydown', (e) => {
    if (!entered) return;
    if (e.key === 'ArrowDown') window.scrollBy(0, 100);
    else if (e.key === 'ArrowUp') window.scrollBy(0, -100);
    const sectionIds = ['about', 'skills', 'toolbox', 'projects', 'roadmap', 'contact'];
    if (e.key >= '1' && e.key <= '6') scrollToSection(sectionIds[parseInt(e.key) - 1]);
});

// ==========================================
// EASTER EGG: KONAMI CODE
// ==========================================

const konamiCode = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
    if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            activateEasterEgg();
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
});

function activateEasterEgg() {
    let step = 0;
    const interval = setInterval(() => {
        document.body.style.filter = `hue-rotate(${step * 60}deg)`;
        step++;
        if (step > 6) { clearInterval(interval); document.body.style.filter = 'none'; }
    }, 120);
    console.log('%c🔓 Easter Egg Activated!', 'color: #a855f7; font-size: 20px;');
}

// ==========================================
// RANDOM GLITCH BURST
// ==========================================

const glitchTitle = document.querySelector('.hero-title.glitch');

function scheduleGlitch() {
    const delay = 4000 + Math.floor(Math.random() * 8000);
    setTimeout(() => {
        if (!glitchTitle) return;
        glitchTitle.classList.add('glitch-burst');
        setTimeout(() => glitchTitle.classList.remove('glitch-burst'), 280);
        scheduleGlitch();
    }, delay);
}
scheduleGlitch();

// ==========================================
// PROFILE POPUP
// ==========================================

const popupOverlay = document.getElementById('profile-popup');
const popupBody    = document.getElementById('popup-body');
let popupReady = false;

const profileScript = [
    { text: '$ ./whoami.sh',                                      cls: 'popup-cmd',     spd: 55 },
    { text: '',                                                    cls: '',              spd: 0  },
    { text: '  ┌─ IDENTITY ───────────────────────────────────┐', cls: 'popup-section', spd: 7  },
    { text: '',                                                    cls: '',              spd: 0  },
    { text: '  handle    ──  synv3x',                             cls: 'popup-row',     spd: 11 },
    { text: '  role      ──  Cybersecurity Learner',              cls: 'popup-row',     spd: 11 },
    { text: '  location  ──  Toronto, Ontario, CA',               cls: 'popup-row',     spd: 11 },
    { text: '  school    ──  College Student',                    cls: 'popup-row',     spd: 11 },
    { text: '  focus     ──  Linux · Networking · Blue/Red team', cls: 'popup-row',     spd: 11 },
    { text: '  stack     ──  Python · C/C++ · Bash · Nmap · SIEM', cls: 'popup-row',    spd: 11 },
    { text: '',                                                    cls: '',              spd: 0  },
    { text: '  ├─ CHANNELS ──────────────────────────────────┤', cls: 'popup-section',  spd: 7  },
    { text: '',                                                    cls: '',              spd: 0  },
    { text: '  github    ──  github.com/synv3x',                  cls: 'popup-link',    spd: 11, href: 'https://github.com/synv3x' },
    { text: '  discord   ──  @synv3x',                           cls: 'popup-row',     spd: 11 },
    { text: '',                                                    cls: '',              spd: 0  },
    { text: '  status    ──  [ AVAILABLE FOR OPPORTUNITIES ]',    cls: 'popup-row popup-status-row', spd: 11 },
    { text: '',                                                    cls: '',              spd: 0  },
    { text: '  └─ SCAN COMPLETE ─────────────────────────────┘', cls: 'popup-section', spd: 7  },
];

function typePopupLine(index) {
    if (index >= profileScript.length) return;
    const line = profileScript[index];
    const p = document.createElement('p');
    if (line.cls) p.className = line.cls;
    popupBody.appendChild(p);
    popupBody.scrollTop = popupBody.scrollHeight;

    if (!line.text) {
        setTimeout(() => typePopupLine(index + 1), 70);
        return;
    }

    let i = 0;
    const iv = setInterval(() => {
        p.textContent = line.text.slice(0, ++i);
        if (i >= line.text.length) {
            clearInterval(iv);
            if (line.href) {
                p.addEventListener('click', () => window.open(line.href, '_blank'));
            }
            const gap = line.cls === 'popup-cmd' ? 280 : 55;
            setTimeout(() => typePopupLine(index + 1), gap);
        }
    }, line.spd || 12);
}

function openPopup() {
    if (!popupOverlay) return;
    popupOverlay.classList.add('active');
    if (!popupReady) {
        popupReady = true;
        const avatarWrap = document.createElement('div');
        avatarWrap.className = 'popup-avatar-wrap';
        avatarWrap.innerHTML = '<div class="popup-avatar-ring"><img src="profile.png" class="popup-avatar-img" alt="synv3x"></div><span class="popup-avatar-scan">scanning subject…</span>';
        popupBody.appendChild(avatarWrap);
        setTimeout(() => typePopupLine(0), 450);
    }
}

function closePopup() {
    if (popupOverlay) popupOverlay.classList.remove('active');
}

if (popupOverlay) {
    popupOverlay.addEventListener('click', (e) => {
        if (e.target === popupOverlay) closePopup();
    });
}

document.addEventListener('keydown', (e) => {
    if (!entered) return;
    if ((e.key === 'i' || e.key === 'I') && !e.target.matches('input,textarea,select')) {
        if (whoamiBuffer === 'whoam') return; // let whoami ghost complete it
        popupOverlay.classList.contains('active') ? closePopup() : openPopup();
    }
    if (e.key === 'Escape') closePopup();
});

// ==========================================
// WHOAMI KEYBOARD GHOST
// ==========================================

const whoamiGhost = document.createElement('div');
whoamiGhost.id = 'whoami-ghost';
document.body.appendChild(whoamiGhost);

let whoamiBuffer = '';
let whoamiResetTimer = null;

document.addEventListener('keydown', (e) => {
    if (!entered) return;
    if (e.target.matches('input, textarea, select')) return;
    if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) return;

    whoamiBuffer += e.key.toLowerCase();
    if (whoamiBuffer.length > 6) whoamiBuffer = whoamiBuffer.slice(-6);

    whoamiGhost.textContent = '$ ' + whoamiBuffer + '▌';
    whoamiGhost.classList.add('visible');

    clearTimeout(whoamiResetTimer);
    whoamiResetTimer = setTimeout(() => {
        whoamiBuffer = '';
        whoamiGhost.classList.remove('visible');
    }, 1400);

    if (whoamiBuffer === 'whoami') {
        whoamiBuffer = '';
        clearTimeout(whoamiResetTimer);
        setTimeout(() => whoamiGhost.classList.remove('visible'), 300);
        openPopup();
    }
});

// ==========================================
// LOAD COMPLETE
// ==========================================

window.addEventListener('load', () => {
    console.log('%cSynv3x Portfolio Loaded', 'color: #a855f7; font-size: 14px; font-weight: bold;');
});
