type Factory = typeof AudioContext;

function contextFactory(): Factory | null {
  if (typeof window === "undefined") {
    return null;
  }

  const legacy = (window as unknown as { webkitAudioContext?: Factory })
    .webkitAudioContext;

  return window.AudioContext ?? legacy ?? null;
}

export async function measureDuration(blob: Blob): Promise<number | null> {
  const Factory = contextFactory();

  if (!Factory) {
    return null;
  }

  const context = new Factory();

  try {
    const buffer = await context.decodeAudioData(await blob.arrayBuffer());

    return buffer.duration * 1000;
  } catch {
    return null;
  } finally {
    void context.close();
  }
}
