import lodashMerge from "lodash/merge";
import lodashGet from "lodash/get";
import lodashSet from "lodash/set";
import { Immer } from "immer";
import { Instruction, makeInstruction } from "./instruction";

const immer = new Immer({
  autoFreeze: false,
});

/**
 * Wrap a given instruction so that instead of mutating the target,
 * it uses [immer](https://npm.im/immer) to mutate a draft of it,
 * then replaces the target with a modified copy.
 */
export function withoutMutating(instruction: Instruction): Instruction {
  return makeInstruction((input) => {
    return immer.produce(input, (draft) => {
      instruction.modifier(draft);
    });
  });
}

/**
 * Deep-merge the provided value into the target. Works on objects, arrays, etc.
 * Think Object.assign, but recursive.
 *
 * When merging arrays, their contents will be replaced by-index.
 * For example, applying this:
 *
 * merge([1, 2, 3])
 *
 * to an array like:
 *
 * [4, 5]
 *
 * would yield this:
 *
 * [4, 5, 3]
 */
const mergeMutate = (other: any) => {
  return makeInstruction((input) => {
    lodashMerge(input, other);
    return input;
  });
};

/**
 * Deep-merge the provided value into the target. Works on objects, arrays, etc.
 * Think Object.assign, but recursive.
 *
 * When merging arrays, their contents will be replaced by-index.
 * For example, applying this:
 *
 * merge([1, 2, 3])
 *
 * to an array like:
 *
 * [4, 5]
 *
 * would yield this:
 *
 * [4, 5, 3]
 */
const mergeNoMutate = (other: any) => {
  return withoutMutating(mergeMutate(other));
};

export const merge = Object.assign(mergeNoMutate, { mutate: mergeMutate });

/**
 * Write the provided value into the given property path.
 *
 * Uses lodash.set.
 */
const setMutate = (path: string | Array<string | number>, value: any) => {
  return makeInstruction((input) => {
    lodashSet(input, path, value);
    return input;
  });
};

/**
 * Write the provided value into the given property path.
 *
 * Uses lodash.set.
 */
const setNoMutate = (path: string | Array<string | number>, value: any) => {
  return withoutMutating(setMutate(path, value));
};

export const set = Object.assign(setNoMutate, { mutate: setMutate });

/**
 * Replaces the entire value with the return value of the provided callback.
 *
 * It's a lot like an Array's `map` method, but for just one thing.
 */
export const transform = <Input, Output>(
  callback: (input: Input) => Output
) => {
  return makeInstruction(callback);
};

/**
 * Modifies the value using the provided callback.
 *
 * The callback should mutate the value somehow (even when using the
 * non-mutating version of modify, in which case the callback will receive an
 * immer draft object).
 */
const modifyMutate = (callback: (input: any) => void): Instruction => {
  return makeInstruction((input) => {
    callback(input);
    return input;
  });
};

/**
 * Modifies the value using the provided callback.
 *
 * The callback should mutate the value somehow (even when using the
 * non-mutating version of modify, in which case the callback will receive an
 * immer draft object).
 */
const modifyNoMutate = (callback: (input: any) => void): Instruction => {
  return withoutMutating(modifyMutate(callback));
};

export const modify = Object.assign(modifyNoMutate, { mutate: modifyMutate });

/**
 * Replaces the entire value with something else.
 */
export const replace = (newValue: any): Instruction => {
  return makeInstruction(() => newValue);
};

/**
 * Adds item(s) to the end of an array.
 */
const appendMutate = (...items: Array<any>): Instruction => {
  return makeInstruction((input) => {
    input.push(...items);
    return input;
  });
};

/**
 * Adds item(s) to the end of an array.
 */
const appendNoMutate = (...items: Array<any>): Instruction => {
  return withoutMutating(appendMutate(...items));
};

export const append = Object.assign(appendNoMutate, { mutate: appendMutate });

/**
 * Adds item(s) to the start of an Array.
 */
const prependMutate = (...items: Array<any>): Instruction => {
  return makeInstruction((input) => {
    input.unshift(...items);
    return input;
  });
};

/**
 * Adds item(s) to the start of an Array.
 */
const prependNoMutate = (...items: Array<any>): Instruction => {
  return makeInstruction((input) => {
    return items.concat(input);
  });
};

export const prepend = Object.assign(prependNoMutate, {
  mutate: prependMutate,
});

/**
 * Deletes a property from an object.
 */
const deletePropertyMutate = (propertyName: string): Instruction => {
  return makeInstruction((input) => {
    delete input[propertyName];
    return input;
  });
};

/**
 * Deletes a property from an object.
 */
const deletePropertyNoMutate = (propertyName: string): Instruction => {
  return withoutMutating(deletePropertyMutate(propertyName));
};

export const deleteProperty = Object.assign(deletePropertyNoMutate, {
  mutate: deletePropertyMutate,
});

/**
 * Applies an instruction to a particular sub-path of the target.
 *
 * Uses lodash.get and lodash.set.
 */
const atMutate = (
  path: string | Array<string | number>,
  instruction: Instruction
): Instruction => {
  return makeInstruction((input) => {
    const child = lodashGet(input, path);
    const newChild = instruction.modifier(child);
    lodashSet(input, path, newChild);
    return input;
  });
};

/**
 * Applies an instruction to a particular sub-path of the target.
 *
 * Uses lodash.get and lodash.set.
 */
const atNoMutate = (
  path: string | Array<string | number>,
  instruction: Instruction
): Instruction => {
  return withoutMutating(atMutate(path, instruction));
};

export const at = Object.assign(atNoMutate, {
  mutate: atMutate,
});
