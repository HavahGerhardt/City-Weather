import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, Subscription } from 'rxjs';
import { filter, takeUntil, takeWhile } from 'rxjs/operators';
import { LocationState } from '../../store/location.reducer';

@Component({
  selector: 'app-daily-forecast',
  templateUrl: './daily-forecast.component.html',
  styleUrls: ['./daily-forecast.component.css']
})
export class DailyForecastComponent implements OnInit, OnDestroy {
    selectedCity: any;
    date : Date;
    killSubscribers = new Subject();
    
    constructor(private locationStore: Store<{locations:LocationState}>) { }

    ngOnInit(): void {
        // Listen for store dispatch/action events 
        this.locationStore.select('locations')
        .pipe(
            takeUntil(this.killSubscribers),
            filter(state => state.selectedCity) // Listen for selected city change events
        )
        .subscribe(state => this.selectedCity = state.selectedCity);
    }

    ngOnDestroy(): void {
        this.killSubscribers.next();
    }
}
