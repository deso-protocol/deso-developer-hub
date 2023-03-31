import { bufToUvarint64, uvarint64ToBuf } from './util';
import { TransactionNonce } from './transaction-transcoders';
import 'reflect-metadata';
export class BinaryRecord {
  static fromBytes(bytes: Buffer): [BinaryRecord, Buffer] {
    const result = new this();
    let buffer = bytes;

    const transcoders: TranscoderMetadata[] =
      Reflect.getMetadata('transcoders', result) || [];

    transcoders.forEach(({ name, transcoder }) => {
      let value;
      [value, buffer] = transcoder.read.call(result, buffer);
      (result as any)[name] = value;
    });

    return [result, buffer];
  }

  toBytes(): Buffer {
    const transcoders: TranscoderMetadata[] =
      Reflect.getMetadata('transcoders', this) || [];

    let buffer = Buffer.alloc(0);
    transcoders.forEach(({ name, transcoder }) => {
      buffer = Buffer.concat([
        buffer,
        transcoder.write.call(this, (this as any)[name]),
      ]);
    });

    return buffer;
  }
}

export interface TranscoderMetadata<T = any> {
  name: string;
  transcoder: Transcoder<T>;
}

export function Transcode<T>(transcoder: Transcoder<T>) {
  return (target: any, name: string | symbol) => {
    const transcoders = Reflect.getMetadata('transcoders', target) || [];
    transcoders.push({ name, transcoder });
    Reflect.defineMetadata('transcoders', transcoders, target);
  };
}

export interface Transcoder<T> {
  read: (bytes: Buffer) => [T, Buffer];
  write: (object: T) => Buffer;
}

export interface Serializable {
  toBytes: () => Buffer;
}

export interface Deserializable<T> {
  fromBytes: (bytes: Buffer) => [T, Buffer];
}

export const Uvarint64: Transcoder<number> = {
  read: (bytes) => bufToUvarint64(bytes),
  write: (uint) => uvarint64ToBuf(uint),
};

export const Boolean: Transcoder<boolean> = {
  read: (bytes) => [bytes.readUInt8(0) != 0, bytes.slice(1)],
  write: (bool) => {
    const result = Buffer.alloc(1);
    result.writeUInt8(bool ? 1 : 0, 0);
    return result;
  },
};

export const Uint8: Transcoder<number> = {
  read: (bytes) => [bytes.readUInt8(0), bytes.slice(1)],
  write: (uint) => {
    const result = Buffer.alloc(1);
    result.writeUInt8(uint, 0);
    return result;
  },
};

export const FixedBuffer = (size: number): Transcoder<Buffer> => ({
  read: (bytes) => [bytes.slice(0, size), bytes.slice(size)],
  write: (bytes) => bytes,
});

export const VarBuffer: Transcoder<Buffer> = {
  read: (bytes) => {
    const [size, buffer] = bufToUvarint64(bytes);
    return [buffer.slice(0, size), buffer.slice(size)];
  },
  write: (bytes) => Buffer.concat([uvarint64ToBuf(bytes.length), bytes]),
};
export const TransactionNonceTranscoder: Transcoder<TransactionNonce | null> = {
  read: (bytes) => {
    return TransactionNonce.fromBytes(bytes) as [TransactionNonce, Buffer];
  },
  write: (nonce) => {
    if (nonce) {
      return Buffer.concat([nonce.toBytes()]);
    }
    return Buffer.alloc(0);
  },
};

export function Optional<T>(transcoder: Transcoder<T>): Transcoder<T | null> {
  return {
    read: (bytes: Buffer) =>
      !bytes.length ? [null, bytes] : transcoder.read(bytes),
    write: (value: T | null) =>
      value === null ? Buffer.alloc(0) : transcoder.write(value),
  };
}

export const ChunkBuffer = (width: number): Transcoder<Buffer[]> => ({
  read: (bytes) => {
    const countAndBuffer = bufToUvarint64(bytes);
    const count = countAndBuffer[0];
    let buffer = countAndBuffer[1];
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(buffer.slice(0, 33));
      buffer = buffer.slice(33);
    }

    return [result, buffer];
  },
  write: (chunks) => Buffer.concat([uvarint64ToBuf(chunks.length), ...chunks]),
});

export const ArrayOf = <
  T extends Serializable,
  C extends Deserializable<T> & { new (): T }
>(
  klass: C
): Transcoder<T[]> => ({
  read: (bytes) => {
    const countAndBuffer = bufToUvarint64(bytes);
    const count = countAndBuffer[0];
    let buffer = countAndBuffer[1];

    const result = [];
    for (let i = 0; i < count; i++) {
      let obj;
      [obj, buffer] = klass.fromBytes(buffer);
      result.push(obj);
    }

    return [result, buffer];
  },
  write: (objects) => {
    const count = uvarint64ToBuf(objects.length);
    return Buffer.concat([count, ...objects.map((object) => object.toBytes())]);
  },
});

export const Record = <
  T extends Serializable,
  C extends Deserializable<T> & { new (): T }
>(
  klass: C
): Transcoder<T> => ({
  read: (bytes) => klass.fromBytes(bytes),
  write: (object) => object.toBytes(),
});

export const Enum = <
  T extends Serializable,
  C extends Deserializable<T> & { new (): T }
>(klassMap: {
  [index: string]: C;
}): Transcoder<T> => {
  const instanceToType = <T>(object: T): number => {
    for (const [key, value] of Object.entries(klassMap)) {
      if (object instanceof value) return parseInt(key);
    }
    return -1;
  };

  return {
    read: (bytes) => {
      let buffer = bytes;
      const typeAndBuffer = bufToUvarint64(buffer);
      const type = typeAndBuffer[0];
      buffer = typeAndBuffer[1];

      const sizeAndBuffer = bufToUvarint64(buffer);
      const size = sizeAndBuffer[0];
      buffer = sizeAndBuffer[1];

      return [
        klassMap[type].fromBytes(buffer.slice(0, size))[0],
        buffer.slice(size),
      ];
    },
    write: (object) => {
      const type = uvarint64ToBuf(instanceToType(object));
      const bytes = object.toBytes();
      const size = uvarint64ToBuf(bytes.length);

      return Buffer.concat([type, size, bytes]);
    },
  };
};
