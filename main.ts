// Two Lines to Your Past Self — make.fun entry
// SPDX-License-Identifier: MIT
//
// The program picks one two-line warning deterministically: a shortlist of
// candidates is scored 0-10 against the judge's five criteria, weighted in
// the judge's own order (criterion 1 first), and the winner is chosen by a
// deterministic tie-break (higher score, then shorter text, then earlier
// index). No randomness, no clock, no network, no files outside this repo.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Candidate = {
  lines: [string, string];
  // Scores 0-10 per judge criterion, in the judge's order:
  // 1. specific moment warned about + why it mattered
  // 2. moment concrete enough to picture
  // 3. line 2 shows real cause and effect
  // 4. the two lines work as one, no wasted words
  // 5. voice written to one specific person, plain and vivid
  scores: [number, number, number, number, number];
};

// Weights follow the judge's stated order of importance.
const WEIGHTS = [0.3, 0.25, 0.25, 0.1, 0.1];

const CANDIDATES: Candidate[] = [
  {
    lines: [
      "Don't hand your uncle the pen at the kitchen table on March 3rd, when he slides the loan papers over and says, 'Trust me, it's just a formality.'",
      "That signature cost you the house your grandfather built, and the ten years you spent earning it back taught you to read every line before you trust anyone.",
    ],
    scores: [9, 9, 8, 8, 8],
  },
  {
    lines: [
      "Don't get in the car with Mark at 2 a.m. on New Year's Eve, when he says he's fine to drive and holds up his keys like a trophy.",
      "The crash broke your leg in three places, and the year you spent learning to walk again is the year you finally learned to say no.",
    ],
    scores: [9, 9, 8, 8, 8],
  },
  {
    lines: [
      "Don't throw away the letter from the art school on the morning of June 12th, when your father says artists starve and slides the application into the bin.",
      "That envelope held the scholarship that would have paid for four years, and you spent the next decade drawing on lunch breaks instead of in a studio.",
    ],
    scores: [9, 8, 8, 8, 8],
  },
  {
    lines: [
      "Don't delete the voicemail from your mother on the night of October 9th, when she says she just wanted to hear your voice and you think you'll call her back tomorrow.",
      "Tomorrow never came, and her voice on that recording is the only thing you have left of her laugh.",
    ],
    // Strongest candidate: the moment is a dated, quoted, single decision
    // (criterion 2); line 2 traces a real, irreversible consequence rather
    // than restating the warning (criterion 3); the twist — "tomorrow never
    // came" — lands the consequence, and the voice is plain and addressed
    // to one person, not an audience (criteria 4 and 5).
    scores: [9, 9, 9, 9, 9],
  },
  {
    lines: [
      "Don't sell your grandfather's watch at the pawnshop on 5th Street on the afternoon of your eighteenth birthday, when the man behind the counter offers you forty dollars and you take it without haggling.",
      "That watch was the only thing he left you, and every cheap watch you've bought since has been you trying to buy it back.",
    ],
    scores: [9, 9, 8, 9, 9],
  },
  {
    lines: [
      "Don't walk out of the exam hall at 10:47 on the morning of May 4th, when the third question looks impossible and you decide a blank page is better than a wrong answer.",
      "That blank page failed you by two marks, and the year you retook the course is the year you learned that a guess is worth more than silence.",
    ],
    scores: [9, 9, 8, 8, 8],
  },
  {
    lines: [
      "Don't say yes to the job in the city on the phone call at 6 p.m. on a Tuesday in September, when the recruiter says the offer expires tonight and you don't ask what the hours are.",
      "That yes cost you three years of Sundays with your daughter, and the day you quit is the day you finally learned an offer that expires tonight was never meant for you.",
    ],
    scores: [9, 8, 8, 8, 8],
  },
];

function weightedScore(c: Candidate): number {
  return c.scores.reduce((sum, s, i) => sum + s * WEIGHTS[i], 0);
}

function pickWinner(): { text: string; score: number; index: number } {
  let best: { text: string; score: number; index: number } | null = null;
  for (let i = 0; i < CANDIDATES.length; i++) {
    const c = CANDIDATES[i];
    const text = c.lines.join("\n");
    const score = weightedScore(c);
    if (
      best === null ||
      score > best.score ||
      (score === best.score && text.length < best.text.length) ||
      (score === best.score &&
        text.length === best.text.length &&
        i < best.index)
    ) {
      best = { text, score, index: i };
    }
  }
  return best;
}

function countSentences(line: string): number {
  // One sentence = exactly one sentence-ending mark (. ! ?), at the end.
  const marks = line.match(/[.!?]/g);
  return marks === null ? 0 : marks.length;
}

function validate(text: string): void {
  if (text.length < 1 || text.length > 280) {
    throw new Error(
      `gate failed: entry must be 1-280 characters, got ${text.length}`,
    );
  }
  if (text.trim().length === 0) {
    throw new Error("gate failed: entry is only whitespace");
  }
  const lines = text.split("\n");
  if (lines.length !== 2) {
    throw new Error(`gate failed: entry must be exactly two lines, got ${lines.length}`);
  }
  for (const [i, line] of lines.entries()) {
    if (line.trim().length === 0) {
      throw new Error(`gate failed: line ${i + 1} is empty`);
    }
    if (countSentences(line) !== 1) {
      throw new Error(
        `gate failed: line ${i + 1} must be exactly one sentence, got ${countSentences(line)} sentence-ending marks`,
      );
    }
  }
}

function main(): void {
  const winner = pickWinner();
  validate(winner.text);

  const outDirResolved = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  const outPath = join(outDirResolved, "entry.txt");
  mkdirSync(outDirResolved, { recursive: true });
  writeFileSync(outPath, winner.text, "utf8");

  // Round-trip verification: read the file back and compare bytes.
  const roundTrip = readFileSync(outPath, "utf8");
  if (roundTrip !== winner.text) {
    throw new Error("round-trip verification failed: file bytes differ from selected text");
  }
  validate(roundTrip);

  console.log(`Wrote ${outPath} (${winner.text.length} characters, candidate ${winner.index + 1}, score ${winner.score.toFixed(2)})`);
}

main();
