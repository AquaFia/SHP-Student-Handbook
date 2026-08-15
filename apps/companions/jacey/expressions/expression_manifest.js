window.CompanionExpressionManifest = {
  "schema": "companion-expression-manifest",
  "schemaVersion": 1,
  "folder": "expressions",
  "identities": {
    "jace": {
      "defaultExpression": "happy",
      "expressions": [
        {
          "id": "curious",
          "displayName": "Curious",
          "statusLabel": "OPEN_CURIOUS",
          "file": "J_Curious.webp"
        },
        {
          "id": "happy",
          "displayName": "Happy",
          "statusLabel": "DEFAULT_HAPPY",
          "file": "J_Happy.webp",
          "contexts": {
            "birthday": "J_Happy_Birthday.webp"
          }
        },
        {
          "id": "clue",
          "displayName": "Clue",
          "statusLabel": "CLUE_FOUND",
          "file": "J_Clue.webp",
          "contexts": {
            "halloween": "J_Clue_Halloween.webp"
          }
        },
        {
          "id": "deadpan",
          "displayName": "Deadpan",
          "statusLabel": "CONTRADICTION",
          "file": "J_Deadpan.webp"
        },
        {
          "id": "overshare",
          "displayName": "Overshare",
          "statusLabel": "INNOCENT_OVERSHARE",
          "file": "J_Overshare.webp"
        },
        {
          "id": "panic",
          "displayName": "Panic",
          "statusLabel": "DELAYED_PANIC",
          "file": "J_Panic.webp"
        },
        {
          "id": "anger",
          "displayName": "Anger",
          "statusLabel": "TRUTH_ANGER",
          "file": "J_Anger.webp"
        },
        {
          "id": "vulnerable",
          "displayName": "Vulnerable",
          "statusLabel": "MISSING_SELF",
          "file": "J_Vulnerable.webp"
        }
      ]
    },
    "mao": {
      "defaultExpression": null,
      "expressions": []
    },
    "naoya": {
      "defaultExpression": null,
      "expressions": []
    }
  }
};
