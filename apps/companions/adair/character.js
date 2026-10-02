/* =========================================================
   ADAIR NEXUS — SINGLE-IDENTITY COMPANION DEFINITION
   ========================================================= */

(function () {
  "use strict";

  const definition = {
    id: "adair",
    defaultIdentity: "primary",

    services: {
      awarenessCompanionId: "adair",
      visualContextCompanionId: "adair",
      messageBankCompanion: "Adair"
    },

    memory: {
      fileName: "adair_nexus_memory.json"
    },

    startup: {
      fallbackMessage:
        "Oh—hey. Adair here. If you need anything, just ask. And, uh... if you're heading outside, I can check the forecast too.",

      fallbackExpression: "default"
    },

    expressions: {
      genericFallback: "default",
      glitch: "alert",
      episodeSelection: "thinking"
    },

    companionModeLabel: "COMPANION MODE",

    idle: {
      minMs: 45000,
      maxMs: 90000
    },

    episode: {
      selectionPrompt:
        "Which conversation did you want to come back to?",

      offerPromptTemplate:
        "I, um... actually have a little more to say about {trigger}. Want to keep going?"
    },

    identities: {
      primary: {
        keyphrase: "activate adair.",

        name: "Adair Nexus",
        shortName: "Adair",
        talent: "ULTIMATE METEOROLOGIST",
        initials: "AN",

        brand: "ADAIR//FORECAST",
        brandSubtitle: "ATMOSPHERIC COMPANION TERMINAL",
        channelTitle: "ADAIR WEATHER CHANNEL",
        channelLine: "channel: adair // skies monitored // online",

        speakerLabel: "ADAIR // VERIFIED",
        typingLabel: "ADAIR // TYPING",
        botStamp: "ADAIR",
        placeholder: "Message Adair…",
        dossierTitle: "DOSSIER // ADAIR NEXUS",

        status: "SKIES MONITORED",

        responseMode: "expression",
        fallbackExpression: "default",

        episodeAbandon: {
          expression: "default",
          message: "That's okay. We can leave it there. No pressure."
        },

        switchMessage:
          "Adair channel active. Forecast board's ready too, if you need it.",

        quickReplies: [
          "Hey, Adair.",
          "Tell me about meteorology.",
          "What are you thinking about?",
          "This is private."
        ],

        dossier:
          'SUBJECT: ADAIR NEXUS<br>' +
          'ROLE: ULTIMATE METEOROLOGIST<br>' +
          'AGE: 19<br>' +
          'HEIGHT: 5\'8\"<br>' +
          'STATUS: <span class="ok">SKIES MONITORED</span>',

        coreBelief:
          "Most things stop feeling quite so unpredictable once you know what signs to look for—and if I can help someone prepare before things get bad, I should.",

        transitionLabel: "FORECAST PROFILE ACTIVE",

        colors: {
          bg: "#09100d",
          panel: "#111a15",
          panel2: "#18231b",
          ink: "#f3f0df",
          muted: "#a8ad99",
          accent: "#d9ae4a",
          secondary: "#739565",
          sigilAccent: "#8db7c6",
          danger: "#c8654f",
          cyan: "#b7dbe6",
          line: "#40503c"
        }
      }
    },

    identityAwareness: {},

    missingBankGuidance: {
      primary: [
        [
          "alert",
          "Ah—my dialogue archive isn't answering. That's probably a connection problem, not you."
        ],
        [
          "default",
          "The message bank hasn't loaded yet. Sorry. Give the connection a check?"
        ],
        [
          "thinking",
          "I can't reach the dialogue archive right now. I can still stay here while you sort it out."
        ],
        [
          "default",
          "No remote dialogue data came through. That's... inconvenient, but at least we know what failed."
        ]
      ]
    }
  };

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }

    Object.freeze(value);

    for (const item of Object.values(value)) {
      deepFreeze(item);
    }

    return value;
  }

  window.CompanionCharacter = deepFreeze(definition);
})();
