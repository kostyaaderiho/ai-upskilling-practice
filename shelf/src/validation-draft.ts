import { validateBody } from "express";

export function validateTitle(input: unknown): string {
  return validateBody(input, { title: "string" });
}
