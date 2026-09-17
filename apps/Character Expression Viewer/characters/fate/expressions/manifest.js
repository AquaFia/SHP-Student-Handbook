/* EXPRESSION MANIFEST
   Add image filenames between the backticks, ONE filename per line.
   The first line becomes slot 01, the second slot 02, through slot 20.
   Filenames can use any naming system. Do not add paths.
*/
window.EXPRESSION_FILES = `
fate_expression_01.webp
fate_expression_02.webp
fate_expression_03.webp
fate_expression_04.webp
fate_expression_05.webp
fate_expression_06.webp
fate_expression_07.webp
fate_expression_08.webp
fate_expression_09.webp
fate_expression_10.webp
`.trim().split(/\r?\n/).map(s => s.trim()).filter(Boolean);
