/**
 * Hugging Face Hub API – fetch model and dataset cards.
 */

const HF_API_BASE = "https://huggingface.co/api";

export type RawModelCard = Record<string, unknown>;

export async function fetchModelCard(modelId: string): Promise<RawModelCard> {
  const url = `${HF_API_BASE}/models/${encodeURIComponent(modelId)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 }
  });
  if (!res.ok) {
    throw new Error(`HuggingFace model fetch failed: ${res.status} ${modelId}`);
  }
  const data = (await res.json()) as RawModelCard;
  const cardUrl = `https://huggingface.co/${modelId}/raw/main/README.md`;
  const cardRes = await fetch(cardUrl, { next: { revalidate: 300 } });
  if (cardRes.ok) {
    const markdown = await cardRes.text();
    return { ...data, cardMarkdown: markdown, modelId } as RawModelCard;
  }
  return { ...data, modelId } as RawModelCard;
}

export async function fetchDatasetCard(datasetId: string): Promise<RawModelCard> {
  const url = `${HF_API_BASE}/datasets/${encodeURIComponent(datasetId)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 }
  });
  if (!res.ok) {
    throw new Error(`HuggingFace dataset fetch failed: ${res.status} ${datasetId}`);
  }
  const data = (await res.json()) as RawModelCard;
  const cardUrl = `https://huggingface.co/datasets/${datasetId}/raw/main/README.md`;
  const cardRes = await fetch(cardUrl, { next: { revalidate: 300 } });
  if (cardRes.ok) {
    const markdown = await cardRes.text();
    return { ...data, cardMarkdown: markdown, datasetId } as RawModelCard;
  }
  return { ...data, datasetId } as RawModelCard;
}
