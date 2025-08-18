import type {
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
} from "openai/resources/chat";
import { z } from "zod";

export type ToolFromSchema<TSchema extends z.ZodTypeAny, TResult = unknown> = (
  args: z.infer<TSchema>
) => Promise<TResult>;

export type TypedToolEntry<TSchema extends z.ZodTypeAny, TResult = unknown> = {
  argsSchema: TSchema;
  tool: ToolFromSchema<TSchema, TResult>;
  chatTool: ChatCompletionTool;
};

// execution options – now generic over *exact* tools object
export type ExecuteTypedToolsOptions<
  TTools extends Array<TypedToolEntry<any, any>>
> = {
  tools: TTools;
  calls: ChatCompletionMessageToolCall[];
  toolNotFound?: (name: string, strArgs: string) => Promise<void> | void;
  toolArgsError?: (
    name: string,
    strArgs: string,
    error: unknown
  ) => Promise<void> | void;
  parallel?: boolean;
};

export async function executeTypedTools<
  TTools extends Array<TypedToolEntry<any, any>>
>({
  tools,
  calls,
  toolNotFound,
  toolArgsError,
}: ExecuteTypedToolsOptions<TTools>) {
  const map = new Map<string, TypedToolEntry<any, any>>();
  tools.forEach((tool) => {
    map.set(tool.chatTool.function.name, tool);
  });
  return await Promise.all(
    calls.map(async (call) => {
      const { name, arguments: strArgs } = call.function;
      const toolDef = map.get(name);

      if (!toolDef) {
        await toolNotFound?.(name, strArgs);
        return { name, ok: false, error: "Tool not found" };
      }

      const { tool, argsSchema } = toolDef;

      try {
        const parsedRaw = JSON.parse(strArgs);
        if (argsSchema) {
          const validation = argsSchema.safeParse(parsedRaw);
          if (!validation.success) {
            await toolArgsError?.(name, strArgs, validation.error);
            return { name, ok: false, error: validation.error };
          }
          const result = await tool(validation.data);
          return { name, ok: true, result };
        } else {
          const result = await tool(parsedRaw);
          return { name, ok: true, result };
        }
      } catch (err) {
        await toolArgsError?.(name, strArgs, err);
        return { name, ok: false, error: err };
      }
    })
  );
}

export function defineTool<const TSchema extends z.ZodTypeAny, TResult>(entry: {
  argsSchema: TSchema;
  tool: (args: z.infer<TSchema>) => Promise<TResult>;
  chatTool: ChatCompletionTool;
}): TypedToolEntry<TSchema, TResult> {
  return entry;
}
