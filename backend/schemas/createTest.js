const { z } = require("zod");

const uiStepSchema = z.object({
  label: z.string(),
  action: z.enum(["fill", "click", "assert"]),
  value: z.string().optional(),
  expected: z.string().optional(),
  type: z.enum(["positive", "negative"]).optional(),
});

const apiStepSchema = z.object({
  name: z.string(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  url: z.string(),
  headers: z.record(z.string(), z.unknown()).optional(),
  body: z.unknown().optional(),
  extract: z.record(z.string(), z.unknown()).optional(),
  assert: z.record(z.string(), z.unknown()).optional(),
});

const stepSchema = z.union([uiStepSchema, apiStepSchema]);

const createTestSchema = z.object({
  name: z.string().min(1, "Test name is required").max(200),
  url: z.string().url().optional(),
  baseUrl: z.string().optional(),
  profile: z.enum(["smoke", "e2e", "api"]).optional(),
  testType: z.enum(["ui", "api"]).optional().default("ui"),
  steps: z.array(stepSchema).min(1, "At least one step is required"),
}).refine(
  (data) => {
    if (data.testType === "api") return true;
    return !!data.url && !!data.profile;
  },
  { message: "url and profile are required for UI tests", path: ["url"] }
);

function validateCreateTest(body) {
  return createTestSchema.safeParse(body);
}

module.exports = { createTestSchema, stepSchema, validateCreateTest };
