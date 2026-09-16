/* EXPRESSION MANIFEST
   Add image filenames between the backticks, ONE filename per line.
   The first line becomes slot 01, the second slot 02, through slot 20.
   Filenames can use any naming system. Do not add paths.
*/
window.EXPRESSION_FILES = `
hikari_expression_01.webp
hikari_expression_02.webp
hikari_expression_03.webp
hikari_expression_04.webp
hikari_expression_05.webp
hikari_expression_06.webp
hikari_expression_07.webp
hikari_expression_08.webp
hikari_expression_09.webp
hikari_expression_10.webp
hikari_expression_11.webp
hikari_expression_12.webp
`.trim().split(/\r?\n/).map(s => s.trim()).filter(Boolean);
