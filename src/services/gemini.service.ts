import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateImagesResponse } from '@google/genai';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    try {
      if (process.env.API_KEY) {
        this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      } else {
        console.error('Clave de API no encontrada. Asegúrate de que la variable de entorno API_KEY esté configurada.');
      }
    } catch (e) {
      console.error('Error al inicializar GoogleGenAI:', e);
    }
  }

  async generateWallpaper(prompt: string, aspectRatio: string): Promise<string> {
    if (!this.ai) {
      throw new Error('El cliente de IA de Gemini no está inicializado. Por favor, comprueba tu clave de API.');
    }

    try {
      const response: GenerateImagesResponse = await this.ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
      } else {
        throw new Error('No se generó ninguna imagen. La respuesta puede haber sido bloqueada debido a políticas de seguridad.');
      }
    } catch (error) {
      console.error('Error al generar el fondo de pantalla:', error);
      const errorMessage = (error instanceof Error && error.message) ? error.message : 'Ocurrió un error desconocido.';
      throw new Error(`Error al generar la imagen: ${errorMessage}`);
    }
  }
}