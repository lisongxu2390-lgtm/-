import { GoogleGenAI } from "@google/genai";
import { GenerationHistory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper function to remove the black background from the generated image
 * to create a transparent sticker effect.
 */
async function removeBlackBackground(base64Data: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(`data:image/png;base64,${base64Data}`);
        return;
      }
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const threshold = 20; // Tolerance for "black" (0-255)
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // If pixel is very dark (black background), make it transparent
        if (r < threshold && g < threshold && b < threshold) {
          data[i + 3] = 0; // Set Alpha to 0
        }
      }
      
      // Put the processed data back
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (err) => {
      console.error("Error processing image background:", err);
      reject(err);
    };
    // The Gemini SDK returns raw base64 data, so we prepend the header
    img.src = `data:image/png;base64,${base64Data}`;
  });
}

/**
 * Generates a creative, funny, and unique description for a sticker based on the city.
 * It considers previous history to avoid duplicates.
 */
export const generateStickerConcept = async (city: string, history: GenerationHistory[]): Promise<string> => {
  const cityHistory = history
    .filter(h => h.city.toLowerCase() === city.toLowerCase())
    .map(h => h.concept)
    .join("; ");

  const prompt = `
    Task: Create a prompt for an image generator to make a funny, cartoon-style sticker for the city of "${city}".
    
    Constraints:
    1. It MUST be humorous, satirical, or highlight a specific cultural quirk/landmark of ${city}.
    2. It MUST be visually descriptive (e.g., "A rat eating a pizza slice on the subway").
    3. If there is text, keep it very short (1-3 words) and funny.
    4. AVOID these previous concepts for this city: [${cityHistory}].
    5. Return ONLY the English physical description of the image. Do not add explanations.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating concept:", error);
    throw new Error("Failed to brainstorm sticker idea.");
  }
};

/**
 * Generates the actual image based on the concept using gemini-2.5-flash-image.
 */
export const generateStickerImage = async (concept: string): Promise<string> => {
  // We ask for a black background and a white border.
  // This allows us to programmatically remove the black background, leaving the white border intact.
  const imagePrompt = `
    A die-cut vinyl sticker of ${concept}.
    Style: Vector art, bold thick outlines, flat vibrant colors, American cartoon style.
    CRITICAL: The sticker MUST have a THICK WHITE BORDER surrounding the main subject.
    CRITICAL: The background MUST be SOLID BLACK (Hex #000000).
    No realistic shading, use cel-shading or flat design. High contrast.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: imagePrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        // Process the image to remove the black background
        const processedImageUrl = await removeBlackBackground(part.inlineData.data);
        return processedImageUrl;
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to print sticker.");
  }
};
