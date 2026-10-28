import type { AgentTool, AgentToolDescriptor, AgentToolResult } from "./types.js";
import { AgentToolError } from "./types.js";
import { redactSensitiveValues } from "./redaction.js";

export interface AgentToolRegistryOptions {
  maxInputBytes?: number;
  maxOutputBytes?: number;
}

export class AgentToolRegistry {
  readonly #tools = new Map<string, AgentTool<unknown, unknown>>();
  readonly #maxInputBytes: number;
  readonly #maxOutputBytes: number;

  constructor(options: AgentToolRegistryOptions = {}) {
    this.#maxInputBytes = positiveInteger(options.maxInputBytes ?? 4_096, "maxInputBytes");
    this.#maxOutputBytes = positiveInteger(options.maxOutputBytes ?? 16_384, "maxOutputBytes");
  }

  register<TInput, TOutput>(tool: AgentTool<TInput, TOutput>): void {
    if (this.#tools.has(tool.name)) throw new AgentToolError("DUPLICATE_TOOL", `Tool already registered: ${tool.name}`);
    this.#tools.set(tool.name, tool as AgentTool<unknown, unknown>);
  }

  list(): AgentToolDescriptor[] {
    return [...this.#tools.values()].map(({ name, description }) => ({ name, description }));
  }

  async execute(toolName: string, rawInput: unknown): Promise<AgentToolResult> {
    const tool = this.#tools.get(toolName);
    if (!tool) throw new AgentToolError("UNKNOWN_TOOL", `Unknown or disallowed tool: ${toolName}`);
    enforceSize(rawInput, this.#maxInputBytes, "TOOL_INPUT_TOO_LARGE");
    const parsedInput = tool.inputSchema.safeParse(rawInput);
    if (!parsedInput.success) {
      throw new AgentToolError("INVALID_TOOL_INPUT", `Invalid input for tool ${toolName}`);
    }
    const output = tool.outputSchema.parse(await tool.execute(parsedInput.data));
    const redactedOutput = redactSensitiveValues(output);
    enforceSize(redactedOutput, this.#maxOutputBytes, "TOOL_OUTPUT_TOO_LARGE");
    return { toolName, output: redactedOutput };
  }
}

function enforceSize(value: unknown, maximum: number, code: "TOOL_INPUT_TOO_LARGE" | "TOOL_OUTPUT_TOO_LARGE"): void {
  const size = Buffer.byteLength(JSON.stringify(value), "utf8");
  if (size > maximum) throw new AgentToolError(code, `Tool payload exceeds ${maximum} bytes`);
}

function positiveInteger(value: number, name: string): number {
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
  return value;
}
