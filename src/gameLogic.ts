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

export function isPlayable(card: Card, topCard: Card, currentColor: Color, pendingDraw: number): boolean {
  // If there's a pending draw (stacking scenario), only matching draw cards are playable
  if (pendingDraw > 0) {
    // +2 on the table: can respond with another +2 or +4
    if (topCard.value === 'draw2') {
      return card.value === 'draw2' || card.value === 'wild4';
    }
    // +4 on the table: can respond with another +4
    if (topCard.value === 'wild4') {
      return card.value === 'wild4';
    }
  }
  // Normal play
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
  if (!isPlayable(card, topCard, state.currentColor, state.pendingDraw)) return state;

  const newHand = player.hand.filter((_, i) => i !== cardIdx);
  let newDiscard = [...state.discardPile, card];
  let newDraw = [...state.drawPile];
  let newDirection = state.direction;
  const newColor: Color = card.color === 'wild' ? (chosenColor ?? 'red') : card.color;
  let newCurrentIndex = state.currentPlayerIndex;
  let newPendingDraw = state.pendingDraw;
  const n = state.players.length;
  const step = state.direction === 'clockwise' ? 1 : -1;

  // Stacking: +2 on +2, or +4 on +4
  if (card.value === 'draw2') {
    newPendingDraw += 2;
    const targetIdx = (state.currentPlayerIndex + step + n) % n;
    const targetPlayer = state.players[targetIdx];

    // Check if the target can/will stack — we just add pending and move to them
    // The target will either stack another +2/+4 or be forced to draw
    // For now: accumulate pendingDraw and advance to target
    newCurrentIndex = targetIdx;

    const isStacking = newPendingDraw > state.pendingDraw && state.pendingDraw > 0;
    const event: GameEvent = isStacking
      ? { type: 'draw2', target: targetPlayer.name }
      : { type: 'draw2', target: targetPlayer.name };

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
      lastEvent: { type: 'draw2', target: targetPlayer.name },
    };
  }

  if (card.value === 'wild4') {
    newPendingDraw += 4;
    const targetIdx = (state.currentPlayerIndex + step + n) % n;
    const targetPlayer = state.players[targetIdx];
    newCurrentIndex = targetIdx;

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
      lastEvent: { type: 'wild4', target: targetPlayer.name, color: newColor },
    };
  }

  // If there was a pending draw and the player didn't stack, force them to draw
  // This case is handled by applyDraw — when pendingDraw > 0 and they choose to draw,
  // they draw all pending cards.

  if (card.value === 'reverse') {
    newDirection = state.direction === 'clockwise' ? 'counterclockwise' : 'clockwise';
    if (n === 2) {
      newCurrentIndex = state.currentPlayerIndex;
    } else {
      newCurrentIndex = (state.currentPlayerIndex + (newDirection === 'clockwise' ? 1 : -1) + n) % n;
    }
  } else if (card.value === 'skip') {
    const skippedIdx = (state.currentPlayerIndex + step + n) % n;
    newCurrentIndex = (skippedIdx + step + n) % n;
  } else {
    newCurrentIndex = (state.currentPlayerIndex + step + n) % n;
  }

  let event: GameEvent = { type: 'play', player: player.name, card };
  if (card.value === 'reverse') event = { type: 'reverse' };
  else if (card.value === 'skip') event = { type: 'skip', player: state.players[(state.currentPlayerIndex + step + n) % n].name };
  if (card.color === 'wild') event = { type: 'colorChange', color: newColor };

  const updatedPlayers = state.players.map((p, i) =>
    i === state.currentPlayerIndex ? { ...p, hand: newHand } : p
  );

  const finalEvent: GameEvent = newHand.length === 0
    ? { type: 'win', player: player.name }
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
  const count = Math.max(state.pendingDraw, 1);
  const { cards, drawPile, discardPile } = drawCards(state.drawPile, state.discardPile, count);
  const n = state.players.length;
  const step = state.direction === 'clockwise' ? 1 : -1;

  const updatedPlayers = state.players.map((p, i) =>
    i === state.currentPlayerIndex ? { ...p, hand: [...p.hand, ...cards] } : p
  );
  const newCurrentIndex = (state.currentPlayerIndex + step + n) % n;

  return {
    ...state,
    players: updatedPlayers,
    currentPlayerIndex: newCurrentIndex,
    drawPile,
    discardPile,
    pendingDraw: 0,
    lastEvent: { type: 'draw', player: state.players[state.currentPlayerIndex].name, count },
  };
}
