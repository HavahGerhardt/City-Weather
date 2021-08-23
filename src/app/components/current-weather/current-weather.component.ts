import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { WeatherService } from '../../service/weather.service';
import { LocationState } from '../../store/location.reducer';

@Component({
    selector: 'app-current-weather',
    templateUrl: './current-weather.component.html',
    styleUrls: ['./current-weather.component.css']
})
export class CurrentWeatherComponent implements OnInit, OnDestroy {
    selectedCity : any;
    storeSub : Subscription;
    temperatureType: string;

    constructor(private weatherService: WeatherService, private locationStore : Store<{locations:LocationState}>) { }

    ngOnInit(): void {
        // Listen for store dispatch/action events 
        // Can be done more effectively if it'll listen for 'select city' events only
        this.storeSub = this.locationStore.select('locations').subscribe(state => {
            this.temperatureType = state.temperatureType;
            // Change selected city only if city key was changed
            if(!this.selectedCity || this.selectedCity.Key != state.selectedCity.Key) {
                this.selectedCity = state.selectedCity;
            }
        });        
    }

    /**
     * Get weather icon
     * @param iconNum 
     * @returns 
     */
    getIcon(iconNum: string | number) {
        return this.weatherService.getIcon(iconNum);
    }

    getTemperature(temperatureObj: any) {
        return this.weatherService.getTemperature(temperatureObj, this.temperatureType);
    }

    ngOnDestroy(): void {
        if(this.storeSub)
            this.storeSub.unsubscribe();
    }
}
