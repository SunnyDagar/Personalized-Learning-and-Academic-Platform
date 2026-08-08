import { FlashcardDeck } from './flashcard_engine.ts';
import type { Card } from './flashcard_engine.ts';

// Simple test helper functions to replace external test runners
function assertEqual(actual: any, expected: any, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`FAILED: ${message} | Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)}`);
  }
  console.log(`PASSED: ${message}`);
}

export function runFlashcardTests() {
  console.log('--- Running Flashcard Engine Tests ---');

  // Test 1: Flip operations
  const cards: Card[] = [
    { front: 'What is 2+2?', back: '4', flipped: false },
    { front: 'What is the capital of France?', back: 'Paris' },
  ];
  const deck = new FlashcardDeck(cards);

  assertEqual(deck.flip(0), true, 'Flip valid card index 0');
  assertEqual(deck.all[0].flipped, true, 'Card 0 should be flipped');
  assertEqual(deck.flip(0), true, 'Flip valid card index 0 back');
  assertEqual(deck.all[0].flipped, false, 'Card 0 should be unflipped');

  // Test 2: Out-of-bounds guards
  assertEqual(deck.flip(-1), false, 'Flip invalid negative index');
  assertEqual(deck.flip(99), false, 'Flip invalid out-of-bounds index');

  // Test 3: Empty deck handling
  const emptyDeck = new FlashcardDeck([]);
  assertEqual(emptyDeck.all, [], 'Empty deck returns empty array');
  assertEqual(emptyDeck.flip(0), false, 'Flip on empty deck returns false');
  assertEqual(emptyDeck.shuffle(), [], 'Shuffle on empty deck returns empty array');

  // Test 4: Malformed input guards
  const malformedInput = [
    { front: 'Valid Front', back: 'Valid Back' },
    null as unknown as Card,
    { front: 123 } as unknown as Card,
  ];
  const guardedDeck = new FlashcardDeck(malformedInput);
  assertEqual(guardedDeck.all.length, 1, 'Filters out invalid/null cards');
  assertEqual(guardedDeck.all[0].front, 'Valid Front', 'Retains valid card');

  // Test 5: Shuffle retention
  const shuffleDeck = new FlashcardDeck([
    { front: 'Q1', back: 'A1' },
    { front: 'Q2', back: 'A2' },
  ]);
  const shuffled = shuffleDeck.shuffle();
  assertEqual(shuffled.length, 2, 'Shuffled deck retains card count');

  console.log('--- All Flashcard Tests Passed Successfully! ---');
}

// Run tests when executed
runFlashcardTests();