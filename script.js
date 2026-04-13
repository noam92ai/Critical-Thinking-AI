/* ─────────────────────────────────────────────
   Think Before You Prompt — Main Script
   ───────────────────────────────────────────── */

// ── Lesson Data ──────────────────────────────
const LESSONS = [
  {
    id: 0,
    title: "Why AI Can Be Wrong",
    emoji: "🤖",
    color: "#7C3AED",
    bg: "linear-gradient(160deg,#1a0533 0%,#3b0764 50%,#1e1b4b 100%)",
    description: "AI models predict the next word — they don't actually 'know' facts.",
    tags: ["Trained on past data", "Can hallucinate confidently", "No real understanding"],
    // Set videoSrc to a real URL to use an actual video, otherwise a styled card is shown
    videoSrc: null,
  },
  {
    id: 1,
    title: "Bias in AI",
    emoji: "⚖️",
    color: "#0EA5E9",
    bg: "linear-gradient(160deg,#0c1a2e 0%,#0c3a5e 50%,#082f49 100%)",
    description: "AI learns from human-created data — which includes human biases.",
    tags: ["Reflects training data biases", "Can reinforce stereotypes", "Requires critical evaluation"],
    videoSrc: null,
  },
  {
    id: 2,
    title: "How to Verify AI Answers",
    emoji: "🔍",
    color: "#10B981",
    bg: "linear-gradient(160deg,#052e16 0%,#064e3b 50%,#0f2419 100%)",
    description: "Never accept an AI answer at face value. Always cross-check.",
    tags: ["Use multiple sources", "Check publication dates", "Look for primary sources"],
    videoSrc: null,
  },
  {
    id: 3,
    title: "Don't Trust Confident Tone",
    emoji: "😎",
    color: "#F59E0B",
    bg: "linear-gradient(160deg,#1c1008 0%,#451a03 50%,#2d1600 100%)",
    description: "AI sounds confident even when completely wrong. Tone ≠ accuracy.",
    tags: ["Confidence is stylistic", "Wrong answers sound fluent", "Skepticism is a skill"],
    videoSrc: null,
  },
  {
    id: 4,
    title: "Ask Better Questions",
    emoji: "💡",
    color: "#EC4899",
    bg: "linear-gradient(160deg,#2d0a1e 0%,#500724 50%,#1f0d14 100%)",
    description: "The quality of AI output depends entirely on how you prompt it.",
    tags: ["Be specific & clear", "Add context and constraints", "Iterate and refine"],
    videoSrc: null,
  },
];

const EMOJIS = ["👍", "🤔", "🔥"];

// ── App State ─────────────────────────────────
const state = {
  username: "",
  current: 0,
  views: LESSONS.map(() => 0),
  reactions: LESSONS.map(() => Object.fromEntries(EMOJIS.map(e => [e, 0]))),
  comments: LESSONS.map(() => []),
  userReacted: LESSONS.map(() => ({})), // tracks per-lesson per-emoji for current session
  viewedOnce: new Set(),
};

// ── DOM Refs ──────────────────────────────────
const $ = id => document.getElementById(id);
const onboardingScreen = $("onboarding-screen");
const feedScreen       = $("feed-screen");
const usernameInput    = $("username-input");
const startBtn         = $("start-btn");
const progressDots     = $("progress-dots");
const lessonLabel      = $("lesson-label");
const viewCount        = $("view-count");
const reelContainer    = $("reel-container");
const btnPrev          = $("btn-prev");
const btnNext          = $("btn-next");
const commentsOverlay  = $("comments-overlay");
const commentsTitle    = $("comments-title");
const commentsList     = $("comments-list");
const commentInput     = $("comment-input");
const commentSend      = $("comment-send");
const commentsClose    = $("comments-close");
const endOverlay       = $("end-overlay");
const endTitle         = $("end-title");
const endReactions     = $("end-reactions");
const endComments      = $("end-comments");
const endContinue      = $("end-continue");
const burstLayer       = $("burst-layer");

// Per-reel video/slider element references (populated in buildFeed)
const reelEls = []; // { el, videoEl, sliderEl, playIcon, timerFn }

