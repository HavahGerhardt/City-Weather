import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { LocationState } from 'src/app/store/location.reducer';
import { filter, takeUntil, takeWhile } from 'rxjs/operators';
import { WeatherService } from '../../service/weather.service';
import { setSelectedCity } from 'src/app/store/location.actions';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
    killSubscribers = new Subject();
    defaultCity = 'Tel Aviv';
    selectedCity: any;

    constructor(private weatherService: WeatherService, private locationStore : Store<{locations:LocationState}>) { }

    ngOnInit(): void {
        // Get geolocation or default city if no city is selected
        this.locationStore.select('locations')
        .pipe(
            //takeUntil(this.killSubscribers),
        )
        .subscribe(state => {
            if(!state.selectedCity) {
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
            else {
                this.selectedCity = state.selectedCity;
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
            this.weatherService.selectCity(cityKey);
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
            this.weatherService.selectCity(cityKey);
        }
    }

    ngOnDestroy(): void {
        this.killSubscribers.next();
    }
}
