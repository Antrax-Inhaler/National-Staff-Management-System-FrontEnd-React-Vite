import React, {
  useEffect,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from "react";
import Dropdown from "./Dropdown";
import { GetCity } from "./utils";

export interface City {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
}

type PageProps = InputHTMLAttributes<HTMLInputElement> & {
  containerClassName?: string;
  inputClassName?: string;
  onChange?: (e: City) => void;
  onTextChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  defaultValue?: City | string | null;
  countryid: number;
  stateid: number | null;
  placeHolder?: string;
  src?: string;
};

const CitySelect = ({
  containerClassName,
  inputClassName,
  onTextChange,
  defaultValue,
  onChange,
  countryid,
  stateid,
  placeHolder,
  src,
  ...props
}: PageProps) => {
  const [cities, setCities] = useState<City[]>([]);
  useEffect(() => {
    if (countryid) {
      GetCity(countryid, stateid, src).then((data) => {
        setCities(data);
      });
    }
  }, [countryid, stateid, src]);
  return (
    <>
      <div className={containerClassName} style={{ position: "relative" }}>
        <Dropdown
          {...props}
          placeHolder={placeHolder}
          options={cities}
          onChange={(value) => {
            if (onChange) {
              onChange(value as City);
            }
          }}
          onTextChange={onTextChange}
          defaultValue={defaultValue}
          inputClassName={inputClassName}
        />
      </div>
    </>
  );
};

export default CitySelect;