// ── Helpers ───────────────────────────────────
function fmt(s) {
  s = isNaN(s) ? 0 : s;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem("tbp_state");
    if (!saved) return;
    const parsed = JSON.parse(saved);
    state.views     = parsed.views     || state.views;
    state.reactions = parsed.reactions || state.reactions;
    state.comments  = parsed.comments  || state.comments;
  } catch (_) {}
}

function saveToStorage() {
  try {
    localStorage.setItem("tbp_state", JSON.stringify({
      views:     state.views,
      reactions: state.reactions,
      comments:  state.comments,
    }));
  } catch (_) {}
}

// ── Build Feed ────────────────────────────────
function buildFeed() {
  // Progress dots
  progressDots.innerHTML = "";
  LESSONS.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.className = "progress-dot";
    dot.dataset.i = i;
    progressDots.appendChild(dot);
  });

  // Reels
  reelContainer.innerHTML = "";
  LESSONS.forEach((lesson, i) => {
    const reel = document.createElement("div");
    reel.className = "reel";
    reel.style.transform = `translateY(${i * 100}%)`;

    // Background gradient overlay
    const bgEl = document.createElement("div");
    bgEl.className = "reel-overlay-bg";
    bgEl.style.background = lesson.bg;
    reel.appendChild(bgEl);

    // Video or placeholder card
    let mediaEl = null;
    if (lesson.videoSrc) {
      mediaEl = document.createElement("video");
      mediaEl.className = "reel-video";
      mediaEl.src = lesson.videoSrc;
      mediaEl.playsInline = true;
      mediaEl.muted = true;
      mediaEl.preload = "metadata";
    } else {
      // Styled placeholder (no real video)
      mediaEl = document.createElement("div");
      mediaEl.className = "reel-placeholder";
      mediaEl.style.background = lesson.bg;
      const placeholderIcon = document.createElement("div");
      placeholderIcon.style.cssText = "font-size:80px;opacity:.18;";
      placeholderIcon.textContent = lesson.emoji;
      mediaEl.appendChild(placeholderIcon);
    }
    reel.appendChild(mediaEl);

    // Play icon (shown when paused)
    const playIcon = document.createElement("div");
    playIcon.className = "play-icon hidden";
    playIcon.textContent = "▶";
    reel.appendChild(playIcon);

    // Content overlay
    const content = document.createElement("div");
    content.className = "reel-content";
    content.innerHTML = `
      <div class="reel-emoji">${lesson.emoji}</div>
      <h2 class="reel-title">${lesson.title}</h2>
      <p class="reel-desc">${lesson.description}</p>
      <div class="reel-tags">${lesson.tags.map(t => `<span class="reel-tag">${t}</span>`).join("")}</div>
    `;
    reel.appendChild(content);

    // Right-side action buttons (reactions + comments)
    const actions = document.createElement("div");
    actions.className = "reel-actions";
    EMOJIS.forEach(emoji => {
      const btn = document.createElement("button");
      btn.className = "action-btn";
      btn.dataset.emoji = emoji;
      btn.dataset.lesson = i;
      btn.innerHTML = `<span class="emoji-icon">${emoji}</span><span class="count">0</span>`;
      btn.addEventListener("click", e => { e.stopPropagation(); handleReaction(i, emoji, btn, e); });
      actions.appendChild(btn);
    });

    // Comment button
    const commentBtn = document.createElement("button");
    commentBtn.className = "action-btn";
    commentBtn.dataset.lesson = i;
    commentBtn.innerHTML = `<span class="emoji-icon">💬</span><span class="count">${state.comments[i].length}</span>`;
    commentBtn.addEventListener("click", e => { e.stopPropagation(); openComments(i); });
    actions.appendChild(commentBtn);
    reel.appendChild(actions);

    // Timeline
    const timeline = document.createElement("div");
    timeline.className = "reel-timeline";
    timeline.innerHTML = `
      <div class="timeline-times">
        <span class="time-current">0:00</span>
        <span class="time-duration">0:00</span>
      </div>
      <input type="range" class="timeline-slider" min="0" max="100" step="0.1" value="0">
    `;
    reel.appendChild(timeline);

    // Wire up video events if real video
    const slider = timeline.querySelector(".timeline-slider");
    const timeCurrent = timeline.querySelector(".time-current");
    const timeDuration = timeline.querySelector(".time-duration");
    let scrubbing = false;

    if (lesson.videoSrc) {
      mediaEl.addEventListener("loadedmetadata", () => {
        slider.max = mediaEl.duration;
        timeDuration.textContent = fmt(mediaEl.duration);
      });
      mediaEl.addEventListener("timeupdate", () => {
        if (scrubbing) return;
        slider.value = mediaEl.currentTime;
        timeCurrent.textContent = fmt(mediaEl.currentTime);
      });
      mediaEl.addEventListener("ended", () => {
        playIcon.classList.remove("hidden");
        showEndOverlay(i);
      });
      mediaEl.addEventListener("click", () => togglePlay(i));
      content.addEventListener("click", () => togglePlay(i));
    } else {
      // Fake animated timeline for placeholder
      let fakeTime = 0;
      const fakeDuration = 30;
      slider.max = fakeDuration;
      timeDuration.textContent = fmt(fakeDuration);
      let timerInterval = null;
      reelEls[i] = { ...reelEls[i], startFakeTimer: () => {
        if (timerInterval) return;
        timerInterval = setInterval(() => {
          if (scrubbing) return;
          fakeTime = Math.min(fakeTime + 0.25, fakeDuration);
          slider.value = fakeTime;
          timeCurrent.textContent = fmt(fakeTime);
          if (fakeTime >= fakeDuration) {
            clearInterval(timerInterval);
            timerInterval = null;
            playIcon.classList.remove("hidden");
            showEndOverlay(i);
          }
        }, 250);
      }, stopFakeTimer: () => {
        clearInterval(timerInterval);
        timerInterval = null;
      }, resetFakeTimer: () => {
        clearInterval(timerInterval);
        timerInterval = null;
        fakeTime = 0;
        slider.value = 0;
        timeCurrent.textContent = "0:00";
      }};

      // Toggle fake play on click
      const toggleFake = () => {
        if (playIcon.classList.contains("hidden")) {
          reelEls[i].stopFakeTimer();
          playIcon.classList.remove("hidden");
        } else {
          reelEls[i].startFakeTimer();
          playIcon.classList.add("hidden");
        }
      };
      mediaEl.addEventListener("click", toggleFake);
      content.addEventListener("click", toggleFake);
    }

    // Scrub events (both real and fake timelines)
    slider.addEventListener("mousedown", () => { scrubbing = true; });
    slider.addEventListener("touchstart", () => { scrubbing = true; }, { passive: true });
    slider.addEventListener("mouseup", () => { scrubbing = false; });
    slider.addEventListener("touchend", () => { scrubbing = false; });
    slider.addEventListener("input", () => {
      const t = parseFloat(slider.value);
      timeCurrent.textContent = fmt(t);
      if (lesson.videoSrc && mediaEl.tagName === "VIDEO") mediaEl.currentTime = t;
    });
    slider.addEventListener("click", e => e.stopPropagation());

    // Store element refs
    reelEls[i] = {
      el: reel,
      mediaEl,
      slider,
      playIcon,
      actions,
      commentBtn,
      ...reelEls[i], // preserve fake timer fns if set
    };

    reelContainer.appendChild(reel);
  });

  // Set CSS variable for lesson color on root
  updateLessonColor();
}

