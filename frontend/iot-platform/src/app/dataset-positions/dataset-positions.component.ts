import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatasetPositionService } from '../services/dataset-positions.service';

export class Coordinate {
   constructor(public x: number,
               public y: number,
               public z: number) {}
}

export class NearbyObject {
  constructor(public geoLocation: Coordinate,
              public label: string,
              public type: string) {}
}


@Component({
  selector: 'app-dataset-positions',
  templateUrl: './dataset-positions.component.html',
  styleUrls: ['./dataset-positions.component.css']
})
export class DatasetPositionsComponent implements OnInit {
  labels: string[];
  coordinate: Coordinate;
  nearbyObjects: any;


  constructor(private http: HttpClient, private datasetService: DatasetPositionService) {
    this.datasetService.getLabels().subscribe((res: string[]) => {
      console.log(res);
      this.labels = res;
    });
  }

  ngOnInit() {
  }

  searchLastPosition(selectedLabel: string) {
    this.datasetService.getLastKnownPosition(selectedLabel).subscribe((res: any) => {
      this.coordinate = new Coordinate(parseInt(res[0]['coordinate']['x'], 10),
                      parseInt(res[0]['coordinate']['y'], 10),
                      parseInt(res[0]['coordinate']['z'], 10));
    });
  }

  searchNearbyObjects(x1: number, y1: number, x2: number, y2: number) {
    this.nearbyObjects = new Array<NearbyObject>();
    this.datasetService.getNearbyObjects(x1, y1, x2, y2).subscribe((res: any) => {
      res.forEach( (obj) => {
        const geoLocation = new Coordinate(obj['geoLocation'][0],
                                        obj['geoLocation'][1],
                                        0);
        const label = obj['label'];
        const type = obj['type'];
        const nearbyObj = new NearbyObject(geoLocation, label, type);
        this.nearbyObjects.push(nearbyObj);
      });
    });
  }
}
