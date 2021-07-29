import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AlertModalComponent } from '../alert-modal/alert-modal.component';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
    appName = 'City Weather';
    // accuWeather apiKey
    private apiKey = 'O1WQwjf9uAToDJI8of9UeburII3aWtBi';
    // Days array
    days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    constructor(private httpClient : HttpClient, public dialog: MatDialog) { }

    /**
     * Get city data with minimal API requests
     * If getWeather is true it'll request the current weather from API if not exists locally.
     * If getForecast is true it'll request the forecast from API if not exists locally.
     * @param cityKey 
     */
    getCity(cityKey : string, getWeather = false, getForecast = false) {
        return new Promise<any>((resolve, reject) => {
            // Get city object from localstorage
            let city = this.getSavedCity(cityKey);

            // Holds the API request
            let promises = [];

            // Invalid or not exists city object
            if(!city || !city.LocalizedName) {
                // Get city name and country from API
                promises.push(this.getCityByKey(cityKey))
            }

            // Make sure city has 'currWeather' property
            if(getWeather) {
                // Check the last currWeather timestamp
                let forceUpdate = false;
                if(city && city.currWeather) {
                    if(city.currWeather.EpochTime && !isNaN(city.currWeather.EpochTime)) {
                        // Current timestamp in secondes
                        let currTm = Date.now()/1000;
                        // Weather timestamp in secondes
                        let epochTime = +city.currWeather.EpochTime;
                        
                        // The city weather has not been updated for the last 3 hours
                        if(currTm - epochTime > 60 * 60 * 3) {
                            forceUpdate = true;
                        }
                    }
                }

                // Get current weather from API
                if(!city || !city.currWeather || forceUpdate) {
                    promises.push(this.getCurrentWeather(cityKey))
                }
            }

            // Make sure city has 'forecast' property
            // forecast not exists on invalid, get it from API
            if(getForecast && (!city || !city.forecast || !city.forecast.DailyForecasts)) {
                promises.push(this.getForecast(cityKey))
            }

            // We got all city data from localstorage, we are done.
            if(promises.length == 0) {
                return resolve(city);
            }

            // Get missing city data from API
            Promise.all(promises)
            .then(results => {
                // Merge results with city object
                for(let result of results) {
                    city = {...city, ...result};
                }
                // Save city to local storage
                this.saveCity(city);
                resolve(city);
            })
            .catch(error => {
                // Ops, we got an error
                reject(error);
            });
        });
    }

    /**
     * Get city by key from API
     * @param cityKey 
     * @returns 
     */
    private getCityByKey(cityKey: string) {
        return new Promise<any>((resolve, reject) => {
            this.httpClient.get(`http://dataservice.accuweather.com/locations/v1/${cityKey}`, {params: { apikey:this.apiKey, details:true }}).toPromise()
            .then(result => {
                if(result)
                    resolve(result);
                else {
                    reject('City could not be found');
                }
            })
            .catch((error: HttpErrorResponse) => {
                reject(error.message);
            });
        });
    }

    /**
     * Get city by name from API
     * @param cityName 
     * @returns 
     */
    getCityByName(cityName: string) {
        return new Promise((resolve, reject) => {
            this.httpClient.get(`http://dataservice.accuweather.com/locations/v1/cities/search`, {params: { apikey:this.apiKey, q:cityName }}).toPromise()
            .then(results => {
                if(Array.isArray(results) && results.length > 0) {
                    resolve(results[0]); // Return the first result
                }
                else {
                    reject('City could not be found');
                }
            })
            .catch((error: HttpErrorResponse) => {
                reject(error.message);
            });
        })
    }

    /**
     * Get city by geolocation latitude/longitude
     * @param latitude 
     * @param longitude 
     * @returns 
     */
    getCityByGeo(latitude: number, longitude: number) {
        return new Promise((resolve, reject) => {
            this.httpClient.get(`http://dataservice.accuweather.com/locations/v1/cities/geoposition/search`, {params: { apikey:this.apiKey, q:`${latitude},${longitude}` }}).toPromise()
            .then(result => {
                resolve(result);
            })
            .catch((error: HttpErrorResponse) => {
                reject(error.message);
            });
        });
    }

    /**
     * Autocomplete search
     * @param searchWord 
     * @returns 
     */
    autoComplete(searchWord: string) {
        return new Promise((resolve, reject) => {
            this.httpClient.get(`http://dataservice.accuweather.com/locations/v1/cities/autocomplete`, {params: { apikey:this.apiKey, q:searchWord }}).toPromise()
            .then(results => {
                resolve(results);
            })
            .catch((error: HttpErrorResponse) => {
                reject(error.message);
            });
        })
    }

    /**
     * Get city weather from API
     * @param locationKey 
     * @returns 
     */
    private getCurrentWeather(locationKey: string) {
        return new Promise<any>((resolve, reject) => {
            this.httpClient.get(`http://dataservice.accuweather.com/currentconditions/v1/${locationKey}`, {params:{ apikey:this.apiKey, details:true }}).toPromise()
            .then(results => {
                if(Array.isArray(results) && results.length > 0)
                    resolve({currWeather:results[0]}); // Return the first result
                else {
                    reject('City weather could not be found');
                }
            })
            .catch((error: HttpErrorResponse) => {
                reject(error.message);
            });
        })
    }

    /**
     * Get city forecast from API
     * @param locationKey 
     * @returns 
     */
    private getForecast(locationKey: string) {
        return new Promise<any>((resolve, reject) => {
            this.httpClient.get(`http://dataservice.accuweather.com/forecasts/v1/daily/5day/${locationKey}`, {params:{ apikey:this.apiKey, details:true, metric:true }}).toPromise()
            .then(result => {
                if(result) {
                    resolve({forecast:result});
                }
                else {
                    reject('City forecast could not be found');
                }
            })
            .catch((error: HttpErrorResponse) => {
                reject(error.message);
            });
        })
    }

    /**
     * Get weather icon
     * @param iconCode 
     * @returns 
     */
    getIcon(iconCode: string | number) {
        let icon = String(iconCode).padStart(2,'0');
        return `https://developer.accuweather.com/sites/default/files/${icon}-s.png`
    }

    /**
     * Convert date object to 'YYYY-MM-DD' string format
     * @param date 
     * @returns 
     */
    getDateYYYYMMDD(date = new Date()) {
        return date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
    }

    /**
     * Get saved city object from localstorage
     * @param cityKey 
     * @returns 
     */
    getSavedCity(cityKey: string) {
        let city = this.getSavedData(this.getDateYYYYMMDD() + '-city-' + cityKey);
        return city.Key && city.LocalizedName && city;
    }

    /**
     * Save city to localstorage
     * @param city 
     */
    saveCity(city: any) {
        try {
            // Save it under the key '{today}-city-{cityKey}'
            let localStorageKey = this.getDateYYYYMMDD() + '-city-' + city.Key;
            localStorage.setItem(localStorageKey, JSON.stringify(city));
        }
        catch(error) {
            console.log('saveCity JSON error:', error);
        }
    }

    /**
     * Get localstorage data
     * @param key 
     * @param isJson 
     * @returns 
     */
    getSavedData(key: string) {
        // Get string value
        let data = localStorage.getItem(key);
        if(data) {
            try {
                // Try to convert it to an object
                let obj = JSON.parse(data);
                if(obj) {
                    return obj;
                }
            }
            catch(error) {
                console.log('getForecast JSON parse error:', error);
            }
        }
        return false;
    }

    /**
     * Open alert modal
     * @param error 
     */
    openAlertModal(error: string) {
        this.dialog.closeAll();
        this.dialog.open(AlertModalComponent, {
            data: error
        });
    }

    /**
     * Get the right temperature, according to the temperature type
     * @param obj 
     * @param temperatureType 
     * @returns 
     */
    getTemperature(getTemperature: any, temperatureType: string) {
        if(temperatureType == "°F") {
            if(getTemperature.Imperial && getTemperature.Imperial.Value) {
                return `${getTemperature.Imperial.Value} °${getTemperature.Imperial.Unit}`;
            }
        }
        // Default type is Celsius
        return `${getTemperature.Metric.Value} °${getTemperature.Metric.Unit}`;

    }
}
