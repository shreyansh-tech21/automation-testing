const { z } = require("zod");

const stepSchema = z.object({
  label: z.string(),
  action: z.enum(["fill", "click"]),
  value: z.string(),
  expected: z.string(),
  type: z.enum(["positive", "negative"]),
});

const createTestSchema = z.object({
  name: z.string().min(1, "Test name is required").max(200),
  url: z.string().url("URL must be valid"),
  profile: z.enum(["smoke", "e2e", "api"]),
  steps: z.array(stepSchema).min(1, "At least one step is required"),
});

function validateCreateTest(body) {
  return createTestSchema.safeParse(body);
}

module.exports = { createTestSchema, stepSchema, validateCreateTest };
