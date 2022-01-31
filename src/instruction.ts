const INSTRUCTION = Symbol("INSTRUCTION");
export type Instruction = {
  [INSTRUCTION]: true;
  modifier: (input: any) => any;
};

export const makeInstruction = (modifier: (input: any) => any): Instruction => {
  return {
    [INSTRUCTION]: true,
    modifier,
  };
};

export function isInstruction(input: any): input is Instruction {
  return typeof input === "object" && input != null && input[INSTRUCTION];
}
