import { Component, Inject, OnInit } from '@angular/core';
import { WeatherService } from '../../service/weather.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-alert-modal',
    templateUrl: './alert-modal.component.html',
    styleUrls: ['./alert-modal.component.css']
})
export class AlertModalComponent implements OnInit {
    error = '';
    get appName() {
        return this.weatherService.appName;
    }

    constructor(private weatherService: WeatherService,
        public dialogRef: MatDialogRef<AlertModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: string) { }

    ngOnInit(): void {
        this.error = this.data;
    }

    close() {
        this.dialogRef.close();
    }
}
