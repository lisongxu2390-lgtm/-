export interface StickerData {
  id: string;
  city: string;
  imageUrl: string;
  prompt: string;
  rotation: number; // For that "tossed on the table" look
  x: number;
  y: number;
  scale: number;
}

export interface GenerationHistory {
  city: string;
  concept: string;
}
