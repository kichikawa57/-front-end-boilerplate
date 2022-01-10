export const makeArray: (obj: NodeListOf<HTMLElement>) => Array<HTMLElement> = (
  obj: NodeListOf<HTMLElement>
) => {
  const array: Array<HTMLElement> = [];
  for (let i = 0, num = obj.length; i < num; i++) {
    array[i] = obj[i];
  }
  return array;
};
