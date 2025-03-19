/**
 * Toast component type definitions
 */

import * as React from "react";

// Forward declaration of ToastAction component type
interface ToastActionProps extends React.HTMLAttributes<HTMLButtonElement> {
  altText?: string;
}

// Toast action element from UI component
export type ToastActionElement = React.ReactElement<ToastActionProps>;

// Base Toast Props interface
export interface ToastProps {
  id: string;
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Toast instance with required id
export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

// Action types for toast state management
export const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

export type ActionType = typeof actionTypes;

// Action types for state reducer
export type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

export interface ToastState {
  toasts: ToasterToast[];
}

// Parameters for creating a toast (without id)
export type Toast = Omit<ToasterToast, "id">; 