/* =========================================================
   JACEY COMPANION — CHARACTER DEFINITION
   ========================================================= */

(function () {
  "use strict";

  const definition = {
    id: "jace",
    defaultIdentity: "jace",

    services: {
      awarenessCompanionId: "jacey",
      visualContextCompanionId: "jacey",
      messageBankCompanion: "Jacey"
    },

    memory: {
      fileName: "jacey_memory.json"
    },

    startup: {
      fallbackMessage:
        "Connection established! I checked the handshake, the checksum, and one thing I was apparently not supposed to check. Everything looks great! :D",

      fallbackExpression: "happy"
    },

    expressions: {
      genericFallback: "curious",
      glitch: "clue",
      episodeSelection: "overshare"
    },

    companionModeLabel: "COMPANION MODE",

    idle: {
      minMs: 45000,
      maxMs: 90000
    },

    episode: {
      selectionPrompt:
        "Oh! I have lots of ideas about that. Which one should we talk about?",

      offerPromptTemplate:
        "Oh! I have more thoughts about {trigger}. Do you want the long version?"
    },

    identities: {
      jace: {
        keyphrase: "the present is safe.",
        name: "Jacey “Jace” Cosmo",
        shortName: "Jace",
        talent: "Ultimate Cryptologist",
        initials: "JC",

        brand: "COSMO//LINK",
        brandSubtitle: "COMPANION TERMINAL",
        channelTitle: "ENCRYPTED COMPANION CHANNEL",
        channelLine: "channel: jace.private // integrity verified",

        speakerLabel: "JACE // VERIFIED",
        typingLabel: "JACE // DECRYPTING",
        botStamp: "AES-256-ish",
        placeholder: "Message Jace…",
        dossierTitle: "CLASSIFIED // JACE",

        status: "DEFAULT_HAPPY",

        responseMode: "expression",
        fallbackExpression: "curious",

        episodeAbandon: {
          expression: "happy",
          message: "Okay! We can leave that conversation there."
        },

        switchMessage:
          "Identity restored. Present-time profile verified. Hi again! :D",

        quickReplies: [
          "Can you decode this?",
          "Tell me about yourself",
          "This is private.",
          "Did you find a contradiction?"
        ],

        dossier:
          'SUBJECT: JACEY COSMO<br>' +
          'TALENT: ULTIMATE CRYPTOLOGIST<br>' +
          'ACTIVE IDENTITY: JACE<br>' +
          'STATUS: <span class="ok">PRESENT-TIME PROFILE VERIFIED</span><br>' +
          'THREAT MODEL: <span class="warning">ACCIDENTAL DATA BREACH</span><br>' +
          'FILTER BETWEEN THOUGHT & SPEECH: <span class="warning">NOT FOUND</span>',

        coreBelief:
          "Every mystery deserves to be solved, even the one wearing my name.",

        transitionLabel: "PRESENT-TIME PROFILE VERIFIED",

        colors: {
          bg: "#08070d",
          panel: "#10101a",
          panel2: "#151426",
          ink: "#f4efff",
          muted: "#9b95b5",
          accent: "#a970ff",
          secondary: "#6d4aff",
          sigilAccent: "#d62952",
          danger: "#d62952",
          cyan: "#c39cff",
          line: "#38244f"
        }
      },

      mao: {
        keyphrase: "the wolf is listening.",
        name: "Mao Fushimi",
        shortName: "Mao",
        talent: "Fenrir Operative",
        initials: "MF",

        brand: "FENRIR//ECHO",
        brandSubtitle: "LISTENING NODE",
        channelTitle: "COVERT OBSERVATION CHANNEL",
        channelLine: "channel: mao.black // passive surveillance active",

        speakerLabel: "MAO // MASK VERIFIED",
        typingLabel: "MAO // ASSESSING",
        botStamp: "FENRIR-OBSCURA",
        placeholder: "Speak carefully…",
        dossierTitle: "RESTRICTED // MAO FUSHIMI",

        status: "WOLF_SIGNAL_ACTIVE",

        responseMode: "text",
        fallbackExpression: "deadpan",

        episodeAbandon: null,

        switchMessage:
          "The listening post is active. Choose your words carefully.",

        quickReplies: [
          "Who is listening?",
          "What did you notice?",
          "Assess the situation.",
          "This stays off-record."
        ],

        dossier:
          'SUBJECT: MAO FUSHIMI<br>' +
          'AFFILIATION: FENRIR<br>' +
          'ACTIVE IDENTITY: MAO<br>' +
          'ACCESS: <span class="warning">COMPARTMENTALIZED</span><br>' +
          'OBSERVATION MODE: PASSIVE<br>' +
          'DISCLOSURE POLICY: MINIMUM NECESSARY',

        coreBelief:
          "Truth is only useful if you survive long enough to protect it.",

        transitionLabel: "FENRIR NODE ONLINE",

        colors: {
          bg: "#090304",
          panel: "#160708",
          panel2: "#210a0c",
          ink: "#fff0f0",
          muted: "#b18b8e",
          accent: "#8f1d27",
          secondary: "#4e0d13",
          sigilAccent: "#d94a57",
          danger: "#d94a57",
          cyan: "#e07a83",
          line: "#512027"
        }
      },

      naoya: {
        keyphrase: "the stars demand an answer.",
        name: "Naoya Takahoshi",
        shortName: "Naoya",
        talent: "Cryptologist Alias",
        initials: "NT",

        brand: "NOVA//ARCHIVE",
        brandSubtitle: "ANALYTICAL INTERFACE",
        channelTitle: "CELESTIAL ANALYSIS CHANNEL",
        channelLine: "channel: naoya.signal // pattern lock acquired",

        speakerLabel: "NAOYA // ALIAS VERIFIED",
        typingLabel: "NAOYA // CALCULATING",
        botStamp: "STAR-MAP-09",
        placeholder: "Submit a question…",
        dossierTitle: "SEALED // NAOYA TAKAHOSHI",

        status: "CONSTELLATION_LOCK",

        responseMode: "text",
        fallbackExpression: "curious",

        episodeAbandon: null,

        switchMessage:
          "Alias accepted. The pattern is visible now. Ask your question.",

        quickReplies: [
          "Analyze this pattern.",
          "What is inconsistent?",
          "Trace the signal.",
          "Give me the precise answer."
        ],

        dossier:
          'SUBJECT: NAOYA TAKAHOSHI<br>' +
          'ROLE: ANALYTICAL ALIAS<br>' +
          'ACTIVE IDENTITY: NAOYA<br>' +
          'PATTERN STATE: <span class="ok">LOCKED</span><br>' +
          'OBSERVATION BIAS: DETAIL-FIRST<br>' +
          'EMOTIONAL DISCLOSURE: RESTRICTED',

        coreBelief:
          "A secret that can survive being revealed was always worth testing.",

        transitionLabel: "CELESTIAL PROFILE LOCATED",

        colors: {
          bg: "#031011",
          panel: "#071b1c",
          panel2: "#0b2729",
          ink: "#eaffff",
          muted: "#86aeb0",
          accent: "#20a6a3",
          secondary: "#126568",
          sigilAccent: "#73e6df",
          danger: "#c34c70",
          cyan: "#73e6df",
          line: "#1f5558"
        }
      }
    },

    identityAwareness: {
      jace: {
        mao:
          "...Mao was here, wasn’t he? He leaves the interface much quieter than I do.",
        naoya:
          "Naoya left very tidy notes. Suspiciously tidy."
      },

      mao: {
        jace:
          "The present profile has been suspended.",
        naoya:
          "The analyst yielded the channel."
      },

      naoya: {
        jace:
          "Jace left more context than necessary. It remains useful.",
        mao:
          "The observation profile has released control."
      }
    },

    missingBankGuidance: {
      jace: [
        [
          "clue",
          "The cipher tools are ready, but my Notion dialogue archive did not load. Refresh after checking the companions Worker."
        ],
        [
          "happy",
          "I can tell you everything the message bank knows about me once the Notion dialogue archive finishes loading."
        ],
        [
          "overshare",
          "Private channel confirmed! My Notion dialogue archive is unavailable right now. Refresh after checking the companions Worker."
        ],
        [
          "deadpan",
          "Contradiction found: you asked me a question before my Notion dialogue data loaded. Refresh after checking the companions Worker."
        ]
      ],

      mao: [
        [
          "deadpan",
          "Listener records are unavailable because the Notion dialogue archive did not load. Refresh after checking the companions Worker."
        ],
        [
          "clue",
          "Observation archive missing. Refresh after checking the companions Worker."
        ],
        [
          "panic",
          "Assessment cannot proceed because the Notion dialogue archive is unavailable. Refresh after checking the companions Worker."
        ],
        [
          "deadpan",
          "Off-record protocol acknowledged. The Notion dialogue archive is unavailable. Refresh after checking the companions Worker."
        ]
      ],

      naoya: [
        [
          "clue",
          "Pattern analysis requires the Notion dialogue archive. Refresh after checking the companions Worker."
        ],
        [
          "deadpan",
          "The inconsistency is the unavailable Notion message bank. Refresh after checking the companions Worker."
        ],
        [
          "curious",
          "The signal trace ends at the unavailable Notion dialogue archive. Refresh after checking the companions Worker."
        ],
        [
          "deadpan",
          "Precise answer: the Notion dialogue archive is unavailable. Refresh after checking the companions Worker."
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