// ── Navigation ────────────────────────────────
function goTo(idx, animated = true) {
  if (idx < 0 || idx >= LESSONS.length) return;

  // Pause current
  pauseReel(state.current);

  state.current = idx;

  // Slide all reels
  reelContainer.style.transition = animated
    ? "transform .4s cubic-bezier(.4,0,.2,1)"
    : "none";
  reelContainer.style.transform = `translateY(-${idx * 100}vh)`;

  // Track view
  if (!state.viewedOnce.has(idx)) {
    state.viewedOnce.add(idx);
    state.views[idx]++;
    saveToStorage();
  }

  updateUI();
  playReel(idx);
}

function playReel(idx) {
  const r = reelEls[idx];
  if (!r) return;
  if (LESSONS[idx].videoSrc && r.mediaEl.tagName === "VIDEO") {
    r.mediaEl.currentTime = 0;
    r.mediaEl.play().catch(() => {});
    r.playIcon.classList.add("hidden");
  } else {
    if (r.resetFakeTimer) r.resetFakeTimer();
    if (r.startFakeTimer) r.startFakeTimer();
    r.playIcon.classList.add("hidden");
  }
}

function pauseReel(idx) {
  const r = reelEls[idx];
  if (!r) return;
  if (LESSONS[idx].videoSrc && r.mediaEl.tagName === "VIDEO") {
    r.mediaEl.pause();
    r.playIcon.classList.remove("hidden");
  } else {
    if (r.stopFakeTimer) r.stopFakeTimer();
  }
}

