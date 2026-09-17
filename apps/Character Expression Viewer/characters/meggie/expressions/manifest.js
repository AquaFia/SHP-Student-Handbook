/* EXPRESSION MANIFEST
   Add image filenames between the backticks, ONE filename per line.
   The first line becomes slot 01, the second slot 02, through slot 20.
   Filenames can use any naming system. Do not add paths.
*/
window.EXPRESSION_FILES = `
meggie_expression_01.webp
meggie_expression_02.webp
meggie_expression_03.webp
meggie_expression_04.webp
meggie_expression_05.webp
meggie_expression_06.webp
meggie_expression_07.webp
meggie_expression_08.webp
meggie_expression_09.webp
meggie_expression_10.webp
meggie_expression_11.webp
meggie_expression_12.webp
meggie_expression_13.webp
`.trim().split(/\r?\n/).map(s => s.trim()).filter(Boolean);
