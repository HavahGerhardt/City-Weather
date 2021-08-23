import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, Subscriber, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WeatherService } from '../../service/weather.service';
import { setSelectedCity } from '../../store/location.actions';
import { LocationState } from '../../store/location.reducer';

@Component({
    selector: 'app-favorites',
    templateUrl: './favorites.component.html',
    styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent implements OnInit, OnDestroy {
    favoritesArr : Array<any> = [];
    killSubscribers = new Subject();

    constructor(private weatherService: WeatherService, private locationStore : Store<{locations:LocationState}>, private router : Router) { }

    ngOnInit() {
        // Listen for store dispatch/action events 
        // Can be done more effectively if it'll listen for 'favorites' events only
        this.locationStore.select('locations')
        .pipe(takeUntil(this.killSubscribers))
        .subscribe(state => {
            this.favoritesArr = [];
            state.favorites.forEach((city, cityKey) => {
                if(!city || !city.LocalizedName || !city.currWeather) {
                    // Get city object and push it to favorites
                    this.weatherService.getCity(cityKey, true, false)
                    .then(city => this.favoritesArr.push(city))
                    .catch(error => console.log('get favorite city error', error)); // We don't need alert here because this is not a user interactive
                }
                else {
                    this.favoritesArr.push(city);
                }
            });
        });
    }

    /**
     * Show more details
     * Show city weather and forecast
     * @param city 
     */
    showMoreDetails(city: any) {
        // Dispatch selected city
        this.weatherService.selectCity(city.Key)
        // Navigate home
        this.router.navigate(['/home']);
    }

    ngOnDestroy(): void {
        this.killSubscribers.next();
    }
}
