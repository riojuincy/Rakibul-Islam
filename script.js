(function () {
  "use strict";

  var COPY = {
    sent: "Sent. The note is on its way to Rakibul Islam.",
    need: "Please add your name and a short note.",
    fail: "The note could not be sent from here. Your email app will open instead.",
    activate: "Check riojuincy@gmail.com, including Spam, and open the FormSubmit confirmation link. After that, notes will arrive."
  };

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  var themeBtn = document.getElementById("theme");
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function isPhoneDevice() {
    try {
      return window.matchMedia("(max-width: 768px)").matches ||
        /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    } catch (e) {
      return false;
    }
  }

  function getThemeKey() {
    return isPhoneDevice() ? "theme_mobile" : "theme_desktop";
  }

  function applyDefaultThemeIfUnset() {
    try {
      var key = getThemeKey();
      var saved = localStorage.getItem(key);
      if (saved === "night") {
        document.documentElement.setAttribute("data-theme", "night");
      } else if (saved === "day") {
        document.documentElement.removeAttribute("data-theme");
      } else {
        if (isPhoneDevice()) {
          document.documentElement.setAttribute("data-theme", "night");
        } else {
          document.documentElement.removeAttribute("data-theme");
        }
      }
    } catch (e) {}
  }

  function syncTheme() {
    var night = document.documentElement.getAttribute("data-theme") === "night";
    if (themeBtn) {
      themeBtn.setAttribute("aria-pressed", night ? "true" : "false");
      themeBtn.setAttribute("aria-label", night ? "Day" : "Night");
    }
    if (themeMeta) themeMeta.setAttribute("content", night ? "#0b0e18" : "#ffffff");
  }

  applyDefaultThemeIfUnset();
  syncTheme();

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var night = document.documentElement.getAttribute("data-theme") !== "night";
      if (night) {
        document.documentElement.setAttribute("data-theme", "night");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      try {
        localStorage.setItem(getThemeKey(), night ? "night" : "day");
      } catch (e) {}
      syncTheme();
    });
  }

  try {
    var mql = window.matchMedia("(max-width: 768px)");
    var onViewportChange = function (e) {
      var key = e.matches ? "theme_mobile" : "theme_desktop";
      var saved = null;
      try { saved = localStorage.getItem(key); } catch (err) {}
      if (saved === "night") {
        document.documentElement.setAttribute("data-theme", "night");
      } else if (saved === "day") {
        document.documentElement.removeAttribute("data-theme");
      } else {
        if (e.matches) {
          document.documentElement.setAttribute("data-theme", "night");
        } else {
          document.documentElement.removeAttribute("data-theme");
        }
      }
      syncTheme();
    };
    if (mql.addEventListener) {
      mql.addEventListener("change", onViewportChange);
    } else if (mql.addListener) {
      mql.addListener(onViewportChange);
    }
  } catch (e) {}

  var menu = document.getElementById("menu");
  var toggle = document.querySelector(".nav-toggle");
  function closeMenu() {
    if (!menu || !toggle) return;
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });
  }

  var toast = document.getElementById("toast");
  var toastTimer = 0;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove("show"); }, 3200);
  }

  function openMail(name, email, message) {
    var body = "Name: " + name + (email ? "\nEmail: " + email : "") + "\n\n" + message;
    window.location.href = "mailto:riojuincy@gmail.com?subject=" + encodeURIComponent("A note for Rakibul Islam") + "&body=" + encodeURIComponent(body);
  }

  var again = document.getElementById("sent-again");
  if (again) {
    again.addEventListener("click", function () {
      var sent = document.getElementById("sent-note");
      var noteForm = document.getElementById("contact-form");
      if (sent) sent.hidden = true;
      if (noteForm) {
        noteForm.hidden = false;
        var nameField = noteForm.querySelector("[name=name]");
        if (nameField) nameField.focus();
      }
    });
  }

  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(form);
      var name = String(data.get("name") || "").trim();
      var email = String(data.get("email") || "").trim();
      var message = String(data.get("message") || "").trim();
      var honey = String(data.get("_honey") || "").trim();
      var button = form.querySelector("button[type=submit]") || form.querySelector("button");
      if (honey) return;
      if (!name || !message) {
        showToast(COPY.need);
        return;
      }
      if (button) button.disabled = true;
      var payload = {
        name: name,
        message: message,
        _subject: "A note for Rakibul Islam",
        _template: "box",
        _captcha: "false",
        _honey: ""
      };
      if (email) {
        payload.email = email;
        payload._replyto = email;
      }
      fetch("https://formsubmit.co/ajax/riojuincy@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      }).then(function (res) {
        return res.text().then(function (text) {
          var data = {};
          try { data = JSON.parse(text); } catch (err) { data = {}; }
          return { ok: res.ok, data: data };
        });
      }).then(function (result) {
        var data = result.data || {};
        var note = String(data.message || "");
        var ok = String(data.success) === "true";
        if (/activat/i.test(note)) {
          showToast(COPY.activate);
          return;
        }
        if (!result.ok || !ok) throw new Error(note || "send");
        showToast(COPY.sent);
        form.reset();
        var sent = document.getElementById("sent-note");
        if (sent) {
          form.hidden = true;
          sent.hidden = false;
        }
      }).catch(function () {
        showToast(COPY.fail);
        openMail(name, email, message);
      }).then(function () {
        if (button) button.disabled = false;
      });
    });
  }

  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        seen.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { seen.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  var clock = document.getElementById("clock");
  function tickClock() {
    if (!clock) return;
    var d = new Date();
    var h = d.getHours();
    var ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    var m = d.getMinutes();
    var s = d.getSeconds();
    clock.textContent = h + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s + " " + ap;
  }
  tickClock();
  window.setInterval(tickClock, 1000);

  var WALLETS = {
    btc: "1PGERNK8LhASLTWBkzwKDMZGMP2ZmybFUf",
    eth: "0x3f70bcf0ed166222545cc324727ac8495ef00655",
    usdt: "TBTi9BeBNoD17FTXeL2ba2sKdXpdLNucPb"
  };

  function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return execFallbackCopy(text);
      });
    }
    return execFallbackCopy(text);
  }

  function execFallbackCopy(text) {
    return new Promise(function (resolve, reject) {
      try {
        var textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        textArea.setSelectionRange(0, 99999);
        var successful = false;
        try {
          successful = document.execCommand("copy");
        } catch (err) {
          successful = false;
        }
        document.body.removeChild(textArea);
        if (successful) {
          resolve();
        } else {
          reject(new Error("Copy failed"));
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  document.querySelectorAll(".wallet").forEach(function (card) {
    var coin = card.getAttribute("data-coin");
    var code = card.querySelector(".addr");
    var addr = String(WALLETS[coin] || (code ? code.textContent : "") || "").trim();
    if (addr && !WALLETS[coin]) {
      WALLETS[coin] = addr;
    }
    var btn = card.querySelector(".copy");
    if (!addr) {
      if (btn) btn.disabled = true;
      return;
    }
    if (code) code.textContent = addr;
    if (btn) {
      btn.disabled = false;
      btn.setAttribute("title", "Copy address");
      btn.setAttribute("aria-label", "Copy " + (coin === "btc" ? "Bitcoin" : coin === "eth" ? "Ethereum" : "Tether") + " address");
    }
  });

  var coinNames = {
    btc: "Bitcoin",
    eth: "Ethereum",
    usdt: "Tether"
  };

  document.querySelectorAll(".copy").forEach(function (btn) {
    var resetTimer = 0;
    btn.addEventListener("click", function () {
      var coin = btn.getAttribute("data-coin");
      var addr = String(WALLETS[coin] || "").trim();
      if (!addr) {
        var card = btn.closest(".wallet");
        var code = card ? card.querySelector(".addr") : null;
        if (code && code.textContent.trim()) {
          addr = code.textContent.trim();
          WALLETS[coin] = addr;
        }
      }
      if (!addr) {
        showToast("This wallet address is not added yet.");
        return;
      }
      var label = coinNames[coin] || "Wallet";
      copyTextToClipboard(addr).then(function () {
        showToast(label + " address copied.");
        btn.textContent = "Copied!";
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(function () {
          btn.textContent = "Copy";
        }, 2200);
      }).catch(function () {
        showToast(addr);
      });
    });
  });

  var audio = document.getElementById("song");
  var playBtn = document.getElementById("play");
  var nextBtn = document.getElementById("next-song");
  var trackNameEl = document.getElementById("track-name");
  var enterOverlay = document.getElementById("enter-overlay");
  var enterBtn = document.getElementById("enter-btn");
  var volume = document.getElementById("volume");
  var seek = document.getElementById("seek");
  var ptime = document.getElementById("ptime");
  var seeking = false;
  var orbit = document.getElementById("orbit");
  var viz = document.getElementById("viz");
  var audioCtx = null;
  var audioSourceNode = null;
  var gain = null;
  var analyser = null;
  var freq = null;
  var bars = [];
  var playMark = '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>';
  var pauseMark = '<path d="M7 5h3.2v14H7zM13.8 5H17v14h-3.2z" fill="currentColor"/>';
  var hasEntered = !enterOverlay;

  var PLAYLIST = [
    { title: "Song 1", src: "songs/song1.mp3" },
    { title: "Song 2", src: "songs/song2.mp3" },
    { title: "Song 3", src: "songs/song3.mp3" },
    { title: "Song 4", src: "songs/song4.mp3" },
    { title: "Song 5", src: "songs/song5.mp3" },
    { title: "Song 6", src: "songs/song6.mp3" },
    { title: "Song 7", src: "songs/song7.mp3" },
    { title: "Song 8", src: "songs/song8.mp3" },
    { title: "Song 9", src: "songs/song9.mp3" },
    { title: "Song 10", src: "songs/song10.mp3" }
  ];

  var currentTrackIndex = Math.floor(Math.random() * PLAYLIST.length);

  function fmtTime(t) {
    if (!isFinite(t)) t = 0;
    var m = Math.floor(t / 60);
    var s = Math.floor(t % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function heardVolume() {
    var raw = Number(volume && volume.value);
    if (!isFinite(raw) || raw <= 0) raw = 65;
    return Math.max(0.05, Math.min(1, raw / 100));
  }

  function ensureAudioContext() {
    if (!audioCtx) {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audioCtx = new AC();
      } catch (err) {}
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(function () {});
    }
    return audioCtx;
  }

  function setupAudio() {
    if (!audio) return;
    ensureAudioContext();
    if (!audioCtx || audioSourceNode) return;
    try {
      audioSourceNode = audioCtx.createMediaElementSource(audio);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      gain = audioCtx.createGain();
      gain.gain.value = heardVolume();
      audioSourceNode.connect(analyser);
      analyser.connect(gain);
      gain.connect(audioCtx.destination);
      freq = new Uint8Array(analyser.frequencyBinCount);
    } catch (err) {
      audioSourceNode = null;
    }
  }

  function setVol(v, fade) {
    var target = Math.max(0, Math.min(1, v));
    if (gain && audioCtx) {
      try {
        var now = audioCtx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(target, now);
        gain.gain.value = target;
      } catch (e) {
        try { gain.gain.value = target; } catch (err) {}
      }
    }
    if (audio) {
      try {
        audio.volume = target;
      } catch (e) {}
    }
  }

  function buildBars() {
    if (!viz) return;
    viz.textContent = "";
    bars = [];
    var count = (window.innerWidth <= 768) ? 36 : 60;
    for (var i = 0; i < count; i += 1) {
      var arm = document.createElement("i");
      var bar = document.createElement("b");
      arm.appendChild(bar);
      viz.appendChild(arm);
      bars.push(arm);
    }
    placeBars();
  }

  function placeBars() {
    if (!viz || !bars.length) return;
    var r = viz.clientWidth / 2 + 6;
    bars.forEach(function (arm, i) {
      arm.style.transform = "rotate(" + ((i / bars.length) * 360) + "deg) translateY(" + (-r) + "px)";
    });
  }
  buildBars();
  window.addEventListener("resize", placeBars);

  var player = document.getElementById("player");
  function showPlaying() {
    if (orbit) orbit.classList.add("playing");
    if (player) player.classList.add("on");
    if (playBtn) {
      playBtn.setAttribute("aria-label", "Pause");
      var icon = playBtn.querySelector("svg");
      if (icon) icon.innerHTML = pauseMark;
    }
  }

  function showPaused() {
    if (orbit) orbit.classList.remove("playing");
    if (player) player.classList.remove("on");
    if (playBtn) {
      playBtn.setAttribute("aria-label", "Play");
      var iconOff = playBtn.querySelector("svg");
      if (iconOff) iconOff.innerHTML = playMark;
    }
  }

  function startSong() {
    if (!audio) return Promise.reject(new Error("No audio"));
    setupAudio();
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(function () {});
    }
    setVol(heardVolume(), false);
    audio.muted = false;

    var p = audio.play();
    if (p && typeof p.then === "function") {
      return p.then(function () {
        showPlaying();
      }).catch(function (err) {
        var onCanPlay = function () {
          audio.removeEventListener("canplay", onCanPlay);
          audio.play().then(showPlaying).catch(function () {
            showPaused();
          });
        };
        audio.addEventListener("canplay", onCanPlay, { once: true });
      });
    }
    showPlaying();
    return Promise.resolve();
  }

  function loadTrack(index, shouldPlay) {
    if (!audio || !PLAYLIST.length) return Promise.reject(new Error("No audio"));
    currentTrackIndex = ((index % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
    var track = PLAYLIST[currentTrackIndex];
    if (trackNameEl) {
      trackNameEl.textContent = track.title;
    }
    var targetSrc = track.src;
    var isNewSrc = !audio.src || !audio.src.endsWith(targetSrc);
    if (isNewSrc) {
      audio.src = targetSrc;
    }
    if (shouldPlay) {
      audio.muted = false;
      return startSong();
    }
    return Promise.resolve();
  }

  var isTrackSwitching = false;

  function nextTrack(shouldPlay) {
    if (isTrackSwitching) return Promise.resolve();
    isTrackSwitching = true;
    setTimeout(function () {
      isTrackSwitching = false;
    }, 700);
    return loadTrack(currentTrackIndex + 1, shouldPlay !== false);
  }

  function handleSongEnded() {
    nextTrack(true);
  }

  function playEntrySound() {
    try {
      var ctx = ensureAudioContext();
      if (!ctx) return;
      var now = ctx.currentTime;
      var notes = [523.25, 659.25, 783.99, 987.77, 1174.66];
      notes.forEach(function (f, i) {
        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + i * 0.08);
        g.gain.setValueAtTime(0.0001, now + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.15 / (i + 1), now + i * 0.08 + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 1.8);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 1.9);
      });
    } catch (e) {}
  }

  function doEnter() {
    if (hasEntered) return;
    hasEntered = true;
    playEntrySound();
    if (enterOverlay) {
      enterOverlay.classList.add("hide");
      setTimeout(function () {
        enterOverlay.style.display = "none";
      }, 950);
    }
    loadTrack(currentTrackIndex, true).catch(function () {});
  }

  if (enterBtn) {
    enterBtn.addEventListener("click", function (e) {
      if (e) e.stopPropagation();
      doEnter();
    });
  }

  if (enterOverlay) {
    enterOverlay.addEventListener("click", function (e) {
      doEnter();
    });
  }

  window.addEventListener("keydown", function (e) {
    if (!hasEntered && (e.key === "Enter" || e.code === "Enter" || e.code === "Space")) {
      doEnter();
    }
  });

  if (audio) {
    audio.loop = false;
    audio.addEventListener("play", function () {
      setupAudio();
      if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume().catch(function () {});
      }
      setVol(heardVolume(), false);
      showPlaying();
    });
    audio.addEventListener("pause", function () {
      showPaused();
    });
    audio.addEventListener("ended", function () {
      handleSongEnded();
    });
    audio.addEventListener("error", function () {
      setTimeout(function () {
        nextTrack(true);
      }, 1000);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function (e) {
      if (e) e.stopPropagation();
      nextTrack(true);
    });
  }

  if (playBtn && audio) {
    playBtn.addEventListener("click", function (e) {
      if (e) e.stopPropagation();
      if (audio.paused) {
        audio.muted = false;
        startSong().then(function () {
          showPlaying();
        }).catch(function () {
          showToast("The track could not start. Refresh and try again.");
        });
      } else {
        audio.pause();
        showPaused();
      }
    });
    if (volume) {
      function paintVol() {
        volume.style.setProperty("--vol", (Number(volume.value) || 0) + "%");
      }
      paintVol();
      volume.addEventListener("input", function () {
        paintVol();
        if (!audio.paused) setVol(heardVolume(), false);
      });
    }
    function paintTime() {
      if (!ptime) return;
      var cur = fmtTime(seeking && seek ? (Number(seek.value) || 0) / 1000 * audio.duration : audio.currentTime);
      var dur = isFinite(audio.duration) && audio.duration > 0 ? " / " + fmtTime(audio.duration) : "";
      ptime.textContent = cur + dur;
    }
    function paintSeek() {
      if (!seek || !isFinite(audio.duration) || audio.duration <= 0) return;
      var ratio = Math.max(0, Math.min(1, audio.currentTime / audio.duration));
      seek.value = String(Math.round(ratio * 1000));
      seek.style.setProperty("--pos", (ratio * 100) + "%");
    }
    function scrub() {
      if (!seek || !isFinite(audio.duration) || audio.duration <= 0) return;
      var ratio = (Number(seek.value) || 0) / 1000;
      var next = ratio * audio.duration;
      if (Math.abs(audio.currentTime - next) > 0.05) audio.currentTime = next;
      seek.style.setProperty("--pos", (ratio * 100) + "%");
      paintTime();
    }
    if (seek) {
      function beginSeek(event) {
        seeking = true;
        if (event.pointerId != null && seek.setPointerCapture) {
          try { seek.setPointerCapture(event.pointerId); } catch (err) {}
        }
      }
      function endSeek() {
        if (!seeking) return;
        scrub();
        seeking = false;
      }
      seek.addEventListener("pointerdown", beginSeek);
      seek.addEventListener("pointerup", endSeek);
      seek.addEventListener("pointercancel", endSeek);
      seek.addEventListener("lostpointercapture", endSeek);
      seek.addEventListener("input", function () {
        seeking = true;
        scrub();
      });
      seek.addEventListener("change", endSeek);
    }
    audio.addEventListener("timeupdate", function () {
      if (!seeking) {
        paintTime();
        paintSeek();
      }
      if (audio.duration && audio.duration > 2 && audio.currentTime >= audio.duration - 0.28 && !isTrackSwitching && !audio.paused) {
        handleSongEnded();
      }
    });
    audio.addEventListener("loadedmetadata", function () {
      paintTime();
      paintSeek();
    });

    loadTrack(currentTrackIndex, false);
  }

  var wave = [];
  var vizCleared = false;
  function paintViz() {
    var playing = orbit && orbit.classList.contains("playing") && analyser && freq;
    if (playing) {
      vizCleared = false;
      analyser.getByteFrequencyData(freq);
      var bass = Math.pow(freq[2] / 255, 0.7);
      orbit.style.transform = "scale(" + (1 + bass * 0.045).toFixed(3) + ")";
      bars.forEach(function (arm, i) {
        var idx = Math.min(freq.length - 1, Math.floor((i / bars.length) * freq.length * 0.62));
        var bin = freq[idx] / 255;
        var prev = freq[Math.max(0, idx - 1)] / 255;
        var next = freq[Math.min(freq.length - 1, idx + 1)] / 255;
        var level = Math.pow(Math.min(1, bin * 0.6 + prev * 0.22 + next * 0.18), 0.55);
        var last = wave[i] || 0;
        wave[i] = level >= last ? last * 0.18 + level * 0.82 : last * 0.72 + level * 0.28;
        if (arm.firstChild) arm.firstChild.style.height = (4 + wave[i] * 24).toFixed(1) + "px";
      });
    } else if (!vizCleared) {
      vizCleared = true;
      if (orbit) orbit.style.transform = "";
      bars.forEach(function (arm, i) {
        wave[i] = 0;
        if (arm.firstChild) arm.firstChild.style.height = "0px";
      });
    }
    window.requestAnimationFrame(paintViz);
  }
  window.requestAnimationFrame(paintViz);
})();

(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  var root = document.documentElement;
  var canvas = document.getElementById("stars");
  var ctx = canvas ? canvas.getContext("2d") : null;
  var rainCanvas = document.getElementById("rain");
  var rctx = rainCanvas ? rainCanvas.getContext("2d") : null;
  var drops = [];
  var rw = 0;
  var rh = 0;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var isMobile = !fine || (window.innerWidth <= 768);
  var stars = [];
  var sparks = [];
  var w = 0;
  var h = 0;
  var mx = window.innerWidth * 0.72;
  var my = window.innerHeight * 0.22;
  var moved = 0;
  var coordsDirty = true;
  var parts = document.querySelectorAll(".portrait, .social, .card, .langs li, .note, .quote, .form-card, .btn, .wallet");

  function resize() {
    isMobile = !fine || (window.innerWidth <= 768);
    if (!canvas || !ctx) return;
    w = window.innerWidth;
    h = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.35 : 2);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var count = isMobile ? Math.max(16, Math.min(26, Math.floor(w / 18))) : Math.max(42, Math.min(100, Math.floor(w / 14)));
    stars = [];
    for (var i = 0; i < count; i += 1) stars.push(makeStar(true));
    resizeRain();
  }

  function resizeRain() {
    if (!rainCanvas || !rctx) return;
    rw = window.innerWidth;
    rh = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.35 : 2);
    rainCanvas.width = Math.floor(rw * dpr);
    rainCanvas.height = Math.floor(rh * dpr);
    rctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var count = isMobile ? Math.max(12, Math.min(20, Math.floor(rw / 24))) : Math.max(34, Math.min(75, Math.floor(rw / 18)));
    drops = [];
    for (var i = 0; i < count; i += 1) {
      drops.push({
        x: Math.random() * rw,
        y: Math.random() * rh,
        len: isMobile ? 12 + Math.random() * 16 : 16 + Math.random() * 24,
        vy: isMobile ? 7 + Math.random() * 7 : 9 + Math.random() * 11,
        vx: -1.6 - Math.random() * 0.8,
        o: isMobile ? 0.12 + Math.random() * 0.2 : 0.14 + Math.random() * 0.28
      });
    }
  }

  function paintRain() {
    if (!rctx) return;
    rctx.clearRect(0, 0, rw, rh);
    rctx.lineWidth = isMobile ? 1 : 1.15;
    for (var i = 0; i < drops.length; i += 1) {
      var drop = drops[i];
      drop.x += drop.vx;
      drop.y += drop.vy;
      if (drop.y > rh + 24) {
        drop.y = -24;
        drop.x = Math.random() * rw;
      }
      if (drop.x < -30) drop.x = rw + 12;
      var night = document.documentElement.getAttribute("data-theme") === "night";
      rctx.strokeStyle = night
        ? "rgba(232, 226, 214," + Math.min(0.5, drop.o + 0.1).toFixed(3) + ")"
        : "rgba(16, 16, 18," + Math.min(0.78, drop.o + 0.28).toFixed(3) + ")";
      rctx.beginPath();
      rctx.moveTo(drop.x, drop.y);
      rctx.lineTo(drop.x + drop.vx * 1.8, drop.y + drop.len);
      rctx.stroke();
    }
  }

  function makeStar(anywhere) {
    return {
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : -12,
      r: Math.random() * 2.4 + 1.3,
      s: Math.random() * 0.7 + 0.28,
      o: Math.random() * 0.35 + 0.55,
      drift: (Math.random() - 0.5) * 0.35,
      spin: Math.random() * Math.PI * 2,
      gold: Math.random() > 0.72
    };
  }

  function burst(x, y) {
    var maxSparks = isMobile ? 40 : 180;
    var burstCount = isMobile ? 2 : 4;
    for (var i = 0; i < burstCount; i += 1) {
      var angle = Math.random() * Math.PI * 2;
      var speed = Math.random() * 1.4 + 0.35;
      sparks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.45,
        life: 1,
        r: Math.random() * 1.9 + 0.6,
        gold: Math.random() > 0.3
      });
    }
    if (sparks.length > maxSparks) sparks.splice(0, sparks.length - maxSparks);
  }

  function drawSpark(x, y, r, alpha, gold) {
    if (alpha <= 0.02) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;
    if (!isMobile) {
      ctx.shadowColor = gold ? "rgba(243, 224, 170, 0.7)" : "rgba(226, 232, 245, 0.55)";
      ctx.shadowBlur = 8;
    }
    var night = document.documentElement.getAttribute("data-theme") === "night";
    ctx.fillStyle = night ? (gold ? "#f3e6c0" : "#f7f4ee") : (gold ? "#c4a15a" : "#d9d3c8");
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.quadraticCurveTo(0, 0, 0, r);
    ctx.quadraticCurveTo(0, 0, -r, 0);
    ctx.quadraticCurveTo(0, 0, 0, -r);
    ctx.fill();
    ctx.restore();
  }

  function paint() {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < stars.length; i += 1) {
      var star = stars[i];
      var dx = star.x - mx;
      var dy = star.y - my;
      var dist = Math.hypot(dx, dy) || 1;
      if (dist < 140) {
        star.x += (dx / dist) * 0.75;
        star.y += (dy / dist) * 0.35;
      }
      star.y += star.s;
      star.x += star.drift + Math.sin(star.spin) * 0.2;
      star.spin += 0.04;
      if (star.y > h + 12) {
        star.y = -14;
        star.x = Math.random() * w;
      }
      var nightSky = document.documentElement.getAttribute("data-theme") === "night";
      var alpha = star.o * (0.45 + Math.sin(star.spin * 3) * 0.55) * (nightSky ? 0.95 : 0.4);
      drawSpark(star.x, star.y, star.r * (0.75 + Math.sin(star.spin) * 0.25), Math.max(0.08, alpha), star.gold);
    }
    for (var s = sparks.length - 1; s >= 0; s -= 1) {
      var spark = sparks[s];
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.vy += 0.02;
      spark.life *= 0.96;
      drawSpark(spark.x, spark.y, spark.r, spark.life, spark.gold !== undefined ? spark.gold : true);
      if (spark.life < 0.05) sparks.splice(s, 1);
    }
  }

  function follow() {
    if (coordsDirty) {
      coordsDirty = false;
      root.style.setProperty("--mx", mx + "px");
      root.style.setProperty("--my", my + "px");
      root.style.setProperty("--bx", (8 + (mx / Math.max(w, 1)) * 30) + "%");
      root.style.setProperty("--by", ((my / Math.max(h, 1)) * 24 - 8) + "%");
      root.style.setProperty("--bx2", (70 + (mx / Math.max(w, 1)) * 30) + "%");
      root.style.setProperty("--by2", ((my / Math.max(h, 1)) * 20 - 6) + "%");
    }

    if (!fine) return;
    parts.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.bottom < -40 || rect.top > h + 40) return;
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dx = mx - cx;
      var dy = my - cy;
      var dist = Math.hypot(dx, dy);
      var reach = Math.max(rect.width, rect.height) * 0.85 + 120;
      var influence = Math.max(0, 1 - dist / reach);
      el.style.setProperty("--lx", (mx - rect.left) + "px");
      el.style.setProperty("--ly", (my - rect.top) + "px");
      if (influence < 0.04) {
        el.style.transform = "";
        return;
      }
      if (el.tagName === "H1" || el.tagName === "H2") {
        el.style.transform = "translate(" + (dx * 0.03).toFixed(1) + "px," + (dy * 0.03).toFixed(1) + "px)";
        return;
      }
      var strength = el.classList.contains("btn") ? 0.35 : el.classList.contains("portrait") ? 1.35 : 1;
      var rx = ((-dy / (rect.height || 1)) * 8 * influence * strength).toFixed(2);
      var ry = ((dx / (rect.width || 1)) * 10 * influence * strength).toFixed(2);
      var lift = (-8 * influence * (el.classList.contains("btn") ? 0.4 : 1)).toFixed(1);
      el.style.transform = "perspective(900px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(" + lift + "px)";
    });
  }

  window.addEventListener("mousemove", function (event) {
    var travel = Math.hypot(event.clientX - mx, event.clientY - my);
    mx = event.clientX;
    my = event.clientY;
    coordsDirty = true;
    moved += travel;
    if (moved > 16) {
      burst(mx, my);
      moved = 0;
    }
  });

  window.addEventListener("pointerdown", function (event) {
    if (event.clientX == null || event.clientY == null) return;
    var maxSparks = isMobile ? 40 : 180;
    var sparkCount = isMobile ? 6 : 14;
    for (var i = 0; i < sparkCount; i += 1) {
      var angle = (i / sparkCount) * Math.PI * 2 + (Math.random() * 0.3);
      var speed = Math.random() * (isMobile ? 1.8 : 2.6) + 1;
      sparks.push({
        x: event.clientX,
        y: event.clientY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.2,
        life: 1.15,
        r: Math.random() * (isMobile ? 1.6 : 2.2) + 1,
        gold: Math.random() > 0.25
      });
    }
    if (sparks.length > maxSparks) sparks.splice(0, sparks.length - maxSparks);
  });

  window.addEventListener("mouseleave", function () {
    parts.forEach(function (el) { el.style.transform = ""; });
  });

  window.addEventListener("resize", resize);
  resize();

  function frame() {
    follow();
    paint();
    paintRain();
    window.requestAnimationFrame(frame);
  }
  window.requestAnimationFrame(frame);
})();
