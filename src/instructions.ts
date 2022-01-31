import lodashMerge from "lodash/merge";
import lodashGet from "lodash/get";
import lodashSet from "lodash/set";
import immerProduce from "immer";
import { Instruction, makeInstruction } from "./instruction";

/**
 * Wrap a given instruction so that instead of mutating the target,
 * it uses [immer](https://npm.im/immer) to mutate a draft of it,
 * then replaces the target with a modified copy.
 */
export function withoutMutating<T>(
  instruction: Instruction<T>
): Instruction<T> {
  return makeInstruction((input: T): T => {
    return immerProduce(input, (draft: T) => {
      instruction.modifier(draft);
    });
  });
}

const mergeMutate = (other: any) => {
  return makeInstruction((input) => {
    lodashMerge(input, other);
    return input;
  });
};
const mergeNoMutate = (other: any) => {
  return withoutMutating(mergeMutate(other));
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
export const merge = Object.assign(mergeNoMutate, { mutate: mergeMutate });

const setMutate = (path: string | Array<string | number>, value: any) => {
  return makeInstruction((input) => {
    lodashSet(input, path, value);
    return input;
  });
};
const setNoMutate = (path: string | Array<string | number>, value: any) => {
  return withoutMutating(setMutate(path, value));
};

/**
 * Write the provided value into the given property path.
 *
 * Uses lodash.set.
 */
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

const modifyMutate = <T>(callback: (input: T) => void): Instruction<T, T> => {
  return makeInstruction((input) => {
    callback(input);
    return input;
  });
};

const modifyNoMutate = <T>(callback: (input: T) => void): Instruction<T, T> => {
  return withoutMutating(modifyMutate(callback));
};

/**
 * Modifies the value using the provided callback.
 *
 * The callback should mutate the value somehow (even when using the
 * non-mutating version of modify, in which case the callback will receive an
 * immer draft object).
 */
export const modify = Object.assign(modifyNoMutate, { mutate: modifyMutate });

/**
 * Replaces the entire value with something else.
 */
export const replace = <T>(newValue: T): Instruction<any, T> => {
  return makeInstruction(() => newValue);
};

const appendMutate = <T>(
  ...items: Array<T>
): Instruction<Array<T>, Array<T>> => {
  return makeInstruction((input) => {
    input.push(...items);
    return input;
  });
};

const appendNoMutate = <T>(
  ...items: Array<T>
): Instruction<Array<T>, Array<T>> => {
  return withoutMutating(appendMutate(...items));
};

/**
 * Adds item(s) to the end of an array.
 */
export const append = Object.assign(appendNoMutate, { mutate: appendMutate });

const prependMutate = <T>(
  ...items: Array<T>
): Instruction<Array<T>, Array<T>> => {
  return makeInstruction((input) => {
    input.unshift(...items);
    return input;
  });
};

const prependNoMutate = <T>(
  ...items: Array<T>
): Instruction<Array<T>, Array<T>> => {
  return makeInstruction((input) => {
    return items.concat(input);
  });
};

/**
 * Adds item(s) to the start of an Array.
 */
export const prepend = Object.assign(prependNoMutate, {
  mutate: prependMutate,
});

const deletePropertyMutate = <T = any>(
  propertyName: string
): Instruction<T, T> => {
  return makeInstruction((input) => {
    delete input[propertyName];
    return input;
  });
};

const deletePropertyNoMutate = <T = any>(
  propertyName: string
): Instruction<T, T> => {
  return withoutMutating(deletePropertyMutate(propertyName));
};

/**
 * Deletes a property from an object.
 */
export const deleteProperty = Object.assign(deletePropertyNoMutate, {
  mutate: deletePropertyMutate,
});

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

const atNoMutate = (
  path: string | Array<string | number>,
  instruction: Instruction
): Instruction => {
  return withoutMutating(atMutate(path, instruction));
};

/**
 * Applies an instruction to a particular sub-path of the target.
 *
 * Uses lodash.get and lodash.set.
 */
export const at = Object.assign(atNoMutate, {
  mutate: atMutate,
});