function togglePlay(idx) {
  const r = reelEls[idx];
  if (!r || LESSONS[idx].videoSrc === null) return;
  if (r.mediaEl.paused) {
    r.mediaEl.play().catch(() => {});
    r.playIcon.classList.add("hidden");
  } else {
    r.mediaEl.pause();
    r.playIcon.classList.remove("hidden");
  }
}

// ── UI Updates ────────────────────────────────
function updateUI() {
  const idx = state.current;

  // Lesson label
  lessonLabel.textContent = `Lesson ${idx + 1} of ${LESSONS.length}`;

  // View count
  const v = state.views[idx];
  viewCount.textContent = `👁️ ${v.toLocaleString()} ${v === 1 ? "view" : "views"}`;

  // Progress dots
  document.querySelectorAll(".progress-dot").forEach((dot, i) => {
    dot.classList.toggle("done", i < idx);
    dot.classList.toggle("active-dot", i === idx);
  });

  // Nav buttons
  btnPrev.disabled = idx === 0;
  btnNext.disabled = idx === LESSONS.length - 1;
  btnNext.textContent = idx === LESSONS.length - 1 ? "🎉 Done!" : "↓ Next";

  // Reaction counts
  EMOJIS.forEach(emoji => {
    const btn = document.querySelector(`.action-btn[data-emoji="${emoji}"][data-lesson="${idx}"]`);
    if (btn) btn.querySelector(".count").textContent = state.reactions[idx][emoji];
  });

  // Comment count
  const cBtn = reelEls[idx]?.commentBtn;
  if (cBtn) cBtn.querySelector(".count").textContent = state.comments[idx].length;

  // CSS color var
  updateLessonColor();
}

function updateLessonColor() {
  document.documentElement.style.setProperty("--lesson-color", LESSONS[state.current].color);
}

// ── Reactions ─────────────────────────────────
function handleReaction(lessonIdx, emoji, btnEl, event) {
  if (state.userReacted[lessonIdx][emoji]) return; // already reacted

  state.userReacted[lessonIdx][emoji] = true;
  state.reactions[lessonIdx][emoji]++;
  saveToStorage();

  btnEl.classList.add("reacted");
  btnEl.querySelector(".count").textContent = state.reactions[lessonIdx][emoji];

  // Burst animation
  const rect = btnEl.getBoundingClientRect();
  spawnBurst(emoji, rect.left + rect.width / 2, rect.top);
}

