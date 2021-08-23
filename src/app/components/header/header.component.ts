import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, takeWhile } from 'rxjs/operators';
import { WeatherService } from '../../service/weather.service';
import { changeTemperatureType, setSelectedCity } from '../../store/location.actions';
import { LocationState } from '../../store/location.reducer';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
    favoritesCount = 0;
    killSubscribers = new Subject();
    temperatureType = "°C";

    get appName() {
        return this.weatherService.appName
    }

    constructor(private weatherService: WeatherService, private locationStore : Store<{locations: LocationState}>, private router: Router) { }

    ngOnInit(): void {
        // Listen for store dispatch/action events
        this.locationStore.select('locations')
        .pipe(
            takeUntil(this.killSubscribers)
        )
        .subscribe(state => {
            this.favoritesCount = state.favorites.size
            this.temperatureType = state.temperatureType;
        });
    }

    /**
     * On temperature type change
     * @param newType 
     */
    onTemperatureTypeChange(newType: string) {
        this.temperatureType = newType;
        this.locationStore.dispatch(changeTemperatureType({temperatureType: this.temperatureType}));
    }

    /**
     * Open default/geolocation city
     */
    openDefaultCity() {
        this.locationStore.dispatch(setSelectedCity({selected:undefined}));
        this.router.navigate(['home']);
    }

    ngOnDestroy(): void {
        this.killSubscribers.next();
    }
}
