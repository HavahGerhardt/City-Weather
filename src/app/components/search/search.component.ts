import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { WeatherService } from '../../service/weather.service';
import { LocationState } from '../../store/location.reducer';

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.css'],
})
export class SearchComponent implements OnInit, OnDestroy {
    cities = new Array<any>();
    filteredOptions: Observable<string[]>;
    searchControl = new FormControl();
    searchChange = false;
    @Output() selectCity = new EventEmitter<string>();

    constructor(private weatherService : WeatherService, private locationStore : Store<{locations:LocationState}>) {}

    ngOnInit(): void {
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
        if(this.searchChange) {
            return;
        }

        this.searchChange = true;
        setTimeout(() => {
            this.searchChange = false;            
            // On search word change
            this.getSuggestedCities(this.searchControl.value)
            .catch(error => {
                console.log('getSuggestedCities error', error);
                this.weatherService.openAlertModal(error);
            });
        }, 1000);
    }

    /**
     * On select city
     * @param args 
     */
    onSelectionChanged(args: MatAutocompleteSelectedEvent) {
        // Make sure value is a city
        if(args.option.value.Key) {
            this.weatherService.selectCity(args.option.value.Key);
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
    }
}
