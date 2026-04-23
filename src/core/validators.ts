/**
 * Core validation utilities shared across calculator hooks.
 *
 * Centralizes validation functions to avoid duplication and ensure consistency.
 */

import { z } from 'zod';
import { formatToUserView } from './formatters/numberFormatter';

/**
 * Executes validation of an object against a Zod schema and returns * a map of errors per field (or undefined if validation succeeds).
 *
 * @param schema - schema to be used for validation
 * @param data   - data to be validated
 * @returns      - map of errors or undefined
 */
export const validateSchema = <T extends Record<string, any>>(schema: z.ZodObject<any>, data: T): Record<string, string> | undefined => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path[0] as string;
      if (path) {
        errors[path] = issue.message;
      }
    });
    return errors;
  }
  return undefined;
};

/**
 * Checks if all numeric values are valid (not NaN and not null).
 * Can be used as a fallback when no schema is provided.
 *
 * @param values - object of numeric values
 * @returns     - true if any value is invalid
 */
export const hasInvalidNumber = (values: Record<string, number>): boolean => {
  return Object.values(values).some((v) => Number.isNaN(v));
};

/**
 * Formats a calculation result for user display.
 * Centralizes formatting logic so hooks don't repeat the same call.
 *
 * @param value - raw numeric value * @returns     - string formatted for user display
 */
export const formatResult = (value: number): string => {
  return formatToUserView(value);
};