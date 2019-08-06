import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class DatasetPositionService {
  baseUrl = 'http://localhost:3000/positions';

  constructor(private httpClient: HttpClient) {
  }

  getLabels() {
    return this.httpClient.get(this.baseUrl + '/labels');
  }

  getLastKnownPosition(label: string) {
    return this.httpClient.get(this.baseUrl + '/last-known-position/' + label);
  }

  getNearbyObjects(x1: number, y1: number, x2: number, y2: number) {
    return this.httpClient.get(this.baseUrl + '/nearby-objects/'
      + x1.toString() + '/'
      + y1.toString() + '/'
      + x2.toString() + '/'
      + y2.toString());
  }
}
