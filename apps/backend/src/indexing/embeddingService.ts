// Dynamic import of the transformers pipeline (ESM‑only)
let transformerPipeline: any;

let embedPipeline: any | null = null;

/**
 * Lazily initialize the embedding pipeline.
 */
export async function getEmbeddingPipeline() {
  // Load the library lazily the first time we need it.
  if (!transformerPipeline) {
    const mod = await import("@xenova/transformers");
    transformerPipeline = mod.pipeline;
  }
  if (!embedPipeline) {
    embedPipeline = await transformerPipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedPipeline;
}

/**
 * Produce a normalized numeric vector for the provided text.
 */
export async function embedText(text: string): Promise<number[]> {
  const pipeline = await getEmbeddingPipeline();
  const output = await pipeline(text);
  // output is a 2‑D array [[...]]; flatten to 1‑D.
  const flat = output[0].flat();
  const norm = Math.sqrt(flat.reduce((s: number, v: number) => s + v * v, 0));
  if (norm === 0) return flat;
  return flat.map((v: number) => v / norm);
}
