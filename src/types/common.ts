/**
 * Common utility type definitions
 */

import * as React from 'react';

// For omitting specific props from a type
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// For making certain properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// For making certain properties required
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// For either one type or another
export type Either<T, U> = T | U;

// For objects with string keys and value type T
export type Dictionary<T> = Record<string, T>;

// For deep partial types (all properties optional recursively)
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// For non-nullable types
export type NonNullable<T> = T extends null | undefined ? never : T;

// For function types with any number of arguments and a return type
export type AnyFunction<R = unknown> = (...args: unknown[]) => R;

// For asynchronous function types
export type AsyncFunction<T = unknown> = (...args: unknown[]) => Promise<T>;

// For component prop types
export type ComponentProps<T extends React.ComponentType<unknown>> = 
  T extends React.ComponentType<infer P> ? P : never; 