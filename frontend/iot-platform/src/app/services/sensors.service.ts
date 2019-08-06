import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class SensorsService {
  baseUrl = 'http://localhost:3000/sensors';

  constructor(private httpClient: HttpClient) {
  }

  getNodes() {
    return this.httpClient.get(this.baseUrl + '/nodes');
  }

  getAverageTemperatureForNode(node: string) {
    return this.httpClient.get(this.baseUrl + '/average-temperatures/' + node);
  }

  getAverageTemperatures () {
    return this.httpClient.get(this.baseUrl + '/average-temperatures');
  }

  getTemperaturesPerYear (year: number) {
    return this.httpClient.get(this.baseUrl + '/temperatures/' + year.toString());
  }
}
