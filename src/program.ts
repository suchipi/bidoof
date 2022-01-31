import * as t from "serializable-types";
import { Instruction, isInstruction } from "./instruction";

export class Program {
  matcher: t.TypeDef<any>;
  instructions: Array<Instruction> = [];

  constructor(matcher: any) {
    this.matcher = t.coerceToType(matcher);
  }

  matches(input: any) {
    return t.isOfType(input, this.matcher);
  }
}

export function parseIntoPrograms(
  matchersAndInstructions: Array<t.CoercableToTypeDef | Instruction>
): Array<Program> {
  const programs: Array<Program> = [];
  let currentProgram: Program | null = null;

  for (const item of matchersAndInstructions) {
    if (isInstruction(item)) {
      if (currentProgram == null) {
        throw new Error(
          "Bidoof received an instruction before receiving a matcher (a description of the object(s) to apply the instruction(s) to). Instructions should always come after matchers."
        );
      } else {
        currentProgram.instructions.push(item);
      }
    } else {
      if (currentProgram) programs.push(currentProgram);
      currentProgram = new Program(item);
    }
  }
  if (currentProgram) programs.push(currentProgram);

  return programs;
}
