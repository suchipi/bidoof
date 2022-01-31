import * as t from "serializable-types";
import lodashMerge from "lodash/merge";
import lodashSet from "lodash/set";
import immerProduce from "immer";

export { t };

const BIDOOF_INSTRUCTION = Symbol("BIDOOF_INSTRUCTION");
export type BidoofInstruction<
  Kind extends string = string,
  Props extends {} = { [key: string]: any }
> = {
  [BIDOOF_INSTRUCTION]: true;
  kind: Kind;
} & Props;

const makeInstruction = <
  Kind extends string = string,
  Props extends {} = { [key: string]: any }
>(
  kind: Kind,
  props: Props
): BidoofInstruction<Kind, Props> => {
  return {
    [BIDOOF_INSTRUCTION]: true,
    kind: kind,
    ...props,
  };
};

export function isInstruction(input: any): input is BidoofInstruction {
  return (
    typeof input === "object" && input != null && input[BIDOOF_INSTRUCTION]
  );
}

const API = {
  merge: Object.assign((other: any) => makeInstruction("merge", { other }), {
    mutate: (other: any) => makeInstruction("mergeMutate", { other }),
  }),
  set: Object.assign(
    (path: string | Array<string | number>, value: any) =>
      makeInstruction("set", { path, value }),
    {
      mutate: (path: string | Array<string | number>, value: any) =>
        makeInstruction("setMutate", { path, value }),
    }
  ),
  modify: Object.assign(
    (modifierFn: (value: any) => void) =>
      makeInstruction("modify", { modifierFn }),
    {
      mutate: (modifierFn: (value: any) => void) =>
        makeInstruction("modifyMutate", { modifierFn }),
    }
  ),
  replace: (newValue: any) => makeInstruction("replace", { newValue }),
};

export const merge = API.merge;
export const set = API.set;
export const modify = API.modify;
export const replace = API.replace;

export function processInstruction(
  target: any,
  instruction: BidoofInstruction
): any {
  switch (instruction.kind) {
    case "merge": {
      return immerProduce(target, (draft) => {
        lodashMerge(draft, instruction.other);
      });
      break;
    }
    case "mergeMutate": {
      lodashMerge(target, instruction.other);
      return target;
      break;
    }
    case "set": {
      return immerProduce(target, (draft) => {
        lodashSet(draft, instruction.path, instruction.value);
      });
      break;
    }
    case "setMutate": {
      lodashSet(target, instruction.path, instruction.value);
      return target;
      break;
    }
    case "modify": {
      return immerProduce(target, instruction.modifierFn);
      break;
    }
    case "modifyMutate": {
      instruction.modifierFn(target);
      return target;
      break;
    }
    case "replace": {
      return instruction.newValue;
      break;
    }
    default: {
      throw new Error("Unhandled bidoof instruction: " + instruction.kind);
    }
  }
}

export type BidoofGroup = {
  matcher: t.TypeDef<any>;
  instructions: Array<BidoofInstruction>;
};

export function collectGroups(
  matchersAndInstructions: Array<t.CoercableToTypeDef | BidoofInstruction>
): Array<BidoofGroup> {
  const groups: Array<BidoofGroup> = [];
  let currentGroup: BidoofGroup | null = null;

  for (const item of matchersAndInstructions) {
    if (isInstruction(item)) {
      if (currentGroup == null) {
        throw new Error(
          "Received a bidoof instruction before receiving a description of the object(s) to apply the instructions to. Bidoof instructions should always come after descriptions."
        );
      } else {
        currentGroup.instructions.push(item);
      }
    } else {
      if (currentGroup) groups.push(currentGroup);
      currentGroup = { matcher: t.coerceToType(item), instructions: [] };
    }
  }
  if (currentGroup) groups.push(currentGroup);

  return groups;
}

export type BidoofOptions = { stopAfterFirstMatch: boolean };
function doBidoof(
  target: any,
  options: BidoofOptions,
  matchersAndInstructions: Array<t.CoercableToTypeDef | BidoofInstruction>
): any {
  const groups = collectGroups(matchersAndInstructions);

  let currentTarget = target;
  for (const group of groups) {
    if (t.isOfType(target, group.matcher)) {
      for (const instruction of group.instructions) {
        currentTarget = processInstruction(currentTarget, instruction);
      }
      if (options.stopAfterFirstMatch) {
        break;
      }
    }
  }
  return currentTarget;
}

interface MakeBidoof {
  (matchersAndInstructions: Array<t.CoercableToTypeDef | BidoofInstruction>): (
    target: any
  ) => any;
  (options: BidoofOptions): (
    matchersAndInstructions: Array<t.CoercableToTypeDef | BidoofInstruction>
  ) => (target: any) => any;
}

export const defaultOptions: BidoofOptions = { stopAfterFirstMatch: false };
export const makeBidoof: MakeBidoof = (optionsOrMatcherAndInstructions) => {
  if (Array.isArray(optionsOrMatcherAndInstructions)) {
    const matchersAndInstructions = optionsOrMatcherAndInstructions;
    return (target: any) => {
      return doBidoof(target, defaultOptions, matchersAndInstructions);
    };
  } else {
    const options = optionsOrMatcherAndInstructions;
    return (
        matchersAndInstructions: Array<t.CoercableToTypeDef | BidoofInstruction>
      ) =>
      (target: any) => {
        return doBidoof(target, options, matchersAndInstructions);
      };
  }
};
