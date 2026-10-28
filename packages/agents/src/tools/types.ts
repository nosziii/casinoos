import type { ZodType } from "zod";

export interface AgentTool<TInput, TOutput> {
  name: string;
  description: string;
  inputSchema: ZodType<TInput>;
  outputSchema: ZodType<TOutput>;
  execute: (input: TInput) => TOutput | Promise<TOutput>;
}

export interface AgentToolDescriptor {
  name: string;
  description: string;
}

export interface AgentToolResult {
  toolName: string;
  output: unknown;
}

export type AgentToolErrorCode =
  | "DUPLICATE_TOOL"
  | "INVALID_TOOL_INPUT"
  | "TOOL_INPUT_TOO_LARGE"
  | "TOOL_OUTPUT_TOO_LARGE"
  | "UNKNOWN_TOOL";

export class AgentToolError extends Error {
  constructor(readonly code: AgentToolErrorCode, message: string) {
    super(message);
    this.name = "AgentToolError";
  }
}
