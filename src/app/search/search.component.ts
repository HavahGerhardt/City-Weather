import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { WeatherService } from '../service/weather.service';
import { setSelectedCity } from '../store/location.actions';
import { LocationState } from '../store/location.reducer';

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.css'],
})
export class SearchComponent implements OnInit, OnDestroy {
    cities = new Array<any>();
    filteredOptions: Observable<string[]>;
    selectedCity: any;
    searchControl = new FormControl();
    defaultCity = 'Tel Aviv';
    storeSub : Subscription;

    constructor(private weatherService : WeatherService, private locationStore : Store<{locations:LocationState}>) {}

    ngOnInit(): void {
        // Get geolocation or default city if no city is selected
        this.storeSub = this.locationStore.select('locations').subscribe(state => {
            if(!state.selectedCity || !state.selectedCity.Key) {
                if(navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(geolocation => {
                        if(geolocation.coords.latitude && geolocation.coords.longitude) {
                            this.getCityByGeo(geolocation.coords.latitude, geolocation.coords.longitude);
                        }
                    },
                    error => {
                        console.log('getCurrentPosition error', error)
                        this.getDefaultCity();
                    });
                }
                else {
                    this.getDefaultCity()
                }
            }
        });
    }

    /**
     * Get city by geolocation
     */
    async getCityByGeo(latitude: number, longitude: number) {
        // Check if we have city key
        let localStorageKey = `geo-${latitude}-${longitude}`;
        let cityKey = localStorage.getItem(localStorageKey);
        if(!cityKey) {
            await this.weatherService.getCityByGeo(latitude, longitude)
            .then((result:any) => {
                if(result.Key) {
                    cityKey = result.Key;
                    localStorage.setItem(localStorageKey, result.Key);
                }
            })
            .catch(error => {
                console.log('Could not found geolocation city', error, 'latitude', latitude, 'longitude', longitude);
            });
        }

        // Select city
        if(cityKey) {
            this.selectCity(cityKey);
        }
        else {
            // Get the default city if we can not get it
            this.getDefaultCity();
        }
    }

    /**
     * Get default city
     */
    async getDefaultCity() {
        // Check if we have the default city key
        let cityKey = localStorage.getItem(this.defaultCity);
        
        // Get city key
        if(!cityKey) {
            await this.weatherService.getCityByName(this.defaultCity)
            .then((result:any) => {
                if(result && result.Key) {
                    cityKey = result.Key;
                    localStorage.setItem(this.defaultCity, result.Key);
                    this.weatherService.saveCity(result);
                }
            })
            .catch(error => {
                // We don't need alert here because this is not a user interactive
                console.log('get city key error', error);
            });
        }

        // Select the default city
        if(cityKey) {
            this.selectCity(cityKey);
        }
    }

    /**
     * Get suggested cities by a search word
     * @param searchWord 
     * @returns 
     */
    getSuggestedCities(searchWord: string) {
        return new Promise<void>((resolve, reject) => {
            // Reset previous search results
            this.cities.splice(0, this.cities.length);
            
            // Search is empty
            if(searchWord == '') {
                return resolve();
            }

            // Check if we have already search this today
            let localStorageKey = this.weatherService.getDateYYYYMMDD() + '-search-' + searchWord.toLowerCase();
            let savedResults = this.weatherService.getSavedData(localStorageKey);

            // We have results on localstorage
            // Note: the local results is a simple array with cities keys
            if(savedResults && Array.isArray(savedResults) && savedResults.length) {
                for(let cityKey of savedResults) {
                    // Check if we have such city on localstorage.
                    let city = this.weatherService.getSavedCity(cityKey);
                    // We don't have it, so we must get it from the autocomplete request.
                    if(!city || !city.LocalizedName) 
                        break;
                    this.cities.push(city);
                }

                // We got all suggested cities objects from localstorage
                if(this.cities.length == savedResults.length)
                    return resolve();
            }

            // Get suggested cities from API
            this.weatherService.autoComplete(searchWord)
            .then(results => {
                if(Array.isArray(results)) {
                    // Get city results
                    for(let city of results.filter(data => data.Type == 'City')) {
                        if(city.LocalizedName && city.Key) {
                            this.cities.push(city);
                        }
                    }

                    // Save search results
                    localStorage.setItem(localStorageKey, JSON.stringify(this.cities.map(city => city.Key)));
                }
                resolve();
            })
            .catch(error => {
                console.log('autoComplete error', error);
                reject(error);
            });
        })
    }

    /**
     * On search word change (by user)
     */
    onSearchChange() {
        // On search word change
        this.getSuggestedCities(this.searchControl.value)
        .catch(error => {
            console.log('getSuggestedCities error', error);
            this.weatherService.openAlertModal(error);
        });
    }

    /**
     * Select city to display on home page
     * @param cityKey 
     */
    selectCity(cityKey: string) {
        // Get the selected city's weather and forecast
        this.weatherService.getCity(cityKey, true, true)
        .then(city => {
            this.selectedCity = city;
            // Dispatch selected city
            this.locationStore.dispatch(setSelectedCity({selected: this.selectedCity}));
        })
        .catch(error => {
            console.log('Get city error', error)
            this.weatherService.openAlertModal(error);
        });
    }

    /**
     * On select city
     * @param args 
     */
    onSelectionChanged(args: MatAutocompleteSelectedEvent) {
        // Make sure value is a city
        if(args.option.value.Key) {
            this.selectCity(args.option.value.Key);
        }
    }

    /**
     * Get the selected city name
     * @param city 
     * @returns 
     */
    getCityName(city: any) {
        if(city && city.LocalizedName)
            return city.LocalizedName;
        return '';
    }

    ngOnDestroy() {
        if(this.storeSub) {
            this.storeSub.unsubscribe();
        }
    }
}
