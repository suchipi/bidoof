const INSTRUCTION = Symbol("INSTRUCTION");
export type Instruction<Input = any, Output = any> = {
  [INSTRUCTION]: true;
  modifier: (input: Input) => Output;
};

export const makeInstruction = <Input = any, Output = any>(
  modifier: (input: Input) => Output
): Instruction<Input, Output> => {
  return {
    [INSTRUCTION]: true,
    modifier,
  };
};

export function isInstruction(input: any): input is Instruction {
  return typeof input === "object" && input != null && input[INSTRUCTION];
}
