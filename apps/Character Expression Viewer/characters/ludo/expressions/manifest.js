/* EXPRESSION MANIFEST
   Add image filenames between the backticks, ONE filename per line.
   The first line becomes slot 01, the second slot 02, through slot 20.
   Filenames can use any naming system. Do not add paths.
*/
window.EXPRESSION_FILES = `
ludo_expression_01.webp
ludo_expression_02.webp
ludo_expression_03.webp
ludo_expression_04.webp
ludo_expression_05.webp
ludo_expression_06.webp
ludo_expression_07.webp
ludo_expression_08.webp
`.trim().split(/\r?\n/).map(s => s.trim()).filter(Boolean);
