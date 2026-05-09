declare module "node:crypto" {
  export function createHash(algorithm: string): {
    update(value: string): {
      digest(encoding: "hex"): string;
    };
  };

  export function randomInt(min: number, max: number): number;

  export function randomUUID(): string;
}

declare const process: {
  env: Record<string, string | undefined>;
};
