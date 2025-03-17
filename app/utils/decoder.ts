export type BioPhaseData = {
  bioImpedance: number;
  phaseAngle: number;
};

export type Payload = {
  freq: number;
  config: string;
  data: BioPhaseData[];
};

function bytesToInt(bytes: number[], offset: number): number {
  return (
    (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>>
    0
  );
}

function bytesToFloat(bytes: number[], offset: number): number {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  bytes.slice(offset, offset + 4).forEach((b, i) => view.setUint8(i, b));
  return view.getFloat32(0, true); // little-endian
}

function bytesToString(
  bytes: number[],
  offset: number,
  length: number,
): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

export function decodePayload(bytes: number[]): Payload {
  let offset = 0;

  // ✅ Decode frequency (4 bytes)
  const freq = bytesToInt(bytes, offset);
  offset += 4;

  // ✅ Decode config string length (2 bytes)
  const configLength = bytes[offset] | (bytes[offset + 1] << 8);
  offset += 2;

  // ✅ Decode config string
  const config = bytesToString(bytes, offset, configLength);
  offset += configLength;

  // ✅ Decode number of BioPhaseData elements (2 bytes)
  const dataSize = bytes[offset] | (bytes[offset + 1] << 8);
  offset += 2;

  // ✅ Decode BioPhaseData array
  const bioPhaseData: BioPhaseData[] = [];
  for (let i = 0; i < dataSize; i++) {
    const bioImpedance = bytesToFloat(bytes, offset);
    offset += 4;
    const phaseAngle = bytesToFloat(bytes, offset);
    offset += 4;

    bioPhaseData.push({bioImpedance, phaseAngle});
  }

  // ✅ Construct the payload object
  const payload: Payload = {
    freq,
    config,
    data: bioPhaseData,
  };

  return payload;
}
