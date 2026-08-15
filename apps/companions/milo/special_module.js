/* =========================================================
   MILO CELESTIAN COMPANION — SPECIAL MODULE
   Celestian's Workshop
   ========================================================= */

(function () {
  "use strict";

  const STYLE_ID = "companion-special-module-celestian-workshop-style";

  let runtime = null;
  let navButton = null;
  let panel = null;
  let style = null;
  let activeTab = "trick";

  const state = {
    abracadabraUsed: false,
    curtainCallUsed: false,
    miaOpen: false
  };

  const TRICK_TYPES = {
    vanish: {
      name: "Vanish",
      effects: [
        "make the chosen object disappear in full view",
        "erase the prop from the audience's attention before the reveal",
        "leave the audience staring at an unmistakably empty space"
      ]
    },
    appearance: {
      name: "Appearance",
      effects: [
        "produce the chosen object from an apparently empty space",
        "make the final prop arrive where nobody expects it",
        "turn an empty setup into a sudden reveal"
      ]
    },
    transformation: {
      name: "Transformation",
      effects: [
        "change one prop into another without breaking the rhythm",
        "make the audience track the wrong object while the real change happens",
        "reframe an ordinary prop as something completely different"
      ]
    },
    prediction: {
      name: "Prediction",
      effects: [
        "reveal a prediction that appears impossible to have known",
        "guide the audience toward a choice that already has an answer waiting",
        "make the final reveal feel inevitable only after it happens"
      ]
    },
    escape: {
      name: "Escape",
      effects: [
        "escape a visible restraint while keeping the method concealed",
        "turn a locked situation into the setup for the reveal",
        "make the audience focus on the restraint instead of the exit"
      ]
    },
    levitation: {
      name: "Levitation",
      effects: [
        "make the selected object appear to ignore gravity",
        "suspend the prop long enough to sell the impossible moment",
        "create a floating reveal with as little visible support as possible"
      ]
    },
    card: {
      name: "Card Trick",
      effects: [
        "control a selected card while pretending to lose it",
        "make a card travel somewhere it logically should not be",
        "build a layered reveal from a simple audience choice"
      ]
    },
    animal: {
      name: "Animal-Assisted",
      effects: [
        "build the reveal around an animal-friendly cue and reward",
        "let the animal become the apparent source of the impossible moment",
        "turn a simple trained behavior into a theatrical reveal"
      ]
    },
    custom: {
      name: "Custom",
      effects: [
        "combine the selected props into an original impossible effect",
        "build a routine around the strongest visual contrast in the chosen setup",
        "construct a reveal that makes the audience question what they actually saw"
      ]
    }
  };

  const STYLE_DATA = {
    cute: {
      adjective: "Playful",
      flourish: "End on a warm, obvious visual reveal that lets the audience laugh before they applaud."
    },
    mysterious: {
      adjective: "Enigmatic",
      flourish: "Keep the method hidden behind pauses, eye contact, and one deliberately unexplained detail."
    },
    dramatic: {
      adjective: "Theatrical",
      flourish: "Build toward one large final beat and give the reveal enough silence to land."
    },
    comedic: {
      adjective: "Chaotic",
      flourish: "Let one apparent mistake become the setup for the real effect."
    },
    creepy: {
      adjective: "Uncanny",
      flourish: "Use stillness and delayed movement so the reveal feels wrong in a memorable way."
    },
    romantic: {
      adjective: "Tender",
      flourish: "Make the reveal feel personal, with the final object or gesture directed toward one person."
    },
    chaotic: {
      adjective: "Unpredictable",
      flourish: "Layer two fake failures before snapping everything into place at the end."
    }
  };

  const PROP_DETAILS = {
    Cards: "a controlled selection and a hidden position change",
    Coins: "sound, palm concealment, and a clean empty-hand display",
    Rope: "a false condition followed by a restoration or release",
    Hat: "an apparently empty container that becomes the center of the reveal",
    Box: "a sealed-looking space with a delayed reveal",
    Cloth: "a visual cover that gives the audience a clear before-and-after image",
    Mirror: "reflections and viewing angles that create a false spatial assumption",
    Light: "attention control through brightness and timing",
    Smoke: "a short visual interruption that masks the transition",
    Ribbon: "a soft visual trail that can hide, guide, or frame the final motion"
  };

  const SPELL_INTENTS = {
    protect: ["Aegis", "Ward", "Sanctum"],
    heal: ["Mend", "Solace", "Renewal"],
    reveal: ["Revelare", "Sight", "Unveiling"],
    conceal: ["Veil", "Shroud", "Umbra"],
    illuminate: ["Lumen", "Beacon", "Radiance"],
    bind: ["Tether", "Seal", "Anchor"],
    distract: ["Glamour", "Echo", "Flicker"],
    comfort: ["Haven", "Serenity", "Kindle"],
    locate: ["Compass", "Trace", "Finder"],
    transform: ["Shift", "Metamorph", "Turn"]
  };

  const SPELL_MEDIA = {
    starlight: {
      name: "Starlight",
      suffix: ["Astra", "Caelum", "Nova"],
      description: "constellation-shaped light"
    },
    cards: {
      name: "Cards",
      suffix: ["Arcana", "Deck", "Fortuna"],
      description: "orbiting spectral cards"
    },
    smoke: {
      name: "Smoke",
      suffix: ["Nebula", "Vapor", "Mist"],
      description: "blue-violet smoke"
    },
    thread: {
      name: "Thread",
      suffix: ["Filum", "Weave", "Knot"],
      description: "luminous threads"
    },
    mirrors: {
      name: "Mirrors",
      suffix: ["Speculum", "Prism", "Glass"],
      description: "fragmented reflections"
    },
    flowers: {
      name: "Flowers",
      suffix: ["Flora", "Petal", "Bloom"],
      description: "briefly blooming spectral flowers"
    },
    moonlight: {
      name: "Moonlight",
      suffix: ["Luna", "Noctis", "Crescent"],
      description: "cool silver-blue moonlight"
    },
    crystal: {
      name: "Crystal",
      suffix: ["Crux", "Facet", "Gem"],
      description: "floating crystalline facets"
    },
    sound: {
      name: "Sound",
      suffix: ["Resonare", "Chord", "Echo"],
      description: "visible rings of resonant sound"
    }
  };

  const POWER_DATA = {
    minor: { label: "Minor", stability: 92, complexity: "Low", cost: 1 },
    moderate: { label: "Moderate", stability: 82, complexity: "Moderate", cost: 3 },
    major: { label: "Major", stability: 68, complexity: "High", cost: 5 }
  };

  function getCharacter() {
    return runtime?.getCharacter?.() || {};
  }

  function getIdentity() {
    const identityId = runtime?.getActiveIdentity?.();
    const character = getCharacter();
    return character.identities?.[identityId]
      || character.identities?.[character.defaultIdentity]
      || {};
  }

  function getShortName() {
    const identity = getIdentity();
    return identity.shortName || identity.name || "Milo";
  }

  function toast(message) {
    runtime?.showToast?.(message);
  }

  function expression(name) {
    try {
      runtime?.setExpression?.(name);
    } catch (_) {
      /* Expressions are optional for compatibility with different companions. */
    }
  }

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function hashString(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function pick(list, seed, offset = 0) {
    if (!list.length) return "";
    return list[(seed + offset) % list.length];
  }

  function score(seed, min, max, offset = 0) {
    const span = max - min + 1;
    return min + ((seed >>> (offset % 16)) % span);
  }

  function stars(value) {
    const filled = Math.max(1, Math.min(5, value));
    return "★".repeat(filled) + "☆".repeat(5 - filled);
  }

  function renderShell() {
    panel.innerHTML = `
      <div class="cw-shell">
        <div class="cw-hero">
          <div>
            <div class="cw-kicker">CELESTIAN // PRIVATE BACKSTAGE ACCESS</div>
            <h2>CELESTIAN'S WORKSHOP</h2>
            <p>Build a routine, prototype a spell, pull a clue from the hat, or pin down a timeline before the curtain falls.</p>
          </div>
          <div class="cw-sigil" aria-hidden="true">
            <span>✦</span>
            <span>♢</span>
            <span>✦</span>
          </div>

          <button
            type="button"
            class="cw-mia-secret"
            data-mia-secret
            aria-label="A tiny hidden rabbit"
            title="...did that move?"
          >🐇</button>
        </div>

        <div class="cw-mia-panel" data-mia-panel hidden>
          <div class="cw-mia-head">
            <div>
              <span class="cw-mini-label">SECRET COMPARTMENT</span>
              <h3>Mia's Hat</h3>
            </div>
            <button type="button" class="cw-mia-close" data-mia-close aria-label="Close Mia's Hat">×</button>
          </div>

          <p class="cw-explainer">
            Something small is hiding in the workshop. Put a worry, doubt, or thought into the hat.
            Milo won't solve it for you—he'll just sit with it for a moment.
          </p>

          <label class="cw-field">
            <span>PUT SOMETHING IN THE HAT</span>
            <textarea data-mia-input placeholder="I'm scared I'm overlooking something..."></textarea>
          </label>

          <div class="cw-actions">
            <button type="button" class="cw-primary" data-mia-submit>LEAVE IT WITH MIA</button>
          </div>

          <div data-mia-result></div>
        </div>

        <div class="cw-tabs" role="tablist" aria-label="Workshop tools">
          <button type="button" class="cw-tab" data-tab="trick">TRICK LAB</button>
          <button type="button" class="cw-tab" data-tab="spell">SPELL LAB</button>
          <button type="button" class="cw-tab" data-tab="abracadabra">ABRACADABRA</button>
          <button type="button" class="cw-tab" data-tab="curtain">CURTAIN CALL</button>
        </div>

        <div class="cw-stage">
          <section class="cw-tool" data-tool="trick"></section>
          <section class="cw-tool" data-tool="spell"></section>
          <section class="cw-tool" data-tool="abracadabra"></section>
          <section class="cw-tool" data-tool="curtain"></section>
        </div>
      </div>
    `;

    panel.querySelectorAll(".cw-tab").forEach(button => {
      button.addEventListener("click", () => switchTab(button.dataset.tab));
    });

    panel.querySelector("[data-mia-secret]")?.addEventListener("click", toggleMiaPanel);
    panel.querySelector("[data-mia-close]")?.addEventListener("click", () => toggleMiaPanel(false));
    panel.querySelector("[data-mia-submit]")?.addEventListener("click", answerMia);

    renderTrickLab();
    renderSpellLab();
    renderAbracadabra();
    renderCurtainCall();
    switchTab(activeTab);
  }

  function toggleMiaPanel(force) {
    const miaPanel = panel?.querySelector("[data-mia-panel]");
    const rabbit = panel?.querySelector("[data-mia-secret]");
    if (!miaPanel) return false;

    const shouldOpen = typeof force === "boolean" ? force : miaPanel.hidden;
    miaPanel.hidden = !shouldOpen;
    state.miaOpen = shouldOpen;
    rabbit?.classList.toggle("found", shouldOpen);

    if (shouldOpen) {
      expression("happy");
      toast("SECRET FOUND // MIA'S HAT");
      miaPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    return true;
  }

  function answerMia() {
    const root = panel?.querySelector("[data-mia-panel]");
    if (!root) return false;

    const input = root.querySelector("[data-mia-input]");
    const result = root.querySelector("[data-mia-result]");
    const thought = input?.value.trim() || "";

    if (!thought) {
      result.innerHTML = resultCard(
        "MIA'S HAT",
        "EMPTY HAT",
        `<p>There's nothing in here yet. Milo glances into the hat anyway, just to make sure.</p>`,
        "error"
      );
      toast("MIA'S HAT // EMPTY");
      return false;
    }

    const seed = hashString(thought);
    const responses = [
      "You don't have to solve all of that at once. Pick the smallest part you can actually touch, and start there.",
      "If something feels wrong, write down what you know before your brain starts filling the gaps for you.",
      "Maybe you're missing something. Maybe you're not. Either way, checking carefully is better than punishing yourself for not knowing yet.",
      "You can be scared and still keep going. Those two things aren't opposites.",
      "Try looking at it from the other person's side for a minute. Sometimes the missing piece isn't a fact—it's a viewpoint.",
      "If you keep circling the same thought, give it somewhere to sit for a while. You can come back when it stops shouting."
    ];

    const miaBits = [
      "A tiny pair of ears rises from the hat for half a second, then disappears.",
      "The hat rustles. Milo stares at it like this is somehow your fault.",
      "Something nudges the brim from inside. Milo very deliberately pretends not to notice.",
      "A little white nose appears, twitches once, and vanishes back into the darkness."
    ];

    result.innerHTML = resultCard(
      "MIA'S HAT",
      "SAFEKEEPING",
      `
        <p><strong>You left:</strong> ${esc(thought)}</p>
        <p class="cw-quote">“${esc(pick(responses, seed, 3))}”</p>
        <p class="cw-mia-rustle">🐇 ${esc(pick(miaBits, seed, 9))}</p>
      `
    );

    expression("happy");
    toast("MIA'S HAT // THOUGHT STORED");
    return true;
  }

  function switchTab(tab) {
    activeTab = tab;

    panel.querySelectorAll(".cw-tab").forEach(button => {
      const active = button.dataset.tab === tab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });

    panel.querySelectorAll(".cw-tool").forEach(tool => {
      tool.classList.toggle("active", tool.dataset.tool === tab);
    });
  }

  function resultCard(title, eyebrow, body, type = "success") {
    return `
      <div class="cw-result ${type}">
        <div class="cw-result-head">
          <span>${esc(title)}</span>
          <small>${esc(eyebrow)}</small>
        </div>
        ${body}
      </div>
    `;
  }

  function renderTrickLab() {
    const root = panel.querySelector('[data-tool="trick"]');
    root.innerHTML = `
      <div class="cw-card">
        <div class="cw-section-head">
          <div>
            <span class="cw-mini-label">ROUTINE DESIGN</span>
            <h3>Trick Lab</h3>
          </div>
          <span class="cw-badge">DEFAULT WORKBENCH</span>
        </div>

        <div class="cw-grid">
          <label class="cw-field">
            <span>TRICK TYPE</span>
            <select data-trick-type>
              ${Object.entries(TRICK_TYPES).map(([value, data]) =>
                `<option value="${value}">${esc(data.name)}</option>`
              ).join("")}
            </select>
          </label>

          <label class="cw-field">
            <span>PERFORMANCE STYLE</span>
            <select data-trick-style>
              ${Object.entries(STYLE_DATA).map(([value, data]) =>
                `<option value="${value}">${esc(data.adjective)}</option>`
              ).join("")}
            </select>
          </label>

          <div class="cw-field cw-full">
            <span>AVAILABLE PROPS</span>
            <div class="cw-check-grid">
              ${Object.keys(PROP_DETAILS).map((prop, index) => `
                <label class="cw-check">
                  <input type="checkbox" value="${esc(prop)}" data-trick-prop ${index < 2 ? "checked" : ""}>
                  <span>${esc(prop)}</span>
                </label>
              `).join("")}
            </div>
          </div>

          <label class="cw-field cw-full">
            <span>OPTIONAL NOTE / SPECIAL CONDITION</span>
            <input data-trick-note type="text" placeholder="e.g. Must work at close range; audience surrounds Milo">
          </label>
        </div>

        <div class="cw-actions">
          <button type="button" class="cw-primary" data-build-trick>BUILD ROUTINE</button>
          <button type="button" class="cw-secondary" data-clear-trick>CLEAR</button>
        </div>
      </div>
      <div data-trick-result></div>
    `;

    root.querySelector("[data-build-trick]").addEventListener("click", buildTrick);
    root.querySelector("[data-clear-trick]").addEventListener("click", () => {
      root.querySelector("[data-trick-note]").value = "";
      root.querySelectorAll("[data-trick-prop]").forEach((box, i) => box.checked = i < 2);
      root.querySelector("[data-trick-result]").innerHTML = "";
    });
  }

  function buildTrick() {
    const root = panel.querySelector('[data-tool="trick"]');
    const typeKey = root.querySelector("[data-trick-type]").value;
    const styleKey = root.querySelector("[data-trick-style]").value;
    const props = [...root.querySelectorAll("[data-trick-prop]:checked")].map(box => box.value);
    const note = root.querySelector("[data-trick-note]").value.trim();

    if (!props.length) {
      root.querySelector("[data-trick-result]").innerHTML = resultCard(
        `${getShortName().toUpperCase()} // ROUTINE REJECTED`,
        "NO PROPS",
        `<p>Give me at least one prop to work with. Even I need <em>something</em> to misdirect you with.</p>`,
        "error"
      );
      expression("deadpan");
      toast("TRICK LAB // NEEDS A PROP");
      return;
    }

    const trick = TRICK_TYPES[typeKey];
    const styleData = STYLE_DATA[styleKey];
    const seed = hashString([typeKey, styleKey, props.join("|"), note].join("::"));

    const nouns = ["Star", "Moon", "Comet", "Rabbit", "Mirage", "Phantom", "Bluebird", "Constellation"];
    const endings = ["That Wasn't There", "Behind the Curtain", "In Plain Sight", "After Midnight", "Under Glass", "Second Act", "False Bottom", "Final Bow"];
    const title = `THE ${pick(nouns, seed).toUpperCase()} ${pick(endings, seed, 3).toUpperCase()}`;

    const setupDetail = props.map(prop => PROP_DETAILS[prop]).join("; ");
    const difficulty = score(seed, 2, 5, 1);
    const misdirection = score(seed, 3, 5, 5);
    const risk = score(seed, 1, 4, 9);
    const actualMagic = ["DECLINED", "CLASSIFIED", "ASK MILO", "???", "NO COMMENT"][seed % 5];

    const noteLine = note
      ? `<p><strong>Constraint:</strong> ${esc(note)}</p>`
      : "";

    root.querySelector("[data-trick-result]").innerHTML = resultCard(
      `CELESTIAN ROUTINE // ${String(seed % 1000).padStart(3, "0")}`,
      `${styleData.adjective.toUpperCase()} ${trick.name.toUpperCase()}`,
      `
        <h4>${esc(title)}</h4>
        <p><strong>Effect:</strong> ${esc(pick(trick.effects, seed, 7))}.</p>
        <p><strong>Method focus:</strong> ${esc(setupDetail)}.</p>
        <p><strong>Final flourish:</strong> ${esc(styleData.flourish)}</p>
        ${noteLine}
        <div class="cw-metrics">
          <div><span>DIFFICULTY</span><b>${stars(difficulty)}</b></div>
          <div><span>MISDIRECTION</span><b>${stars(misdirection)}</b></div>
          <div><span>RISK</span><b>${stars(risk)}</b></div>
          <div><span>ACTUAL MAGIC</span><b>${actualMagic}</b></div>
        </div>
        <p class="cw-quote">“Okay. That one has potential. Don't look at my hands.”</p>
      `
    );

    expression("happy");
    toast("TRICK LAB // ROUTINE BUILT");
  }

  function renderSpellLab() {
    const root = panel.querySelector('[data-tool="spell"]');
    root.innerHTML = `
      <div class="cw-card">
        <div class="cw-section-head">
          <div>
            <span class="cw-mini-label">EXPERIMENTAL MAGIC</span>
            <h3>Spell Lab</h3>
          </div>
          <span class="cw-badge">PROTOTYPE ONLY</span>
        </div>

        <div class="cw-grid">
          <label class="cw-field">
            <span>INTENT</span>
            <select data-spell-intent>
              ${Object.keys(SPELL_INTENTS).map(key =>
                `<option value="${key}">${key.charAt(0).toUpperCase() + key.slice(1)}</option>`
              ).join("")}
            </select>
          </label>

          <label class="cw-field">
            <span>MEDIUM</span>
            <select data-spell-medium>
              ${Object.entries(SPELL_MEDIA).map(([key, data]) =>
                `<option value="${key}">${esc(data.name)}</option>`
              ).join("")}
            </select>
          </label>

          <label class="cw-field">
            <span>POWER</span>
            <select data-spell-power>
              <option value="minor">Minor</option>
              <option value="moderate" selected>Moderate</option>
              <option value="major">Major</option>
            </select>
          </label>

          <label class="cw-field">
            <span>SPECIAL CONDITION</span>
            <input data-spell-condition type="text" placeholder="Optional casting rule or limitation">
          </label>
        </div>

        <div class="cw-actions">
          <button type="button" class="cw-primary" data-build-spell>PROTOTYPE SPELL</button>
          <button type="button" class="cw-secondary" data-clear-spell>RESET</button>
        </div>
      </div>
      <div data-spell-result></div>
    `;

    root.querySelector("[data-build-spell]").addEventListener("click", buildSpell);
    root.querySelector("[data-clear-spell]").addEventListener("click", () => {
      root.querySelector("[data-spell-condition]").value = "";
      root.querySelector("[data-spell-result]").innerHTML = "";
    });
  }

  function buildSpell() {
    const root = panel.querySelector('[data-tool="spell"]');
    const intent = root.querySelector("[data-spell-intent]").value;
    const mediumKey = root.querySelector("[data-spell-medium]").value;
    const powerKey = root.querySelector("[data-spell-power]").value;
    const condition = root.querySelector("[data-spell-condition]").value.trim();

    const medium = SPELL_MEDIA[mediumKey];
    const power = POWER_DATA[powerKey];
    const seed = hashString([intent, mediumKey, powerKey, condition].join("::"));

    const prefix = pick(SPELL_INTENTS[intent], seed);
    const suffix = pick(medium.suffix, seed, 5);
    const spellName = `${prefix} ${suffix}`;

    const intentDescriptions = {
      protect: "forms a temporary barrier around the selected target",
      heal: "stabilizes minor injuries and eases immediate pain",
      reveal: "highlights hidden traces, seams, or inconsistencies",
      conceal: "softens the target's presence and draws attention elsewhere",
      illuminate: "creates a controlled source of guiding light",
      bind: "anchors the selected target in place for a short interval",
      distract: "creates a convincing sensory diversion away from the caster",
      comfort: "settles panic and creates a brief sense of safety",
      locate: "pulls visible indicators toward the selected target or direction",
      transform: "temporarily alters the appearance or state of a small target"
    };

    let stability = power.stability + score(seed, -4, 4, 11);
    stability = Math.max(45, Math.min(99, stability));

    const warnings = [
      "Repeated casting causes the effect to become progressively unstable.",
      "Breaking concentration collapses the effect immediately.",
      "The spell becomes unreliable around strong reflections.",
      "The result weakens if the caster tries to affect multiple targets.",
      "Overpowering the spell makes the visual effect much harder to conceal."
    ];

    root.querySelector("[data-spell-result]").innerHTML = resultCard(
      "CELESTIAN SPELL PROTOTYPE",
      `${power.label.toUpperCase()} // ${medium.name.toUpperCase()}`,
      `
        <div class="cw-spell-sigil" aria-hidden="true">
          <span>✦</span><span>◇</span><span>✧</span>
        </div>
        <h4>${esc(spellName)}</h4>
        <p>${esc(medium.description.charAt(0).toUpperCase() + medium.description.slice(1))} ${esc(intentDescriptions[intent])}.</p>
        ${condition ? `<p><strong>Condition:</strong> ${esc(condition)}</p>` : ""}
        <div class="cw-metrics">
          <div><span>STABILITY</span><b>${stability}%</b></div>
          <div><span>COMPLEXITY</span><b>${power.complexity}</b></div>
          <div><span>FOCUS COST</span><b>${"●".repeat(power.cost)}${"○".repeat(5 - power.cost)}</b></div>
        </div>
        <p><strong>Warning:</strong> ${esc(pick(warnings, seed, 13))}</p>
        <p class="cw-quote">“Prototype. Which means if it explodes, technically we learned something.”</p>
      `
    );

    expression("clue");
    toast("SPELL LAB // PROTOTYPE COMPLETE");
  }

  function renderAbracadabra() {
    const root = panel.querySelector('[data-tool="abracadabra"]');
    root.innerHTML = `
      <div class="cw-card">
        <div class="cw-section-head">
          <div>
            <span class="cw-mini-label">LUCKY EVIDENCE PULL</span>
            <h3>Abracadabra</h3>
          </div>
          <span class="cw-badge ${state.abracadabraUsed ? "used" : ""}" data-abracadabra-status>
            ${state.abracadabraUsed ? "USED THIS CASE" : "READY"}
          </span>
        </div>

        <p class="cw-explainer">Enter small clues or observations already available in the case. Milo will pull one from the hat and give it a fresh angle. This is intentionally not a case-solving lynchpin generator.</p>

        <label class="cw-field">
          <span>CLUES — ONE PER LINE</span>
          <textarea data-clue-list placeholder="Broken glass&#10;Wet footprint&#10;Missing key&#10;9:30 PM text message&#10;Open window"></textarea>
        </label>

        <div class="cw-hat" aria-hidden="true">
          <div class="cw-hat-stars"><span>✦</span><span>✧</span><span>✦</span></div>
          <div class="cw-hat-brim"></div>
          <div class="cw-hat-body"></div>
        </div>

        <div class="cw-actions">
          <button type="button" class="cw-primary" data-pull-clue ${state.abracadabraUsed ? "disabled" : ""}>PULL FROM THE HAT</button>
          <button type="button" class="cw-secondary" data-new-case>NEW CASE</button>
        </div>
      </div>
      <div data-clue-result></div>
    `;

    root.querySelector("[data-pull-clue]").addEventListener("click", pullClue);
    root.querySelector("[data-new-case]").addEventListener("click", () => {
      state.abracadabraUsed = false;
      state.curtainCallUsed = false;
      renderAbracadabra();
      renderCurtainCall();
      toast("WORKSHOP // NEW CASE STARTED");
    });
  }

  function pullClue() {
    if (state.abracadabraUsed) return;

    const root = panel.querySelector('[data-tool="abracadabra"]');
    const clues = root.querySelector("[data-clue-list]").value
      .split(/\n+/)
      .map(line => line.trim())
      .filter(Boolean);

    if (clues.length < 2) {
      root.querySelector("[data-clue-result]").innerHTML = resultCard(
        "ABRACADABRA // NOT YET",
        "NEEDS MORE TO WORK WITH",
        `<p>Give me at least two small observations. Pulling one clue from one clue is less “magic trick” and more “reading.”</p>`,
        "error"
      );
      expression("deadpan");
      toast("ABRACADABRA // NEEDS MORE CLUES");
      return;
    }

    const seed = hashString(clues.join("::"));
    const clue = clues[seed % clues.length];

    const prompts = [
      "Are we sure everyone is assuming the same thing about this?",
      "What changes if the obvious explanation for this detail is wrong?",
      "Who had the best opportunity to notice this before anyone else?",
      "Does this detail tell us when something happened, or only that it happened?",
      "Could this have been moved, staged, or noticed at a different time?",
      "What other fact would have to be true for this clue to matter?"
    ];

    state.abracadabraUsed = true;

    root.querySelector("[data-clue-result]").innerHTML = resultCard(
      "ABRACADABRA",
      "MINOR CLUE SURFACED",
      `
        <div class="cw-big-clue">🎩 ${esc(clue)}</div>
        <p class="cw-quote">“${esc(pick(prompts, seed, 7))}”</p>
        <p class="cw-footnote">Abracadabra is now marked used for this case.</p>
      `
    );

    const button = root.querySelector("[data-pull-clue]");
    button.disabled = true;
    root.querySelector("[data-abracadabra-status]").textContent = "USED THIS CASE";
    root.querySelector("[data-abracadabra-status]").classList.add("used");

    expression("happy");
    toast("ABRACADABRA // CLUE PULLED");
  }

  function renderCurtainCall() {
    const root = panel.querySelector('[data-tool="curtain"]');
    root.innerHTML = `
      <div class="cw-card">
        <div class="cw-section-head">
          <div>
            <span class="cw-mini-label">TIMELINE PIN</span>
            <h3>Curtain Call</h3>
          </div>
          <span class="cw-badge ${state.curtainCallUsed ? "used" : ""}" data-curtain-status>
            ${state.curtainCallUsed ? "USED THIS CASE" : "READY"}
          </span>
        </div>

        <p class="cw-explainer">Add timeline facts, then select at least two supporting facts. Curtain Call finds the narrowest time window that contains every selected point.</p>

        <div class="cw-grid">
          <label class="cw-field">
            <span>TIME</span>
            <input type="time" data-event-time>
          </label>

          <label class="cw-field">
            <span>EVENT / FACT</span>
            <input type="text" data-event-text placeholder="Body discovered">
          </label>
        </div>

        <div class="cw-actions">
          <button type="button" class="cw-secondary" data-add-event>ADD FACT</button>
          <button type="button" class="cw-secondary" data-clear-events>CLEAR TIMELINE</button>
        </div>

        <div class="cw-timeline" data-timeline>
          <div class="cw-empty">No timeline facts added yet.</div>
        </div>

        <div class="cw-actions">
          <button type="button" class="cw-primary" data-run-curtain ${state.curtainCallUsed ? "disabled" : ""}>CURTAIN CALL</button>
        </div>
      </div>
      <div data-curtain-result></div>
    `;

    root.dataset.events = "[]";

    root.querySelector("[data-add-event]").addEventListener("click", addTimelineEvent);
    root.querySelector("[data-clear-events]").addEventListener("click", () => {
      root.dataset.events = "[]";
      drawTimeline();
      root.querySelector("[data-curtain-result]").innerHTML = "";
    });
    root.querySelector("[data-run-curtain]").addEventListener("click", runCurtainCall);
  }

  function getTimelineEvents() {
    const root = panel.querySelector('[data-tool="curtain"]');
    try {
      return JSON.parse(root.dataset.events || "[]");
    } catch (_) {
      return [];
    }
  }

  function setTimelineEvents(events) {
    const root = panel.querySelector('[data-tool="curtain"]');
    root.dataset.events = JSON.stringify(events);
  }

  function addTimelineEvent() {
    const root = panel.querySelector('[data-tool="curtain"]');
    const time = root.querySelector("[data-event-time]").value;
    const text = root.querySelector("[data-event-text]").value.trim();

    if (!time || !text) {
      root.querySelector("[data-curtain-result]").innerHTML = resultCard(
        "CURTAIN CALL // INCOMPLETE FACT",
        "TIME + EVENT REQUIRED",
        `<p>Every timeline fact needs both a time and a description.</p>`,
        "error"
      );
      toast("CURTAIN CALL // INCOMPLETE FACT");
      return;
    }

    const events = getTimelineEvents();
    events.push({
      id: Date.now() + Math.random(),
      time,
      text,
      selected: true
    });

    events.sort((a, b) => a.time.localeCompare(b.time));
    setTimelineEvents(events);

    root.querySelector("[data-event-time]").value = "";
    root.querySelector("[data-event-text]").value = "";
    root.querySelector("[data-curtain-result]").innerHTML = "";

    drawTimeline();
  }

  function drawTimeline() {
    const root = panel.querySelector('[data-tool="curtain"]');
    const timeline = root.querySelector("[data-timeline]");
    const events = getTimelineEvents();

    if (!events.length) {
      timeline.innerHTML = `<div class="cw-empty">No timeline facts added yet.</div>`;
      return;
    }

    timeline.innerHTML = events.map(event => `
      <label class="cw-event">
        <input type="checkbox" data-event-id="${event.id}" ${event.selected ? "checked" : ""}>
        <span class="cw-event-time">${esc(event.time)}</span>
        <span class="cw-event-text">${esc(event.text)}</span>
      </label>
    `).join("");

    timeline.querySelectorAll("[data-event-id]").forEach(box => {
      box.addEventListener("change", () => {
        const eventsNow = getTimelineEvents();
        const target = eventsNow.find(event => String(event.id) === box.dataset.eventId);
        if (target) target.selected = box.checked;
        setTimelineEvents(eventsNow);
      });
    });
  }

  function runCurtainCall() {
    if (state.curtainCallUsed) return;

    const root = panel.querySelector('[data-tool="curtain"]');
    const selected = getTimelineEvents().filter(event => event.selected);

    if (selected.length < 2) {
      root.querySelector("[data-curtain-result]").innerHTML = resultCard(
        "CURTAIN CALL // NOT ENOUGH SUPPORT",
        "2 FACTS MINIMUM",
        `<p>Select at least two supporting timeline facts before Milo can pin the window.</p>`,
        "error"
      );
      expression("deadpan");
      toast("CURTAIN CALL // NEEDS TWO FACTS");
      return;
    }

    selected.sort((a, b) => a.time.localeCompare(b.time));
    const start = selected[0].time;
    const end = selected[selected.length - 1].time;

    state.curtainCallUsed = true;

    root.querySelector("[data-curtain-result]").innerHTML = resultCard(
      "CURTAIN CALL",
      "CONFIRMED WINDOW",
      `
        <div class="cw-curtain-window">
          <span>${esc(start)}</span>
          <b>—</b>
          <span>${esc(end)}</span>
        </div>
        <p><strong>Supporting facts:</strong></p>
        <ul class="cw-fact-list">
          ${selected.map(event => `<li><b>${esc(event.time)}</b> — ${esc(event.text)}</li>`).join("")}
        </ul>
        <p class="cw-quote">“And that's our window. Anything outside it needs a very good explanation.”</p>
        <p class="cw-footnote">Curtain Call is now marked used for this case.</p>
      `
    );

    root.querySelector("[data-run-curtain]").disabled = true;
    root.querySelector("[data-curtain-status]").textContent = "USED THIS CASE";
    root.querySelector("[data-curtain-status]").classList.add("used");

    expression("clue");
    toast("CURTAIN CALL // WINDOW PINNED");
  }

  function refreshIdentity() {
    if (!panel || !runtime) return;
    const shortName = getShortName().toUpperCase();
    const kicker = panel.querySelector(".cw-kicker");
    if (kicker) kicker.textContent = `${shortName} // PRIVATE BACKSTAGE ACCESS`;
  }

  function open() {
    if (!runtime || !panel) return false;
    runtime.enterSpecialMode?.();
    navButton?.classList.add("active");
    panel.hidden = false;
    refreshIdentity();
    toast("CELESTIAN'S WORKSHOP // ACTIVE");
    return true;
  }

  function close() {
    if (!panel) return false;
    panel.hidden = true;
    navButton?.classList.remove("active");
    runtime?.leaveSpecialMode?.();
    toast("COMPANION CHAT // ACTIVE");
    return true;
  }

  window.CompanionSpecialModule = {
    id: "celestian-workshop",
    name: "Celestian's Workshop",

    init(nextRuntime) {
      if (!nextRuntime?.mounts?.navigation || !nextRuntime?.mounts?.content) {
        throw new Error("Celestian's Workshop received an incomplete special-module runtime.");
      }

      runtime = nextRuntime;

      style = document.createElement("style");
      style.id = STYLE_ID;
      style.dataset.companionSpecialModule = "celestian-workshop";
      style.textContent = `
        .cw-module {
          --cw-blue: var(--blue, #3897ff);
          --cw-cyan: var(--cyan, #55e6ff);
          --cw-violet: var(--violet, #8e6cff);
          padding: clamp(12px, 1.5vw, 24px);
          min-height: 0;
          overflow: auto;
          color: var(--ink);
          background:
            radial-gradient(circle at 75% 0%, color-mix(in srgb, var(--cw-blue) 16%, transparent), transparent 36%),
            radial-gradient(circle at 15% 70%, color-mix(in srgb, var(--cw-violet) 10%, transparent), transparent 42%);
        }

        .cw-shell {
          display: grid;
          gap: 14px;
          width: 100%;
        }

        .cw-hero,
        .cw-card,
        .cw-result {
          border: 1px solid var(--line);
          border-radius: 18px;
          background: color-mix(in srgb, var(--panel2) 90%, black);
          box-shadow:
            inset 0 0 32px color-mix(in srgb, var(--cw-blue) 6%, transparent),
            0 12px 30px rgba(0,0,0,.12);
        }

        .cw-hero {
          min-height: 116px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          overflow: hidden;
          position: relative;
        }

        .cw-hero::after {
          content: "";
          position: absolute;
          inset: auto -60px -100px auto;
          width: 260px;
          height: 260px;
          border: 1px solid color-mix(in srgb, var(--cw-cyan) 22%, transparent);
          border-radius: 50%;
          box-shadow:
            0 0 0 28px color-mix(in srgb, var(--cw-blue) 5%, transparent),
            0 0 0 56px color-mix(in srgb, var(--cw-violet) 4%, transparent);
          pointer-events: none;
        }

        .cw-mia-secret {
          position: absolute;
          left: 7px;
          bottom: 5px;
          z-index: 3;
          width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          border: 0;
          padding: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
          opacity: .10;
          filter: grayscale(1);
          font-size: 14px;
          transform: rotate(-8deg);
          transition: opacity .2s ease, transform .2s ease, filter .2s ease;
        }

        .cw-mia-secret:hover,
        .cw-mia-secret:focus-visible,
        .cw-mia-secret.found {
          opacity: .9;
          filter: none;
          transform: rotate(0deg) scale(1.08);
          outline: none;
        }

        .cw-mia-panel {
          border: 1px solid color-mix(in srgb, var(--cw-cyan) 34%, var(--line));
          border-radius: 18px;
          padding: clamp(14px, 1.4vw, 20px);
          background:
            radial-gradient(circle at 90% 0%, color-mix(in srgb, var(--cw-blue) 12%, transparent), transparent 34%),
            color-mix(in srgb, var(--panel2) 92%, black);
          box-shadow: inset 0 0 32px color-mix(in srgb, var(--cw-violet) 6%, transparent);
        }

        .cw-mia-panel[hidden] {
          display: none;
        }

        .cw-mia-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .cw-mia-head h3 {
          margin: 4px 0 0;
          color: var(--ink);
          font-size: 18px;
        }

        .cw-mia-close {
          width: 34px;
          height: 34px;
          border: 1px solid var(--line);
          border-radius: 50%;
          cursor: pointer;
          background: color-mix(in srgb, var(--panel) 88%, black);
          color: var(--muted);
          font-size: 20px;
          line-height: 1;
        }

        .cw-mia-rustle {
          margin-top: 12px !important;
          color: color-mix(in srgb, var(--cw-cyan) 68%, var(--muted)) !important;
          font-style: italic;
        }

        .cw-kicker,
        .cw-mini-label,
        .cw-field > span,
        .cw-result-head,
        .cw-badge,
        .cw-metrics span,
        .cw-event-time {
          font: 800 10px/1.2 ui-monospace, SFMono-Regular, Consolas, monospace;
          letter-spacing: .12em;
        }

        .cw-kicker {
          color: color-mix(in srgb, var(--cw-cyan) 76%, var(--ink));
        }

        .cw-hero h2,
        .cw-section-head h3,
        .cw-result h4 {
          margin: 0;
          color: var(--ink);
        }

        .cw-hero h2 {
          margin-top: 5px;
          font-size: clamp(20px, 2vw, 30px);
          letter-spacing: .04em;
        }

        .cw-hero p,
        .cw-explainer {
          margin: 8px 0 0;
          max-width: 760px;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.6;
        }

        .cw-sigil {
          z-index: 1;
          flex: 0 0 auto;
          width: 86px;
          height: 86px;
          border: 1px solid color-mix(in srgb, var(--cw-cyan) 38%, var(--line));
          border-radius: 50%;
          display: grid;
          place-items: center;
          position: relative;
          color: var(--cw-cyan);
          box-shadow: 0 0 30px color-mix(in srgb, var(--cw-blue) 14%, transparent);
        }

        .cw-sigil span {
          position: absolute;
          font-size: 18px;
        }

        .cw-sigil span:nth-child(1) { top: 8px; }
        .cw-sigil span:nth-child(2) { font-size: 34px; }
        .cw-sigil span:nth-child(3) { bottom: 8px; }

        .cw-tabs {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
        }

        .cw-tab,
        .cw-primary,
        .cw-secondary {
          border: 1px solid var(--line);
          border-radius: 11px;
          cursor: pointer;
          transition: .2s ease;
          font: 800 10px/1 ui-monospace, SFMono-Regular, Consolas, monospace;
          letter-spacing: .1em;
        }

        .cw-tab {
          padding: 11px 9px;
          color: var(--muted);
          background: color-mix(in srgb, var(--panel) 88%, black);
        }

        .cw-tab:hover,
        .cw-tab.active {
          color: white;
          border-color: color-mix(in srgb, var(--cw-cyan) 55%, var(--line));
          background: linear-gradient(135deg,
            color-mix(in srgb, var(--cw-violet) 68%, black),
            color-mix(in srgb, var(--cw-blue) 72%, black)
          );
        }

        .cw-tool { display: none; gap: 14px; }
        .cw-tool.active { display: grid; }

        .cw-card,
        .cw-result {
          padding: clamp(14px, 1.4vw, 20px);
        }

        .cw-section-head,
        .cw-result-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .cw-section-head {
          margin-bottom: 14px;
        }

        .cw-mini-label {
          color: color-mix(in srgb, var(--cw-blue) 70%, var(--ink));
        }

        .cw-section-head h3 {
          margin-top: 4px;
          font-size: 18px;
        }

        .cw-badge {
          border: 1px solid color-mix(in srgb, var(--cw-cyan) 40%, var(--line));
          color: color-mix(in srgb, var(--cw-cyan) 76%, var(--ink));
          padding: 6px 8px;
          border-radius: 999px;
          white-space: nowrap;
        }

        .cw-badge.used {
          color: var(--muted);
          border-color: var(--line);
        }

        .cw-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .cw-full { grid-column: 1 / -1; }

        .cw-field {
          display: grid;
          gap: 7px;
        }

        .cw-field > span {
          color: color-mix(in srgb, var(--cw-violet) 66%, var(--ink));
        }

        .cw-field input,
        .cw-field select,
        .cw-field textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid var(--line);
          border-radius: 11px;
          background: color-mix(in srgb, var(--bg) 90%, black);
          color: var(--ink);
          padding: 10px 11px;
          outline: none;
          font: 12px/1.45 ui-monospace, SFMono-Regular, Consolas, monospace;
        }

        .cw-field textarea {
          min-height: 132px;
          resize: vertical;
        }

        .cw-field input:focus,
        .cw-field select:focus,
        .cw-field textarea:focus {
          border-color: var(--cw-blue);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--cw-blue) 13%, transparent);
        }

        .cw-check-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
        }

        .cw-check {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 8px 9px;
          background: color-mix(in srgb, var(--panel) 85%, black);
          color: var(--muted);
          font-size: 11px;
        }

        .cw-check input {
          accent-color: var(--cw-blue);
        }

        .cw-actions {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
          margin-top: 14px;
        }

        .cw-primary,
        .cw-secondary {
          padding: 10px 14px;
        }

        .cw-primary {
          color: white;
          border-color: transparent;
          background: linear-gradient(135deg, var(--cw-violet), var(--cw-blue));
        }

        .cw-secondary {
          color: var(--muted);
          background: color-mix(in srgb, var(--panel) 90%, black);
        }

        .cw-primary:disabled {
          opacity: .42;
          cursor: not-allowed;
        }

        .cw-result {
          border-color: color-mix(in srgb, var(--cw-cyan) 45%, var(--line));
        }

        .cw-result.error {
          border-color: var(--red, #ff5e75);
        }

        .cw-result-head {
          margin-bottom: 12px;
          color: var(--ink);
        }

        .cw-result-head small {
          color: var(--muted);
          font: inherit;
        }

        .cw-result h4 {
          margin-bottom: 10px;
          font-size: 17px;
        }

        .cw-result p {
          color: var(--muted);
          font-size: 12px;
          line-height: 1.6;
        }

        .cw-result strong {
          color: var(--ink);
        }

        .cw-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          margin: 14px 0;
        }

        .cw-metrics > div {
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 10px;
          background: color-mix(in srgb, var(--bg) 72%, transparent);
          display: grid;
          gap: 5px;
        }

        .cw-metrics span {
          color: var(--muted);
        }

        .cw-metrics b {
          color: var(--ink);
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .cw-quote {
          padding-left: 12px;
          border-left: 2px solid var(--cw-blue);
          color: color-mix(in srgb, var(--cw-cyan) 66%, var(--ink)) !important;
        }

        .cw-footnote {
          font-size: 10px !important;
          opacity: .75;
        }

        .cw-spell-sigil {
          height: 86px;
          margin: 2px 0 12px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          color: var(--cw-cyan);
          font-size: 28px;
          text-shadow: 0 0 18px color-mix(in srgb, var(--cw-cyan) 35%, transparent);
        }

        .cw-spell-sigil span:nth-child(2) {
          font-size: 48px;
          color: var(--cw-violet);
        }

        .cw-hat {
          width: 190px;
          height: 116px;
          margin: 18px auto 2px;
          position: relative;
        }

        .cw-hat-body {
          position: absolute;
          width: 92px;
          height: 70px;
          left: 49px;
          bottom: 20px;
          border: 1px solid color-mix(in srgb, var(--cw-blue) 36%, var(--line));
          border-radius: 10px 10px 28px 28px;
          background: linear-gradient(180deg,
            color-mix(in srgb, var(--panel) 75%, black),
            color-mix(in srgb, var(--cw-blue) 16%, black)
          );
          transform: perspective(80px) rotateX(-4deg);
        }

        .cw-hat-brim {
          position: absolute;
          width: 172px;
          height: 28px;
          left: 9px;
          bottom: 7px;
          border: 1px solid color-mix(in srgb, var(--cw-blue) 35%, var(--line));
          border-radius: 50%;
          background: color-mix(in srgb, var(--panel) 75%, black);
          z-index: 2;
        }

        .cw-hat-stars {
          position: absolute;
          left: 50%;
          top: 0;
          width: max-content;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          color: var(--cw-cyan);
          transform: translateX(-50%);
          animation: cwFloat 2.8s ease-in-out infinite;
        }

        @keyframes cwFloat {
          0%,100% { transform: translateX(-50%) translateY(4px); opacity: .65; }
          50% { transform: translateX(-50%) translateY(-5px); opacity: 1; }
        }

        .cw-big-clue {
          border: 1px dashed color-mix(in srgb, var(--cw-cyan) 50%, var(--line));
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          color: var(--ink);
          font-weight: 800;
          font-size: 16px;
          background: color-mix(in srgb, var(--cw-blue) 6%, transparent);
        }

        .cw-timeline {
          margin-top: 14px;
          display: grid;
          gap: 8px;
        }

        .cw-event {
          display: grid;
          grid-template-columns: auto 82px 1fr;
          gap: 10px;
          align-items: center;
          padding: 10px;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: color-mix(in srgb, var(--panel) 82%, black);
        }

        .cw-event input {
          accent-color: var(--cw-blue);
        }

        .cw-event-time {
          color: var(--cw-cyan);
        }

        .cw-event-text {
          color: var(--ink);
          font-size: 12px;
        }

        .cw-empty {
          border: 1px dashed var(--line);
          border-radius: 10px;
          padding: 18px;
          text-align: center;
          color: var(--muted);
          font-size: 12px;
        }

        .cw-curtain-window {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin: 12px 0 16px;
          font: 900 clamp(22px, 4vw, 38px)/1 ui-monospace, SFMono-Regular, Consolas, monospace;
          color: var(--cw-cyan);
          text-shadow: 0 0 20px color-mix(in srgb, var(--cw-cyan) 18%, transparent);
        }

        .cw-curtain-window b {
          color: var(--cw-violet);
        }

        .cw-fact-list {
          color: var(--muted);
          font-size: 12px;
          line-height: 1.6;
          padding-left: 20px;
        }

        .cw-fact-list b {
          color: var(--cw-cyan);
        }

        @media (max-width: 900px) {
          .cw-tabs {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .cw-check-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .cw-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .cw-module {
            padding: 10px;
          }
          .cw-hero {
            align-items: flex-start;
          }
          .cw-sigil {
            width: 62px;
            height: 62px;
          }
          .cw-grid,
          .cw-tabs {
            grid-template-columns: 1fr;
          }
          .cw-full {
            grid-column: auto;
          }
          .cw-check-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .cw-metrics {
            grid-template-columns: 1fr;
          }
          .cw-event {
            grid-template-columns: auto 64px 1fr;
          }
          .cw-curtain-window {
            gap: 8px;
          }
        }
      `;

      document.head.appendChild(style);

      navButton = document.createElement("button");
      navButton.type = "button";
      navButton.className = "mode-tab";
      navButton.textContent = "WORKSHOP";
      navButton.dataset.specialModule = "celestian-workshop";
      navButton.addEventListener("click", open);
      runtime.mounts.navigation.appendChild(navButton);

      panel = document.createElement("section");
      panel.className = "cw-module";
      panel.hidden = true;
      panel.setAttribute("aria-label", "Celestian's Workshop");
      runtime.mounts.content.appendChild(panel);

      renderShell();
      refreshIdentity();

      return this;
    },

    open,
    close,

    isOpen() {
      return !!panel && !panel.hidden;
    },

    onIdentityChange() {
      refreshIdentity();
    },

    destroy() {
      if (panel && !panel.hidden) {
        runtime?.leaveSpecialMode?.();
      }

      navButton?.remove();
      panel?.remove();
      style?.remove();

      runtime = null;
      navButton = null;
      panel = null;
      style = null;
      activeTab = "trick";
      state.abracadabraUsed = false;
      state.curtainCallUsed = false;
      state.miaOpen = false;

      return true;
    }
  };
})();
