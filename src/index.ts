import * as t from "serializable-types";
import { Instruction } from "./instruction";
import { parseIntoPrograms } from "./program";
import { runPrograms, Options } from "./run-program";

export * from "./instructions";
export { Instruction, Options, t };

export const defaultOptions: Options = { stopAfterFirstMatch: false };

export function makeBidoof(
  programDescription: Array<t.CoercableToTypeDef | Instruction>,
  options: Options = defaultOptions
): (input: any) => any {
  const programs = parseIntoPrograms(programDescription);
  return (input: any) => {
    return runPrograms(programs, options, input);
  };
}
