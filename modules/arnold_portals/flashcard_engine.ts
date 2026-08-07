// Interactive flashcard engine (starter). Cards come from POST /flashcards/generate → {cards:[{front,back}]}
export interface Card { front: string; back: string; flipped?: boolean; }

export class FlashcardDeck {
  private cards: Card[];

  constructor(cards: Card[] = []) {
    // Guard against malformed card list (null, undefined, or invalid objects)
    if (!Array.isArray(cards)) {
      this.cards = [];
      return;
    }

    this.cards = cards.filter(
      (c) => c && typeof c.front === 'string' && typeof c.back === 'string'
    );
  }

  flip(i: number): boolean {
    // Guard against empty deck or out-of-bound index access
    if (i < 0 || i >= this.cards.length || !this.cards[i]) {
      return false;
    }
    this.cards[i].flipped = !this.cards[i].flipped;
    return true;
  }

  get all(): Card[] {
    return this.cards;
  }

  shuffle(): Card[] {
    if (this.cards.length <= 1) {
      return this.cards;
    }
    this.cards.sort(() => Math.random() - 0.5);
    return this.cards;
  }
}