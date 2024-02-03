export type Prefix<Type, Prefix extends string> = {
  [Property in keyof Type as `${Prefix}${Capitalize<string & Property>}`]: Type[Property]
};
