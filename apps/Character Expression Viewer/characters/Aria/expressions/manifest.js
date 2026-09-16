/* EXPRESSION MANIFEST
   Add image filenames between the backticks, ONE filename per line.
   The first line becomes slot 01, the second slot 02, through slot 20.
   Filenames can use any naming system. Do not add paths.
*/
window.EXPRESSION_FILES = `
aria_expression_01.webp
aria_expression_02.webp
aria_expression_03.webp
aria_expression_04.webp
aria_expression_05.webp
aria_expression_06.webp
aria_expression_07.webp
aria_expression_08.webp
aria_expression_09.webp
aria_expression_10.webp
aria_expression_11.webp
aria_expression_12.webp
aria_expression_13.webp
aria_expression_14.webp
aria_expression_15.webp
aria_expression_16.webp
aria_expression_17.webp
aria_expression_18.webp
aria_expression_19.webp
aria_expression_20.webp
`.trim().split(/\r?\n/).map(s => s.trim()).filter(Boolean);
