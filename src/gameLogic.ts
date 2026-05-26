import { Card, CardValue, Color, GameState, Player, GameEvent } from './types';

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

function drawCards(drawPile: Card[], discardPile: Card[], count: number): { cards: Card[]; drawPile: Card[]; discardPile: Card[] } {
  let dp = [...drawPile];
  let dcp = [...discardPile];
  const cards: Card[] = [];
  for (let i = 0; i < count; i++) {
    if (dp.length === 0) {
      const reshuffled = shuffle(dcp.slice(0, -1));
      dcp = [dcp[dcp.length - 1]];
      dp = reshuffled;
    }
    if (dp.length > 0) cards.push(dp.pop()!);
  }
  return { cards, drawPile: dp, discardPile: dcp };
}

export function initGame(players: Player[]): GameState {
  const deck = createDeck();
  const hands: Card[][] = players.map(() => []);
  for (let i = 0; i < 7; i++) {
    for (let p = 0; p < players.length; p++) {
      if (deck.length) hands[p].push(deck.pop()!);
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
    lastEvent: { type: 'turn', player: updatedPlayers[0].name },
  };
}

export function isPlayable(card: Card, topCard: Card, currentColor: Color): boolean {
  if (card.color === 'wild') return true;
  if (card.color === currentColor) return true;
  if (card.value === topCard.value) return true;
  return false;
}

export function applyPlay(state: GameState, cardId: string, chosenColor?: Color): GameState {
  const player = state.players[state.currentPlayerIndex];
  const cardIdx = player.hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) return state;
  const card = player.hand[cardIdx];
  const topCard = state.discardPile[state.discardPile.length - 1];
  if (!isPlayable(card, topCard, state.currentColor)) return state;

  const newHand = player.hand.filter((_, i) => i !== cardIdx);
  let newDiscard = [...state.discardPile, card];
  let newDraw = [...state.drawPile];
  let newDirection = state.direction;
  const newColor: Color = card.color === 'wild' ? (chosenColor ?? 'red') : card.color;
  let newCurrentIndex = state.currentPlayerIndex;
  const n = state.players.length;
  const step = state.direction === 'clockwise' ? 1 : -1;
  let event: GameEvent = { type: 'play', player: player.name, card };

  if (card.value === 'reverse') {
    newDirection = state.direction === 'clockwise' ? 'counterclockwise' : 'clockwise';
    event = { type: 'reverse' };
    if (n === 2) {
      newCurrentIndex = state.currentPlayerIndex;
    } else {
      newCurrentIndex = (state.currentPlayerIndex + (newDirection === 'clockwise' ? 1 : -1) + n) % n;
    }
  } else if (card.value === 'skip') {
    const skippedIdx = (state.currentPlayerIndex + step + n) % n;
    newCurrentIndex = (skippedIdx + step + n) % n;
    event = { type: 'skip', player: state.players[skippedIdx].name };
  } else if (card.value === 'draw2') {
    const targetIdx = (state.currentPlayerIndex + step + n) % n;
    const targetPlayer = state.players[targetIdx];
    const { cards, drawPile, discardPile } = drawCards(newDraw, newDiscard, 2);
    newDraw = drawPile;
    newDiscard = discardPile;
    const updatedPlayers = state.players.map((p, i) => {
      if (i === state.currentPlayerIndex) return { ...p, hand: newHand };
      if (i === targetIdx) return { ...p, hand: [...targetPlayer.hand, ...cards] };
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
      lastEvent: { type: 'draw2', target: targetPlayer.name },
    };
  } else if (card.value === 'wild4') {
    const targetIdx = (state.currentPlayerIndex + step + n) % n;
    const targetPlayer = state.players[targetIdx];
    const { cards, drawPile, discardPile } = drawCards(newDraw, newDiscard, 4);
    newDraw = drawPile;
    newDiscard = discardPile;
    const updatedPlayers = state.players.map((p, i) => {
      if (i === state.currentPlayerIndex) return { ...p, hand: newHand };
      if (i === targetIdx) return { ...p, hand: [...targetPlayer.hand, ...cards] };
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
      lastEvent: { type: 'wild4', target: targetPlayer.name, color: newColor },
    };
  } else {
    newCurrentIndex = (state.currentPlayerIndex + step + n) % n;
  }

  if (card.color === 'wild') {
    event = { type: 'colorChange', color: newColor };
  }

  const updatedPlayers = state.players.map((p, i) =>
    i === state.currentPlayerIndex ? { ...p, hand: newHand } : p
  );

  const nextPlayer = updatedPlayers[newCurrentIndex];
  const finalEvent: GameEvent = newHand.length === 0
    ? { type: 'win', player: player.name }
    : card.color === 'wild'
      ? { type: 'colorChange', color: newColor }
      : event;

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
    lastEvent: finalEvent,
  };
}

export function applyDraw(state: GameState): GameState {
  const { cards, drawPile, discardPile } = drawCards(state.drawPile, state.discardPile, 1);
  const n = state.players.length;
  const step = state.direction === 'clockwise' ? 1 : -1;
  const drawnCard = cards[0];
  if (!drawnCard) return state;

  const updatedPlayers = state.players.map((p, i) =>
    i === state.currentPlayerIndex ? { ...p, hand: [...p.hand, drawnCard] } : p
  );
  const newCurrentIndex = (state.currentPlayerIndex + step + n) % n;

  return {
    ...state,
    players: updatedPlayers,
    currentPlayerIndex: newCurrentIndex,
    drawPile,
    discardPile,
    lastEvent: { type: 'draw', player: state.players[state.currentPlayerIndex].name, count: 1 },
  };
}
