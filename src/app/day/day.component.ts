import { Component, Input, OnInit } from '@angular/core';
import { WeatherService } from '../service/weather.service';

@Component({
    selector: 'app-day',
    templateUrl: './day.component.html',
    styleUrls: ['./day.component.css']
})
export class DayComponent implements OnInit {
    @Input() day: any;
    dayName = '';
    dayNum = 1;
    month = 1;
    detailed = false;
    constructor(private weatherService : WeatherService) { }

    ngOnInit(): void {
        // Get day and month
        if(this.day && Date.parse(this.day.Date)) {
            let date = new Date(this.day.Date);
            this.dayNum = date.getDate();
            this.month = date.getMonth() + 1;
            let dayOfWeak = date.getDay();
            if(this.weatherService.days.length > dayOfWeak) {
                this.dayName = this.weatherService.days[dayOfWeak];
            }
        }
    }

    /**
     * Get weather icon
     * @param iconNum 
     * @returns 
     */
    getIcon(iconNum: string | number) {
        return this.weatherService.getIcon(iconNum);
    }
}
