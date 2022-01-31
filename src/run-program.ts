import { Program } from "./program";

export function runProgram(
  program: Program,
  input: any
): {
  matched: boolean;
  output: any;
} {
  let matched = false;

  let currentTarget = input;
  for (const instruction of program.instructions) {
    if (program.matches(currentTarget)) {
      matched = true;
      currentTarget = instruction.modifier(currentTarget);
    }
  }

  return {
    matched,
    output: currentTarget,
  };
}

export type Options = { stopAfterFirstMatch: boolean };
export function runPrograms(
  programs: Array<Program>,
  options: Options,
  input: any
) {
  let currentTarget = input;

  for (const program of programs) {
    const { matched, output } = runProgram(program, currentTarget);
    currentTarget = output;
    if (matched && options.stopAfterFirstMatch) {
      break;
    }
  }

  return currentTarget;
}
