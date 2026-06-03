const CABINET_QR_PREFIX = "bjpkeep:cabinet:";

export function createCabinetQrPayload(cabinetId: string): string {
  return `${CABINET_QR_PREFIX}${cabinetId}`;
}

export function parseCabinetQrPayload(value: string): string | null {
  const trimmedValue = value.trim();

  if (trimmedValue.startsWith(CABINET_QR_PREFIX)) {
    return trimmedValue.slice(CABINET_QR_PREFIX.length) || null;
  }

  try {
    const url = new URL(trimmedValue);
    const match = url.pathname.match(/\/cabinets\/([^/?#]+)/);
    return match?.[1] ?? null;
  } catch {
    const match = trimmedValue.match(/\/cabinets\/([^/?#]+)/);
    return match?.[1] ?? null;
  }
}
