import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscriber, Subscription } from 'rxjs';
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
    storeSub : Subscription;

    constructor(private weatherService: WeatherService, private locationStore : Store<{locations:LocationState}>, private router : Router) { }

    ngOnInit() {
        // Listen for store dispatch/action events 
        // Can be done more effectively if it'll listen for 'favorites' events only
        this.storeSub = this.locationStore.subscribe(state => {
            this.favoritesArr = [];
            state.locations.favorites.forEach((city, cityKey) => {
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
        this.locationStore.dispatch(setSelectedCity({selected:city}));
        // Navigate home
        this.router.navigate(['/home']);
    }

    ngOnDestroy(): void {
        if(this.storeSub)
            this.storeSub.unsubscribe();
    }
}
