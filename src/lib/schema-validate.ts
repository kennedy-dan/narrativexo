import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { JSONSchema7 } from 'json-schema';
import { ValidationResult } from './types';

// Input payload schema (from Starter Pack)
export const INPUT_PAYLOAD_SCHEMA: JSONSchema7 = {
  $id: "https://narrativesxo.local/schemas/input_payload.schema.json",
  title: "XO Input Payload",
  type: "object",
  required: ["market", "entry_path", "user_prompt"],
  properties: {
    market: {
      type: "string",
      description: "Target market that must govern language/culture/output.",
      enum: ["NG", "GH", "KE", "ZA", "UK"]
    },
    entry_path: {
      type: "string",
      description: "One of the 4 story creation entry paths.",
      enum: ["EMOTION", "SCENE", "STORY_SEED", "AUDIENCE_SIGNAL"]
    },
    user_prompt: { type: "string", minLength: 5 },
    tone: {
      type: "string",
      enum: ["PLAYFUL", "SERIOUS", "PREMIUM", "GRASSROOTS", "NEUTRAL"],
      default: "NEUTRAL"
    },
    format: {
      type: "string",
      enum: ["MICROSTORY", "SHORT", "SOCIAL", "SCRIPT", "MEMO"],
      default: "SHORT"
    },
    brand_context: {
      type: "object",
      additionalProperties: true,
      properties: {
        brand_name: { type: "string" },
        category: { type: "string" },
        constraints: { type: "array", items: { type: "string" } }
      }
    },
    xo_controls: {
      type: "object",
      additionalProperties: false,
      properties: {
        needs_state: { type: "string" },
        archetype: { type: "string" },
        ccn_enabled: { type: "boolean", default: true }
      }
    },
    meta: {
      type: "object",
      additionalProperties: true,
      properties: {
        test_case_id: { type: "string" },
        build_id: { type: "string" }
      }
    }
  },
  additionalProperties: false
};

// Output validation schema
export const OUTPUT_VALIDATION_SCHEMA: JSONSchema7 = {
  title: "XO Output Validation",
  type: "object",
  required: ["text", "validation"],
  properties: {
    text: { type: "string", minLength: 1 },
    validation: {
      type: "object",
      required: ["passed"],
      properties: {
        passed: { type: "boolean" },
        errors: { type: "array", items: { type: "string" } },
        warnings: { type: "array", items: { type: "string" } },
        metadata: { type: "object" }
      }
    },
    metadata: {
      type: "object",
      properties: {
        market: { type: "string" },
        entryPath: { type: "string" },
        tone: { type: "string" },
        timestamp: { type: "string", format: "date-time" }
      }
    }
  }
};

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Compile schemas
export const validateInputSchema = ajv.compile(INPUT_PAYLOAD_SCHEMA);
export const validateOutputSchema = ajv.compile(OUTPUT_VALIDATION_SCHEMA);

export function validateSchema<T>(schema: any, data: T): ValidationResult {
  try {
    const valid = schema(data);
    
    if (!valid) {
      const errors = schema.errors?.map((error: any) => {
        const path = error.instancePath || 'root';
        return `${path}: ${error.message}`;
      }) || ['Unknown schema validation error'];
      
      return {
        passed: false,
        errors
      };
    }
    
    return { passed: true };
  } catch (error) {
    return {
      passed: false,
      errors: [`Schema validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

export function validateInputPayload(payload: any): ValidationResult {
  return validateSchema(validateInputSchema, payload);
}

export function validateOutputFormat(output: any): ValidationResult {
  return validateSchema(validateOutputSchema, output);
}