export const GESTURE_TO_WORD_MAP: Record<string, string> = {
  HELLO: "hello",
  THANK_YOU: "thank you",
  PLEASE: "please",
  YES: "yes",
  NO: "no",
  I: "I",
  YOU: "you",
  WHAT: "what",
  HOW: "how",
  ARE: "are",
  GOOD: "good",
  BAD: "bad",
  HELP: "help",
  WATER: "water",
  FOOD: "food",
  LOVE: "love",
};

export const QUICK_PHRASES = [
  "Hello, how are you?",
  "Can you help me?",
  "I need water.",
  "Thank you so much.",
  "What is your name?",
  "I don't understand.",
  "Please repeat that.",
  "Yes, I agree.",
  "No, thank you.",
  "Goodbye!",
];

const QUESTION_WORDS = new Set([
  "who",
  "what",
  "where",
  "when",
  "why",
  "how",
  "can",
  "could",
  "would",
  "should",
  "is",
  "are",
  "do",
  "does",
  "did",
]);

const GREETINGS = new Set(["hello", "hi", "hey"]);

// Rules for joining specific sequences of words
const PHRASE_JOINS: Array<{ sequence: string[]; replacement: string[] }> = [
  { sequence: ["how", "are", "you"], replacement: ["how are you"] },
  { sequence: ["what", "is", "your", "name"], replacement: ["what is your name"] },
  { sequence: ["thank", "you"], replacement: ["thank you"] },
];

/**
 * Applies deterministic grammatical rules to an array of raw words.
 */
export function formatSentence(words: string[]): string {
  if (words.length === 0) return "";

  // 1. Convert to lowercase and apply phrase joining
  let processed = words.map((w) => w.toLowerCase().trim());

  // Apply phrase replacements
  for (const rule of PHRASE_JOINS) {
    let i = 0;
    while (i <= processed.length - rule.sequence.length) {
      let matches = true;
      for (let j = 0; j < rule.sequence.length; j++) {
        if (processed[i + j] !== rule.sequence[j]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        processed.splice(i, rule.sequence.length, ...rule.replacement);
      } else {
        i++;
      }
    }
  }

  // 2. Format tokens
  let sentence = "";
  let isQuestion = false;

  for (let i = 0; i < processed.length; i++) {
    let word = processed[i];

    // Capitalize isolated 'i'
    if (word === "i") word = "I";

    // Detect if sentence is a question based on any prominent question word
    // Splitting by spaces in case it's a joined phrase like "how are you"
    const subwords = word.split(" ");
    for (const sw of subwords) {
      if (QUESTION_WORDS.has(sw)) {
        isQuestion = true;
      }
    }

    // Capitalize first word of the sentence
    if (i === 0) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }

    sentence += word;

    // Add comma after greetings if there are more words
    if (GREETINGS.has(word.toLowerCase()) && i < processed.length - 1) {
      sentence += ",";
    }

    // Add space if not the last word
    if (i < processed.length - 1) {
      sentence += " ";
    }
  }

  // 3. Final punctuation
  if (sentence.length > 0) {
    if (isQuestion) {
      sentence += "?";
    } else {
      sentence += ".";
    }
  }

  return sentence;
}
