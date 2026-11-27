import { z } from "zod";

const quantity = z.number().min(-1e12).max(1e12);

export const calculationSchema = z.object({
  passage: z.string().trim().min(8).max(1400),
  operation: z.enum(["add", "subtract", "multiply", "divide", "percent"]),
  left: quantity,
  right: quantity,
  expected: quantity,
  decimalPlaces: z.number().int().min(0).max(8).optional(),
}).strict();

function statedNumbers(text: string): number[] {
  const tokens = text.normalize("NFKC").match(/-?\d+(?:,\d{3})*(?:\.\d+)?/g) ?? [];
  return tokens.map((token) => Number(token.replaceAll(",", "")));
}

// The reviewer extracts data from the draft. Only these trusted operations run.
export function verifyCalculation(body: string, calculation: z.infer<typeof calculationSchema>) {
  const { passage, operation, left, right, expected, decimalPlaces } = calculation;
  const operations = {
    add: () => left + right,
    subtract: () => left - right,
    multiply: () => left * right,
    divide: () => left / right,
    percent: () => left / right * 100,
  };
  const value = operations[operation]();
  const actual = decimalPlaces === undefined ? value : Number(value.toFixed(decimalPlaces));
  // Allow floating-point representation error while keeping rounded comparisons exact.
  const tolerance = decimalPlaces === undefined ? 1e-12 * Math.min(1, Math.abs(expected)) : 0;
  const inputs = statedNumbers(body);
  const pass = body.includes(passage) && inputs.includes(left) && inputs.includes(right)
    && statedNumbers(passage).includes(expected) && Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance;
  return { ...calculation, actual: Number.isFinite(actual) ? actual : null, pass };
}
