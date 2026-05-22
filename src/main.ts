import { Game } from './Game';
import './styles.css';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const hudRoot = document.getElementById('hud-root') as HTMLElement;
  const minimapCanvas = document.getElementById('minimap') as HTMLCanvasElement;
  const actionButton = document.getElementById('action-button') as HTMLElement;
  if (!canvas || !hudRoot || !minimapCanvas || !actionButton) {
    throw new Error('Missing required DOM elements');
  }
  const game = new Game(canvas, hudRoot, minimapCanvas, actionButton);
  game.start();
});
