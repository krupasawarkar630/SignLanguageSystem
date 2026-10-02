import test from "node:test";
import assert from "node:assert";
import { formatSentence } from "./sentenceBuilder.js";

test("capitalizes the first word and adds a period", () => {
  assert.strictEqual(formatSentence(["hello", "world"]), "Hello, world.");
});

test("capitalizes 'i' correctly", () => {
  assert.strictEqual(formatSentence(["i", "am", "happy"]), "I am happy.");
});

test("adds a comma after greetings", () => {
  assert.strictEqual(formatSentence(["hello", "how", "are", "you"]), "Hello, how are you?");
});

test("adds a question mark for question words", () => {
  assert.strictEqual(formatSentence(["what", "is", "this"]), "What is this?");
  assert.strictEqual(formatSentence(["can", "i", "help"]), "Can I help?");
});

test("handles phrase joining correctly", () => {
  assert.strictEqual(formatSentence(["thank", "you", "so", "much"]), "Thank you so much.");
});

test("handles empty input", () => {
  assert.strictEqual(formatSentence([]), "");
});
