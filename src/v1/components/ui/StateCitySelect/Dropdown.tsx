import React, {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";

export interface Region {
  id: number;
  name: string;
  hasCountries: boolean;
}

export interface Country {
  id: number;
  name: string;
  iso3: string;
  iso2: string;
  numeric_code: string;
  phone_code: string;
  capital: string;
  currency: string;
  currency_name: string;
  currency_symbol: string;
  native: string;
  region: string;
  subregion: string;
  emoji: string;
  emojiU: string;
  tld: string;
  latitude: string;
  longitude: string;
  hasStates: boolean;
}

export interface State {
  id: number;
  name: string;
  state_code: string;
}

export interface City {
  id: number;
  name: string;
}

type ComponentProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "defaultValue" | "onChange"
> & {
  placeHolder?: string;
  options: Array<Region | Country | State | City>;
  inputClassName?: string;
  onTextChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  defaultValue?: string | number | Region | Country | State | City;
  onChange: (e: Region | Country | State | City) => void;
  showFlag?: boolean;
};

const Dropdown = ({
  placeHolder,
  options,
  onChange,
  inputClassName,
  onTextChange,
  defaultValue,
  showFlag = true,
  ...props
}: ComponentProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [selectedValue, setSelectedValue] = useState<
    Region | Country | State | City
  >();
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultValue) {
      if (typeof defaultValue === "string") {
        const matchedOption = options.find((obj) => obj.name === defaultValue);
        if (matchedOption) setSelectedValue(matchedOption);
      } else if (typeof defaultValue === "number") {
        const matchedOption = options.find((obj) => obj.id === defaultValue);
        if (matchedOption) setSelectedValue(matchedOption);
      } else {
        setSelectedValue(defaultValue);
      }
    }
  }, [defaultValue, options]);

  useEffect(() => {
    setSearchValue("");
    if (showMenu && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showMenu]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  };

  const getDisplay = () => {
    if (!selectedValue) {
      return searchValue ? searchValue : "";
    }
    return `${
      showFlag && "emoji" in selectedValue ? selectedValue.emoji + " " : ""
    }${selectedValue.name}`;
  };

  const onItemClick = (option: Region | Country | State | City) => {
    setSelectedValue(option);
    onChange(option);
    setShowMenu(false);
  };

  const isSelected = (option: Region | Country | State | City) => {
    if (!selectedValue) {
      return false;
    }
    return selectedValue.id === option.id;
  };

  const onSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setSelectedValue(undefined);
    if (onTextChange) {
      onTextChange(e);
    }
  };

  const getOptions = () => {
    if (!searchValue) {
      return options;
    }
    return options.filter(
      (option) =>
        option.name.toLowerCase().indexOf(searchValue.toLowerCase()) >= 0
    );
  };

  return (
    <div className="stdropdown-container">
      <div
        ref={inputRef}
        onClick={handleInputClick}
        className="stdropdown-input stsearch-box"
      >
        <input
          {...props}
          className={inputClassName}
          onChange={onSearch}
          value={getDisplay()}
          placeholder={placeHolder}
          ref={searchRef}
        />
        <div className="stdropdown-tools">
          <div className="stdropdown-tool">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>
      {showMenu && (
        <div className="stdropdown-menu">
          {getOptions().map((option) => (
            <div
              onClick={() => onItemClick(option)}
              key={option.id}
              className={`stdropdown-item text-xs ${isSelected(option) && "selected"}`}
            >
              {showFlag && (
                <span className="stdropdown-flag">
                  {"emoji" in option ? option.emoji : ""}{" "}
                </span>
              )}
              {option.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;