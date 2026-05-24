import { z } from "zod";

export const moneySchema = z.number().finite().nonnegative();
export const positiveQuantitySchema = z.number().int().positive();

