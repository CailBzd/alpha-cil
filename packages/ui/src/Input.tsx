import type { InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ label, id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div>
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} {...props} />
    </div>
  );
}
