import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { GeminiService } from './services/gemini.service';

interface AspectRatio {
  name: string;
  value: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}

interface Theme {
  name: string;
  prompt: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private geminiService = inject(GeminiService);
  private readonly COOLDOWN_SECONDS = 10;

  // --- State Signals ---
  selectedAspectRatio = signal<AspectRatio['value']>('16:9');
  selectedTheme = signal<Theme | null>(null);
  customPrompt = signal('');
  
  isLoading = signal(false);
  generatedImage = signal<string | null>(null);
  error = signal<string | null>(null);
  onCooldown = signal(false);
  cooldownTime = signal(0);

  // --- Options ---
  aspectRatios: AspectRatio[] = [
    { name: 'Escritorio (16:9)', value: '16:9' },
    { name: 'Móvil (9:16)', value: '9:16' },
    { name: 'Tableta (4:3)', value: '4:3' },
    { name: 'Tableta Vertical (3:4)', value: '3:4' },
    { name: 'Cuadrado (1:1)', value: '1:1' },
  ];

  themes: Theme[] = [
    { name: 'Ciudad Futurista', prompt: 'a sprawling futuristic cityscape at night, neon lights, flying vehicles, cyberpunk aesthetic, hyper-detailed, cinematic lighting' },
    { name: 'Bosque Encantado', prompt: 'a magical enchanted forest, glowing mushrooms, ancient trees with moss, sunbeams filtering through the canopy, fantasy art, ethereal' },
    { name: 'Nebulosa Cósmica', prompt: 'a vibrant cosmic nebula in deep space, colorful gases, swirling galaxies, distant stars, high-resolution astrophotography style' },
    { name: 'Paisaje Sereno', prompt: 'a serene mountain landscape at sunrise, misty valleys, calm lake reflecting the sky, Bob Ross painting style, peaceful' },
    { name: 'Olas Abstractas', prompt: 'an abstract digital art of colorful, flowing waves and particles, vibrant gradients, dynamic motion, 3D render' },
    { name: 'Anime Clásico', prompt: 'a beautiful 90s vintage anime aesthetic scenery, soft pastel colors, detailed background art, Studio Ghibli inspired' },
  ];

  constructor() {
    this.selectedTheme.set(this.themes[0]);
  }

  // --- Computed Full Prompt ---
  fullPrompt = computed(() => {
    const basePrompt = 'A beautiful high-resolution wallpaper, 8k, ultra-detailed, cinematic quality.';
    const themePrompt = this.selectedTheme()?.prompt || '';
    const userPrompt = this.customPrompt() ? `, ${this.customPrompt()}` : '';
    return `${themePrompt}${userPrompt}. ${basePrompt}`;
  });

  async generateWallpaper() {
    if (this.isLoading() || this.onCooldown()) return;

    this.isLoading.set(true);
    this.generatedImage.set(null);
    this.error.set(null);

    try {
      const prompt = this.fullPrompt();
      const aspectRatio = this.selectedAspectRatio();
      
      const imageUrl = await this.geminiService.generateWallpaper(prompt, aspectRatio);
      this.generatedImage.set(imageUrl);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Ocurrió un error desconocido al generar la imagen.');
      console.error(err);
    } finally {
      this.isLoading.set(false);
      this.startCooldown();
    }
  }

  private startCooldown() {
    this.onCooldown.set(true);
    this.cooldownTime.set(this.COOLDOWN_SECONDS);

    const interval = setInterval(() => {
      this.cooldownTime.update(t => t - 1);
      if (this.cooldownTime() <= 0) {
        clearInterval(interval);
        this.onCooldown.set(false);
      }
    }, 1000);
  }

  // --- Event Handlers for template bindings ---
  onAspectRatioChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedAspectRatio.set(selectElement.value as AspectRatio['value']);
  }

  onThemeChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const selectedTheme = this.themes.find(t => t.name === selectElement.value) || null;
    this.selectedTheme.set(selectedTheme);
  }

  onPromptInput(event: Event) {
    const inputElement = event.target as HTMLTextAreaElement;
    this.customPrompt.set(inputElement.value);
  }
}