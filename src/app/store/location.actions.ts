import { createAction, props } from '@ngrx/store';

export const setSelectedCity = createAction('SET_SELECTED_CITY',   
props<{ selected : any }>());

export const addFavorite = createAction('ADD_FAVORITE',   
props<{ city : any }>());
 
export const removeFavorite = createAction(
    'REMOVE_FAVORITE',
    props<{ city : any }>()
);

export const changeTemperatureType = createAction('CHANGE_TEMPERATURE',   
props<{ temperatureType : string }>());