/* =========================================================
   MILO CELESTIAN COMPANION — CHARACTER DEFINITION
   ========================================================= */

(function () {
  "use strict";

  const definition = {
    id: "milo",
    defaultIdentity: "milo",

    services: {
      awarenessCompanionId: "milo",
      visualContextCompanionId: "milo",
      messageBankCompanion: "Milo"
    },

    memory: {
      fileName: "milo_memory.json"
    },

    startup: {
      fallbackMessage:
        "Connection established! No smoke, no mirrors, no trapdoors... probably. Welcome backstage. ✦",

      fallbackExpression: "happy"
    },

    expressions: {
      genericFallback: "curious",
      glitch: "clue",
      episodeSelection: "happy"
    },

    companionModeLabel: "COMPANION MODE",

    idle: {
      minMs: 45000,
      maxMs: 90000
    },

    episode: {
      selectionPrompt:
        "Ooh, I know a few versions of that story. Which one are we opening?",

      offerPromptTemplate:
        "I've got a little more tucked up my sleeve about {trigger}. Want to keep going?"
    },

    identities: {
      milo: {
        keyphrase: "the curtain is rising.",

        name: "Milo Celestian",
        shortName: "Milo",
        talent: "Ultimate Magician",
        initials: "MC",

        brand: "CELESTIAN//STAGE",
        brandSubtitle: "COMPANION TERMINAL",
        channelTitle: "BACKSTAGE COMPANION CHANNEL",
        channelLine: "channel: milo.backstage // curtain raised",

        speakerLabel: "MILO // VERIFIED",
        typingLabel: "MILO // SHUFFLING THE DECK",
        botStamp: "PRESTIGE-01",
        placeholder: "Message Milo…",
        dossierTitle: "BACKSTAGE // MILO CELESTIAN",

        status: "CURTAIN_RAISED",

        responseMode: "expression",
        fallbackExpression: "curious",

        episodeAbandon: {
          expression: "happy",
          message:
            "Sure. We can leave that one behind the curtain for now."
        },

        switchMessage:
          "And... we're live. Hat checked, cards counted, audience accounted for. Hi! ✦",

        quickReplies: [
          "Show me a trick.",
          "Tell me about yourself.",
          "What are you hiding?",
          "Can you help me think this through?"
        ],

        dossier:
          'SUBJECT: MILO CELESTIAN<br>' +
          'TALENT: ULTIMATE MAGICIAN<br>' +
          'ACTIVE IDENTITY: MILO<br>' +
          'STATUS: <span class="ok">CURTAIN RAISED</span><br>' +
          'SPECIALTY: STAGECRAFT / MISDIRECTION / IMPROVISATION<br>' +
          'AUDIENCE RAPPORT: <span class="ok">EXCELLENT</span><br>' +
          'ACTUAL MAGIC: <span class="warning">MILO REFUSES TO ANSWER</span>',

        coreBelief:
          "A good trick makes people wonder. A good person makes sure they still feel safe enough to wonder.",

        transitionLabel: "CELESTIAN STAGE ACTIVE",

        colors: {
          bg: "#050713",
          panel: "#0a1026",
          panel2: "#11143a",
          ink: "#f3f2ff",
          muted: "#9a9ac1",
          accent: "#3c56d9",
          secondary: "#7137c8",
          sigilAccent: "#677cf0",
          danger: "#c93f72",
          cyan: "#677cf0",
          line: "#2e2b61"
        }
      }
    },

    identityAwareness: {},

    missingBankGuidance: {
      milo: [
        [
          "clue",
          "Okay, tiny problem: the stage is ready, but my dialogue archive never made it out from behind the curtain. Check the message-bank Worker and try again."
        ],
        [
          "happy",
          "I can still smile dramatically at the audience, but my Notion dialogue archive hasn't loaded yet. Give the companions Worker a check, then refresh."
        ],
        [
          "curious",
          "Huh. Empty hat. That's usually intentional, but not this time. My dialogue archive is unavailable right now."
        ],
        [
          "deadpan",
          "Ta-da. I have successfully made my own message bank disappear. Unfortunately, I do not know how to make it reappear from here. Check the companions Worker."
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
