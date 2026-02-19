import type { City } from "../CitySelect";
import type { Country } from "../Dropdown";
import type { State } from "../StateSelect";
import type { CountryState, CountryStateCity, Language } from "../types";

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
