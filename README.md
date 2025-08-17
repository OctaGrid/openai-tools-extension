# openai-tools-runner

Simple wrapper to execute tools calls from OpenAI response.

Requires Zod for schema validation, and enforces type safe functions.

## Usage

Define tools:

```typescript
const tools = {
  // ✅ args.test is correct
  test: defineTool({
    argsSchema: z.object({ test: z.string() }),
    tool: async (args) => `Tested with ${args.test}`,
  }),
};
```

```typescript
const tools = {
  // ❌ Compile error: args.tt does not exist, schema defines { test: string }
  test: defineTool({
    argsSchema: z.object({ test: z.string() }),
    tool: async (args) => `Tested with ${args.tt}`,
  }),
};
```

Use tools:

```typescript
// Get tools response from OpenAI API
const toolCalls = response.choices[0].message.tool_calls;
// Run the tools
await executeTypedTools({
  calls: [],
  tools: {
    log: defineTool({
      argsSchema: z.object({ message: z.string() }),
      tool: async (args) => {
        console.log(args.message);
        return "Logged";
      },
    }),
    add: defineTool({
      argsSchema: z.object({
        a: z.number(),
        b: z.number(),
      }),
      tool: async (args) => {
        return args.a + args.b;
      },
    }),
  },
});
```
