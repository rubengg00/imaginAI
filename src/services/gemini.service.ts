import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateImagesResponse } from '@google/genai';
import { environment } from '../environments/environment'; // Ruta correcta a tu archivo de entorno

/**
 * Safely retrieves the API key from `process.env`.
 * This is necessary because the code runs in a browser where `process` is not
 * defined by default. A build tool (like the one Vercel uses for Angular projects)
 * is expected to replace `process.env.NG_APP_API_KEY` with the actual key.
 * Using the `NG_APP_` prefix is the standard way to expose variables to a
 * frontend Angular application on Vercel.
 * @returns The API key string, or undefined if not found.
 */
function getApiKey(): string | undefined {
  try {
    // @ts-ignore
    const apiKey = process.env.API_KEY;
    return apiKey;
  } catch (e) {
    console.warn('Could not read `process.env.NG_APP_API_KEY`. This is expected if not in a build environment.');
    return undefined;
  }
}

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    try {
      // Usa la variable de entorno de Angular
      if (environment.API_KEY) {
        this.ai = new GoogleGenAI({ apiKey: environment.API_KEY });
      } else {
        console.error('Clave de API no encontrada. Asegúrate de que la variable de entorno esté configurada.');
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
