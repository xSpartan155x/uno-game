import { Card, CardValue, Color, GameState, Player } from './types';

const COLORS: Color[] = ['red', 'green', 'blue', 'yellow'];
const NUMBERS: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const ACTIONS: CardValue[] = ['skip', 'reverse', 'draw2'];

let cardCounter = 0;
const uid = () => `card-${++cardCounter}-${Math.random().toString(36).slice(2)}`;

export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const color of COLORS) {
    deck.push({ id: uid(), color, value: '0' });
    for (const num of NUMBERS.slice(1)) {
      deck.push({ id: uid(), color, value: num });
      deck.push({ id: uid(), color, value: num });
    }
    for (const action of ACTIONS) {
      deck.push({ id: uid(), color, value: action });
      deck.push({ id: uid(), color, value: action });
    }
  }

  for (let i = 0; i < 4; i++) {
    deck.push({ id: uid(), color: 'wild', value: 'wild' });
    deck.push({ id: uid(), color: 'wild', value: 'wild4' });
  }

  return shuffle(deck);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function initGame(players: Player[]): GameState {
  const deck = createDeck();
  const hands: Card[][] = players.map(() => []);

  for (let i = 0; i < 7; i++) {
    for (let p = 0; p < players.length; p++) {
      hands[p].push(deck.pop()!);
    }
  }

  let topCard = deck.pop()!;
  while (topCard.color === 'wild') {
    deck.unshift(topCard);
    topCard = deck.pop()!;
  }

  const updatedPlayers = players.map((p, i) => ({ ...p, hand: hands[i] }));

  return {
    players: updatedPlayers,
    currentPlayerIndex: 0,
    direction: 'clockwise',
    drawPile: deck,
    discardPile: [topCard],
    phase: 'playing',
    currentColor: topCard.color,
    winner: null,
    pendingDraw: 0,
  };
}

export function isPlayable(card: Card, topCard: Card, currentColor: Color): boolean {
  if (card.color === 'wild') return true;
  if (card.color === currentColor) return true;
  if (card.value === topCard.value) return true;
  return false;
}

export function nextPlayerIndex(state: GameState, skip = false): number {
  const n = state.players.length;
  const step = state.direction === 'clockwise' ? 1 : -1;
  let next = (state.currentPlayerIndex + step + n) % n;
  if (skip) next = (next + step + n) % n;
  return next;
}

