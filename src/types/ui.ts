/**
 * UI component type definitions
 */

import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { type ReactNode, type ComponentType } from "react";

// Embla carousel types
export type CarouselApi = UseEmblaCarouselType[1];
export type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
export type CarouselOptions = UseCarouselParameters[0];
export type CarouselPlugin = UseCarouselParameters[1];

// Chart component types
export type ChartConfig = {
  [k in string]: {
    label?: ReactNode;
    icon?: ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<'light' | 'dark', string> }
  );
};

// Carousel component types
export interface CarouselProps {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
}

// Form component types
export interface FormItemContextValue {
  id: string;
}

// Common UI props
export interface ClassNameProps {
  className?: string;
}

// Component with children prop
export interface PropsWithChildren {
  children?: ReactNode;
} 