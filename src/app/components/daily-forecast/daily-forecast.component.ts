import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { LocationState } from '../../store/location.reducer';

@Component({
  selector: 'app-daily-forecast',
  templateUrl: './daily-forecast.component.html',
  styleUrls: ['./daily-forecast.component.css']
})
export class DailyForecastComponent implements OnInit, OnDestroy {
    selectedCity: any;
    date : Date;
    storeSub : Subscription;
    
    constructor(private locationStore: Store<{locations:LocationState}>) { }

    ngOnInit(): void {
        // Listen for store dispatch/action events 
        // Can be done more effectively if it'll listen for 'select city' events only
        this.storeSub = this.locationStore.select('locations').subscribe(state => {
            // Change selected city only if city key was changed
            if(!this.selectedCity || this.selectedCity.Key != state.selectedCity.Key) {
                this.selectedCity = state.selectedCity;        
            }
        });
    }

    ngOnDestroy(): void {
        if(this.storeSub)
            this.storeSub.unsubscribe();
    }
}