export function applyPlay(state: GameState, cardId: string, chosenColor?: Color): GameState {
  const player = state.players[state.currentPlayerIndex];
  const cardIdx = player.hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) return state;

  const card = player.hand[cardIdx];
  const topCard = state.discardPile[state.discardPile.length - 1];
  if (!isPlayable(card, topCard, state.currentColor)) return state;

  let newHand = player.hand.filter((_, i) => i !== cardIdx);
  let newDiscard = [...state.discardPile, card];
  let newDraw = [...state.drawPile];
  let newDirection = state.direction;
  let newColor: Color = card.color === 'wild' ? (chosenColor ?? 'red') : card.color;
  let newCurrentIndex = state.currentPlayerIndex;
  let newPendingDraw = state.pendingDraw;
  const n = state.players.length;
  const step = state.direction === 'clockwise' ? 1 : -1;

  if (card.value === 'reverse') {
    newDirection = state.direction === 'clockwise' ? 'counterclockwise' : 'clockwise';
    if (n === 2) {
      newCurrentIndex = state.currentPlayerIndex;
    } else {
      newCurrentIndex = (state.currentPlayerIndex + (newDirection === 'clockwise' ? 1 : -1) + n) % n;
    }
  } else if (card.value === 'skip') {
    newCurrentIndex = (state.currentPlayerIndex + step * 2 + n * 2) % n;
  } else if (card.value === 'draw2') {
    newPendingDraw += 2;
    const targetIdx = (state.currentPlayerIndex + step + n) % n;
    const targetPlayer = state.players[targetIdx];
    let drawnCards: Card[] = [];
    for (let i = 0; i < newPendingDraw; i++) {
      if (newDraw.length === 0) {
        const reshuffled = shuffle(newDiscard.slice(0, -1));
        newDiscard = [newDiscard[newDiscard.length - 1]];
        newDraw = reshuffled;
      }
      drawnCards.push(newDraw.pop()!);
    }
    newPendingDraw = 0;
    const updatedPlayers = state.players.map((p, i) => {
      if (i === state.currentPlayerIndex) return { ...p, hand: newHand };
      if (i === targetIdx) return { ...p, hand: [...targetPlayer.hand, ...drawnCards] };
      return p;
    });
    newCurrentIndex = (targetIdx + step + n) % n;
    return {
      ...state,
      players: updatedPlayers,
      currentPlayerIndex: newCurrentIndex,
      direction: newDirection,
      drawPile: newDraw,
      discardPile: newDiscard,
      currentColor: newColor,
      pendingDraw: 0,
      winner: newHand.length === 0 ? player.name : null,
      phase: newHand.length === 0 ? 'ended' : 'playing',
    };
  } else if (card.value === 'wild4') {
    newPendingDraw += 4;
    const targetIdx = (state.currentPlayerIndex + step + n) % n;
    const targetPlayer = state.players[targetIdx];
    let drawnCards: Card[] = [];
    for (let i = 0; i < newPendingDraw; i++) {
      if (newDraw.length === 0) {
        const reshuffled = shuffle(newDiscard.slice(0, -1));
        newDiscard = [newDiscard[newDiscard.length - 1]];
        newDraw = reshuffled;
      }
      drawnCards.push(newDraw.pop()!);
    }
    newPendingDraw = 0;
    const updatedPlayers = state.players.map((p, i) => {
      if (i === state.currentPlayerIndex) return { ...p, hand: newHand };
      if (i === targetIdx) return { ...p, hand: [...targetPlayer.hand, ...drawnCards] };
      return p;
    });
    newCurrentIndex = (targetIdx + step + n) % n;
    return {
      ...state,
      players: updatedPlayers,
      currentPlayerIndex: newCurrentIndex,
      direction: newDirection,
      drawPile: newDraw,
      discardPile: newDiscard,
      currentColor: newColor,
      pendingDraw: 0,
      winner: newHand.length === 0 ? player.name : null,
      phase: newHand.length === 0 ? 'ended' : 'playing',
    };
  } else {
    newCurrentIndex = (state.currentPlayerIndex + step + n) % n;
  }

  const updatedPlayers = state.players.map((p, i) =>
    i === state.currentPlayerIndex ? { ...p, hand: newHand } : p
  );

  return {
    ...state,
    players: updatedPlayers,
    currentPlayerIndex: newCurrentIndex,
    direction: newDirection,
    drawPile: newDraw,
    discardPile: newDiscard,
    currentColor: newColor,
    pendingDraw: newPendingDraw,
    winner: newHand.length === 0 ? player.name : null,
    phase: newHand.length === 0 ? 'ended' : 'playing',
  };
}

export function applyDraw(state: GameState): GameState {
  let newDraw = [...state.drawPile];
  let newDiscard = [...state.discardPile];

  if (newDraw.length === 0) {
    const reshuffled = shuffle(newDiscard.slice(0, -1));
    newDiscard = [newDiscard[newDiscard.length - 1]];
    newDraw = reshuffled;
  }

  const drawnCard = newDraw.pop()!;
  const n = state.players.length;
  const step = state.direction === 'clockwise' ? 1 : -1;

  const updatedPlayers = state.players.map((p, i) =>
    i === state.currentPlayerIndex ? { ...p, hand: [...p.hand, drawnCard] } : p
  );

  const newCurrentIndex = (state.currentPlayerIndex + step + n) % n;

  return {
    ...state,
    players: updatedPlayers,
    currentPlayerIndex: newCurrentIndex,
    drawPile: newDraw,
    discardPile: newDiscard,
  };
}
