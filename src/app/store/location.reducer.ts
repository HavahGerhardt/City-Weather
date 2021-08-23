import { createReducer, on } from '@ngrx/store';
import { addFavorite, changeTemperatureType, removeFavorite, setSelectedCity } from './location.actions';
 
// localstorage keys
const favLocalStorageKey = 'favorites';
const temperatureLocalStorageKey = 'temperature';

/**
 * Get favorites from localstorage
 * @returns 
 */
function getSavedFavorites() {
    let favorites = new Map<string, any>();
    try {
        let favStr = localStorage.getItem(favLocalStorageKey);
        if(favStr) {
            // Try to convert it to a favorites array
            let keysArr = JSON.parse(favStr);
            // Fill map with empty objects (Will be filled later on navigating to 'favorites')
            if(Array.isArray(keysArr)) {
                for(let key of keysArr) {
                    favorites.set(key, {});
                }
            }
        }
    }
    catch(error) {
        console.log('get favorites parse error', error);
    }
    return favorites;
}

/**
 * Save favorites map to localstorage
 * @param favorites 
 */
function saveFavorites(favorites: Map<string, any>) {
    try {
        // Save favorites as cities keys array
        localStorage.setItem(favLocalStorageKey, JSON.stringify(Array.from(favorites.keys())));
    }
    catch(error) {
        console.log('save favorites parse error', error);
    }
}

/**
 * Get temperature type from localstorage
 */
function getTemperatureType() {
    let type = localStorage.getItem(temperatureLocalStorageKey);
    if(type && ['°F', '°C'].indexOf(type) >= 0)
        return type;
    return '°C';
}

/**
 * Save temperature type to localstorage
 */
 function saveTemperatureType(type: string) {
    if(type && ['°F', '°C'].indexOf(type) >= 0)
        localStorage.setItem(temperatureLocalStorageKey, type);
}

export interface LocationState {
    selectedCity: any,
    temperatureType: string,
    favorites : Map<string, any>
}

// Initial state
export const initialState : LocationState = {
    selectedCity: undefined,
    temperatureType: getTemperatureType(),
    favorites: getSavedFavorites()
};
 
/** 
 * Reducer
 */
export const locationReducer = createReducer(
    initialState,
    // Select city
    on(setSelectedCity, (state, { selected }) => ({...state, selectedCity: selected})),
    // Add a city to favorites
    on(addFavorite, (state, { city }) => {
        state.favorites.set(city.Key, city);
        saveFavorites(state.favorites);
        return {...state};
    }),
    // Remove a city from favorites
    on(removeFavorite, (state, { city }) => {
        state.favorites.delete(city.Key);
        saveFavorites(state.favorites);
        return {...state};
    }),
    // Change temperature type
    on(changeTemperatureType, (state, { temperatureType }) => {
        saveTemperatureType(temperatureType);
        return {...state, temperatureType: temperatureType};
    })
);