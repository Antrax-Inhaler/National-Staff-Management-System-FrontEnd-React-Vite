import React, {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from "react";
import Dropdown from "./Dropdown";
import { GetState } from "./utils";

export interface State {
  id: number;
  name: string;
  state_code: string;
  latitude: string;
  longitude: string;
  hasCities: boolean;
}

type PageProps = InputHTMLAttributes<HTMLInputElement> & {
  containerClassName?: string;
  inputClassName?: string;
  onChange?: (state: State) => void;
  onTextChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  defaultValue?: State | string;
  defaultStateId?: number;
  countryid: number;
  placeHolder?: string;
  src?: string;
};

const StateSelect = ({
  containerClassName,
  inputClassName,
  onTextChange,
  defaultValue,
  defaultStateId,
  onChange,
  countryid,
  placeHolder,
  src,
  ...props
}: PageProps) => {
  const [states, setStates] = useState<State[]>([]);
  const hasInitialized = useRef(false);

  // Fetch states when country changes
  useEffect(() => {
    if (!countryid) return;

    setStates([]);
    hasInitialized.current = false;

    GetState(countryid, src).then((data) => {
      setStates(data);
    });
  }, [countryid, src]);

  // Resolve default selection AFTER states load
  useEffect(() => {
    if (!states.length || hasInitialized.current) return;

    hasInitialized.current = true;

    // 1️⃣ Priority: defaultStateId
    if (defaultStateId) {
      const found = states.find((s) => s.id === defaultStateId);
      if (found) {
        onChange?.(found);
        return;
      }
    }

    // 2️⃣ Fallback: defaultValue (name or State)
    if (defaultValue) {
      const name =
        typeof defaultValue === "string"
          ? defaultValue
          : defaultValue.name;

      const found = states.find((s) => s.name === name);
      if (found) {
        onChange?.(found);
      }
    }
  }, [states, defaultStateId, defaultValue, onChange]);

  return (
    <div className={containerClassName} style={{ position: "relative" }}>
      <Dropdown
        {...props}
        placeHolder={placeHolder}
        options={states}
        onChange={(value) => onChange?.(value as State)}
        onTextChange={onTextChange}
        defaultValue={defaultValue}
        inputClassName={inputClassName}
      />
    </div>
  );
};

export default StateSelect;
