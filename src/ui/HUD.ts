import type { Inventory, ToastMessage } from '../types';
import { MAX_HP } from '../config/constants';

export class HUD {
  private hpBar: HTMLDivElement;
  private hpText: HTMLDivElement;
  private timeText: HTMLDivElement;
  private hammerCount: HTMLDivElement;
  private toastContainer: HTMLDivElement;
  private toasts: ToastMessage[] = [];

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <div class="hud-bar">
        <div class="hud-block hp-block">
          <div class="hp-bar-bg"><div class="hp-bar-fill"></div></div>
          <div class="hp-text">HP 0/0</div>
        </div>
        <div class="hud-block time-block">
          <span class="hud-icon">⏱</span><span class="time-text">0:00</span>
        </div>
        <div class="hud-block hammer-block">
          <span class="hud-icon">🔨</span><span class="hammer-count">×0</span>
        </div>
      </div>
      <div class="toast-container"></div>
    `;
    this.hpBar = root.querySelector('.hp-bar-fill') as HTMLDivElement;
    this.hpText = root.querySelector('.hp-text') as HTMLDivElement;
    this.timeText = root.querySelector('.time-text') as HTMLDivElement;
    this.hammerCount = root.querySelector('.hammer-count') as HTMLDivElement;
    this.toastContainer = root.querySelector('.toast-container') as HTMLDivElement;
  }

  update(hp: number, timeRemaining: number, inventory: Inventory): void {
    const ratio = Math.max(0, Math.min(1, hp / MAX_HP));
    this.hpBar.style.width = `${ratio * 100}%`;
    this.hpBar.style.background =
      ratio > 0.5 ? '#5cff5c' : ratio > 0.25 ? '#ffd44c' : '#ff5c5c';
    this.hpText.textContent = `HP ${Math.max(0, Math.ceil(hp))}/${MAX_HP}`;
    const mins = Math.max(0, Math.floor(timeRemaining / 60));
    const secs = Math.max(0, Math.floor(timeRemaining % 60));
    this.timeText.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    this.hammerCount.textContent = `×${inventory.wallBreaker}`;
  }

  pushToast(text: string, color = '#ffffff', durationMs = 1500): void {
    const div = document.createElement('div');
    div.className = 'toast';
    div.textContent = text;
    div.style.color = color;
    this.toastContainer.appendChild(div);
    const message: ToastMessage = {
      text,
      color,
      expiresAt: performance.now() + durationMs,
    };
    this.toasts.push(message);
    setTimeout(() => {
      div.classList.add('fade');
    }, Math.max(0, durationMs - 250));
    setTimeout(() => {
      div.remove();
      this.toasts.shift();
    }, durationMs);
  }

  flash(color = '#ff8080'): void {
    const overlay = document.createElement('div');
    overlay.className = 'hud-flash';
    overlay.style.background = color;
    this.toastContainer.parentElement?.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('fade'));
    setTimeout(() => overlay.remove(), 350);
  }
}
