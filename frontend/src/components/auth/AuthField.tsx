import { useState } from "react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";

type AuthFieldProps = {
  id: string;
  label: string;
  type: string;
  name: string;
  autoComplete?: string;
  required?: boolean;
};

export function AuthField({
  id,
  label,
  type,
  name,
  autoComplete,
  required = true,
}: AuthFieldProps) {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const onShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const setInputType = () => {
    if (type === "password") {
      return showPassword ? "text" : type;
    }
    return type;
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={id}
          name={name}
          type={setInputType()}
          autoComplete={autoComplete}
          required={required}
          className=" flex-1 h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400/10"
        />
        {type === "password" && (
          <button
            type="button"
            onClick={onShowPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-sm cursor-pointer"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? (
              <IoEyeOffOutline size={20} className="text-zinc-300" />
            ) : (
              <IoEyeOutline size={20} className="text-zinc-300" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