function spawnBurst(emoji, x, y) {
  const el = document.createElement("div");
  el.className = "burst";
  el.textContent = emoji;
  el.style.left = `${x - 20}px`;
  el.style.top  = `${y - 20}px`;
  burstLayer.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

// ── Comments ──────────────────────────────────
let activeCommentLesson = 0;

function openComments(lessonIdx) {
  activeCommentLesson = lessonIdx;
  renderComments();
  commentsOverlay.classList.remove("hidden");
  commentInput.placeholder = `Add a comment as ${state.username}…`;
  commentInput.focus();
}

function renderComments() {
  const list = state.comments[activeCommentLesson];
  commentsTitle.textContent = `Comments (${list.length})`;
  if (list.length === 0) {
    commentsList.innerHTML = `<p class="comments-empty">Be the first to comment!</p>`;
    return;
  }
  commentsList.innerHTML = list.map(c => `
    <div class="comment-item">
      <div class="comment-meta">
        <div class="comment-avatar">${c.user[0].toUpperCase()}</div>
        <span class="comment-user">${c.user}</span>
        <span class="comment-time">${c.time}</span>
      </div>
      <p class="comment-text">${escapeHTML(c.text)}</p>
    </div>
  `).join("");
  commentsList.scrollTop = commentsList.scrollHeight;
}

function submitComment() {
  const text = commentInput.value.trim();
  if (!text) return;
  const now = new Date();
  const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2,"0")} today`;
  state.comments[activeCommentLesson].push({ user: state.username, text, time });
  saveToStorage();
  commentInput.value = "";
  renderComments();
  // Update comment count badge
  const cBtn = reelEls[activeCommentLesson]?.commentBtn;
  if (cBtn) cBtn.querySelector(".count").textContent = state.comments[activeCommentLesson].length;
}

function escapeHTML(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ── End-of-Video Overlay ──────────────────────
function showEndOverlay(idx) {
  const lesson = LESSONS[idx];
  endTitle.textContent = lesson.title;

  // Reactions bar chart
  const rxData = state.reactions[idx];
  const total = Math.max(Object.values(rxData).reduce((a,b) => a+b, 0), 1);
  endReactions.innerHTML = EMOJIS.map(emoji => `
    <div class="end-reaction-row">
      <div class="end-reaction-header">
        <span>${emoji}</span>
        <span>${rxData[emoji]}</span>
      </div>
      <div class="end-bar-bg">
        <div class="end-bar-fill" style="width:${Math.round((rxData[emoji]/total)*100)}%"></div>
      </div>
    </div>
  `).join("");

  // Last 2 comments
  const recent = state.comments[idx].slice(-2);
  endComments.innerHTML = recent.length
    ? recent.map(c => `<div class="end-comment"><strong>${escapeHTML(c.user)}</strong><p>${escapeHTML(c.text)}</p></div>`).join("")
    : "";

  endContinue.textContent = idx === LESSONS.length - 1 ? "🎉 Finish!" : "Continue →";
  endOverlay.classList.remove("hidden");
}

// ── Swipe Gesture ─────────────────────────────
let touchStartY = null;
let touchStartX = null;

document.addEventListener("touchstart", e => {
  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;
}, { passive: true });

document.addEventListener("touchend", e => {
  if (touchStartY === null) return;
  const dy = touchStartY - e.changedTouches[0].clientY;
  const dx = Math.abs(touchStartX - e.changedTouches[0].clientX);
  // Only vertical swipes (more vertical than horizontal, at least 50px)
  if (Math.abs(dy) > 50 && Math.abs(dy) > dx) {
    if (dy > 0) goTo(state.current + 1);
    else        goTo(state.current - 1);
  }
  touchStartY = null;
  touchStartX = null;
}, { passive: true });

// ── Keyboard Navigation ───────────────────────
document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp")   goTo(state.current - 1);
  if (e.key === "ArrowDown") goTo(state.current + 1);
});

// ── Event Wiring ──────────────────────────────
// Onboarding
usernameInput.addEventListener("input", () => {
  const ok = usernameInput.value.trim().length > 0;
  startBtn.classList.toggle("ready", ok);
  startBtn.disabled = !ok;
});
usernameInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !startBtn.disabled) launchFeed();
});
startBtn.addEventListener("click", launchFeed);

function launchFeed() {
  const name = usernameInput.value.trim();
  if (!name) return;
  state.username = name;
  try { localStorage.setItem("tbp_username", name); } catch (_) {}
  onboardingScreen.classList.remove("active");
  feedScreen.classList.add("active");
  goTo(0, false);
}

// Nav buttons
btnPrev.addEventListener("click", () => goTo(state.current - 1));
btnNext.addEventListener("click", () => goTo(state.current + 1));

// Comments drawer
commentsClose.addEventListener("click", () => commentsOverlay.classList.add("hidden"));
commentsOverlay.addEventListener("click", e => {
  if (e.target === commentsOverlay) commentsOverlay.classList.add("hidden");
});
commentSend.addEventListener("click", submitComment);
commentInput.addEventListener("keydown", e => {
  if (e.key === "Enter") submitComment();
});

// End overlay continue
endContinue.addEventListener("click", () => {
  endOverlay.classList.add("hidden");
  if (state.current < LESSONS.length - 1) goTo(state.current + 1);
});

// ── Init ──────────────────────────────────────
(function init() {
  loadFromStorage();
  buildFeed();

  // Restore username if returning user
  try {
    const saved = localStorage.getItem("tbp_username");
    if (saved) usernameInput.value = saved;
    usernameInput.dispatchEvent(new Event("input"));
  } catch (_) {}
})();
