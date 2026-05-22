export class InputState {
  private pressed = new Set<string>();
  private actionQueued = false;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    const key = this.normalize(e.key);
    if (key === ' ') {
      this.actionQueued = true;
      e.preventDefault();
      return;
    }
    if (['w', 'a', 's', 'd'].includes(key)) {
      this.pressed.add(key);
      e.preventDefault();
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const key = this.normalize(e.key);
    this.pressed.delete(key);
  };

  private normalize(key: string): string {
    return key.length === 1 ? key.toLowerCase() : key;
  }

  triggerAction(): void {
    this.actionQueued = true;
  }

  consumeAction(): boolean {
    if (this.actionQueued) {
      this.actionQueued = false;
      return true;
    }
    return false;
  }

  isPressed(key: 'w' | 'a' | 's' | 'd'): boolean {
    return this.pressed.has(key);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
