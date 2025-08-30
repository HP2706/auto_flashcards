#!/usr/bin/env node
// Minimal test for the extractSection regex used in src/lib/cards.ts

function extractSection(md, header) {
  const re = new RegExp(
    String.raw`^##\s*${header}\s*\r?\n([\s\S]*?)(?=\r?\n##\s|(?![\s\S]))`,
    'm'
  );
  const m = md.match(re);
  return m ? m[1].trim() : undefined;
}

function assert(cond, msg) {
  if (!cond) {
    console.error('Assertion failed:', msg);
    process.exit(1);
  }
}

// Fixture with multiline Back, blank lines, inline and block math
const md = `# LaTeX Demo Card

## Front
Render the following matrix and aligned equations: $A \\in R^{n \\times m}$

## Back
We restate the expressions with more LaTeX constructs: 


jjjjjjjj
$B \\in R^{n \\times m}$

\\( \\det\\begin{bmatrix}a & b \\\\ c & d\\end{bmatrix} = ad - bc \\)

$$\\det\\begin{bmatrix}a & b \\ c & d\\end{bmatrix} = ad - bc$$

$$
\\begin{bmatrix}
I & B \\
0 & C
\\end{bmatrix}
\\begin{bmatrix}
\\mathbf{x} \\
\\mathbf{y}
\\end{bmatrix}
=
\\begin{bmatrix}
\\mathbf{b}_1 \\
\\mathbf{b}_2
\\end{bmatrix}
$$

$$
\\int_0^1 x^2\\,dx = \\frac{1}{3}
$$
`;

const front = extractSection(md, 'Front');
const back = extractSection(md, 'Back');

assert(front && front.includes('matrix'), 'Front should include text');
assert(back && back.includes('We restate the expressions'), 'Back starts');
assert(back.includes('jjjjjjjj'), 'Back retains middle plain text line');
assert(back.includes('$B \\in R^{n \\times m}$'), 'Back retains inline math on a separate line');
assert(back.includes('begin{bmatrix}') && back.includes('end{bmatrix}'), 'Back contains block matrix LaTeX');
assert(back.trim().endsWith('$$'), 'Back should include trailing display math block end');

console.log('extractSection tests passed.');

