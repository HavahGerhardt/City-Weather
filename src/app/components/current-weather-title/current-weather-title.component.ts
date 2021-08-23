import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { WeatherService } from '../../service/weather.service';
import { addFavorite, removeFavorite } from '../../store/location.actions';
import { LocationState } from '../../store/location.reducer';

@Component({
  selector: 'app-current-weather-title',
  templateUrl: './current-weather-title.component.html',
  styleUrls: ['./current-weather-title.component.css']
})
export class CurrentWeatherTitleComponent implements OnInit, OnDestroy, OnChanges {
    @Input() city : any;
    isFavorite = false;
    temperatureType: string;

    constructor(private weatherService: WeatherService, private locationStore : Store<{locations:LocationState}>) { }

    ngOnInit(): void {
    }

    ngOnChanges(changes: SimpleChanges) {
        // If city has been changed, check if is a favorite
        this.locationStore.select('locations')
        .pipe(take(1))
        .subscribe(state => {
            this.isFavorite = state.favorites.has(this.city.Key);
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

    /**
     * Toggle favorite
     */
    toggleFavorite() {
        this.isFavorite = !this.isFavorite;
        // Add to favorites
        if(this.isFavorite) {
            this.locationStore.dispatch(addFavorite({city:this.city}));
        }
        else { // Remove from favorites
            this.locationStore.dispatch(removeFavorite({city:this.city}));
        }
    }

    getTemperature(temperatureObj: any) {
        return this.weatherService.getTemperature(temperatureObj, this.temperatureType);
    }

    ngOnDestroy() {
    }
}
