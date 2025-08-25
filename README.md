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
    chatTool: {
      // ChatCompletionTool from OpenAI
      type: "function",
      function: {
        name: "print tested with",
        description: 'Prints the string provided prefix with "Tested with"',
        parameters: {
          // FunctionParameters from OpenAI
          // ...
        },
      },
    },
  }),
};
```

```typescript
const tools = {
  // ❌ Compile error: args.tt does not exist, schema defines { test: string }
  test: defineTool({
    argsSchema: z.object({ test: z.string() }),
    tool: async (args) => `Tested with ${args.tt}`,
    chatTool: {
      // ChatCompletionTool from OpenAI
      type: "function",
      function: {
        name: "print tested with",
        description: 'Prints the string provided prefix with "Tested with"',
        parameters: {
          // FunctionParameters from OpenAI
          // ...
        },
      },
    },
  }),
};
```

Use tools:

```typescript
// Define tools
const tools = [
  defineTool({
    argsSchema: z.object({ message: z.string() }),
    tool: async (args) => {
      console.log(args.message);
      return "Logged";
    },
    chatTool: {
      // ChatCompletionTool from OpenAI
      type: "function",
      function: {
        name: "logMsg",
        description: "Logs message provided.",
        parameters: {
          // FunctionParameters from OpenAI
          // ...
        },
      },
    },
  }),
  defineTool({
    argsSchema: z.object({
      a: z.number(),
      b: z.number(),
    }),
    tool: async (args) => {
      return args.a + args.b;
    },
    chatTool: {
      // ChatCompletionTool from OpenAI
      type: "function",
      function: {
        name: "add",
        description: "Adds 2 numbers.",
        parameters: {
          // FunctionParameters from OpenAI
          // ...
        },
      },
    },
  }),
];
// Get tools response from OpenAI API
const calls = response.choices[0].message.tool_calls;
// Run the tools
await executeTypedTools({
  calls,
  tools,
});
```
