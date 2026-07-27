// Interactive flashcard engine (starter). Cards come from POST /flashcards/generate → {cards:[{front,back}]}
export interface Card { front: string; back: string; flipped?: boolean; }

export class FlashcardDeck {
  constructor(private cards: Card[] = []) {}
  flip(i: number) { this.cards[i].flipped = !this.cards[i].flipped; }
  get all() { return this.cards; }
  shuffle() { this.cards.sort(() => Math.random() - 0.5); return this.cards; }
}
