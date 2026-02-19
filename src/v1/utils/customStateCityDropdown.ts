import {
  City,
  Country,
  CountryState,
  CountryStateCity,
  Language,
  Phonecodes,
  Region,
  State,
} from "../types";

export const GetRegions = async (src?: string): Promise<Region[] | []> => {
  let url =
    "https://venkatmcajj.github.io/react-country-state-city/data/regionsminified.json";
  if (src) url = src + "/regionsminified.json";
  const regions = await fetch(url).then((res) => res.json());
  return regions as Array<Region>;
};
export const GetPhonecodesByRegion = async (
  _region: string,
  src?: string
): Promise<Phonecodes[] | []> => {
  let url =
    "https://venkatmcajj.github.io/react-country-state-city/data/countriesminified.json";
  if (src) url = src + "/countriesminified.json";
  const countries = await fetch(url).then((res) => res.json());
  let filtered = countries as Array<Phonecodes>;
  if (_region) {
    filtered = filtered.filter((country: Phonecodes) => {
      return country.region === _region;
    });
  }
  return filtered.map((item) => {
    return {
      id: item.id,
      name: item.name,
      phone_code: item.phone_code,
      region: item.region,
    };
  });
};
export const GetPhonecodes = async (
  src?: string
): Promise<Phonecodes[] | []> => {
  let url =
    "https://venkatmcajj.github.io/react-country-state-city/data/countriesminified.json";
  if (src) url = src + "/countriesminified.json";
  const countries = await fetch(url).then((res) => res.json());
  const filtered = countries as Array<Phonecodes>;
  return filtered.map((item) => {
    return {
      id: item.id,
      name: item.name,
      phone_code: item.phone_code,
      region: item.region,
    };
  });
};
export const GetCountriesByRegion = async (
  _region: string,
  src?: string
): Promise<Country[] | []> => {
  let url =
    "https://venkatmcajj.github.io/react-country-state-city/data/countriesminified.json";
  if (src) url = src + "/countriesminified.json";
  const countries = await fetch(url).then((res) => res.json());
  let filtered = countries as Array<Country>;
  if (_region) {
    filtered = filtered.filter((country: Country) => {
      return country.region === _region;
    });
  }
  return filtered;
};
export const GetCountries = async (src?: string): Promise<Country[] | []> => {
  let url =
    "https://venkatmcajj.github.io/react-country-state-city/data/countriesminified.json";
  if (src) url = src + "/countriesminified.json";
  const countries = await fetch(url).then((res) => res.json());
  return countries as Array<Country>;
};

export const GetLanguages = async (src?: string): Promise<Language[] | []> => {
  let url =
    "https://venkatmcajj.github.io/react-country-state-city/data/languagesminified.json";
  if (src) url = src + "/languagesminified.json";
  const languages = await fetch(url).then((res) => res.json());
  return languages as Array<Language>;
};

export const GetState = async (
  id: number,
  src?: string
): Promise<Array<State> | []> => {
  let url =
    "https://venkatmcajj.github.io/react-country-state-city/data/statesminified.json";
  if (src) url = src + "/statesminified.json";
  const states = await fetch(url).then((res) => res.json());
  const record = states as Array<CountryState>;
  const statesone = record.find((e: CountryState) => e.id === id);
  const state = statesone && statesone.states ? statesone.states : [];
  return state;
};

export const GetCity = async (
  countryid: number,
  stateid: number,
  src?: string
): Promise<Array<City> | []> => {
  let url =
    "https://venkatmcajj.github.io/react-country-state-city/data/citiesminified.json";
  if (src) url = src + "/citiesminified.json";
  const cities = await fetch(url).then((res) => res.json());
  const record = cities as Array<CountryStateCity>;
  const countries = record.find((e: CountryStateCity) => e.id === countryid);
  if (countries) {
    const states = countries && countries.states ? countries.states : [];
    const city = states.find((e) => e.id === stateid);
    return city && city.cities ? city.cities : [];
  } else {
    return [];
  }
};
export const GetAllCities = async (src?: string): Promise<Array<City> | []> => {
  let url =
    "https://venkatmcajj.github.io/react-country-state-city/data/citiesminified.json";
  if (src) url = src + "/citiesminified.json";
  const cities = await fetch(url).then((res) => res.json());
  const record = cities as Array<CountryStateCity>;
  const allCities = [];
  for (const country of record) {
    for (const state of country.states) {
      for (const city of state.cities) {
        allCities.push(city);
      }
    }
  }
  return allCities;
};
