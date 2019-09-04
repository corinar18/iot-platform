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

export class Extreme {
  constructor(public min: number,
              public max: number) {}
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
  coordinates: number[][];
  dataExtremes: Extreme[];
  dataRange: number[];
  means: number[][];
  assignments: number[];
  drawDelay: number;
  ctx: any;


  constructor(private http: HttpClient, private datasetService: DatasetPositionService) {
    this.datasetService.getLabels().subscribe((res: string[]) => {
      console.log(res);
      this.labels = res;
      this.means = [];
      this.assignments = [];
      this.drawDelay = 2000;
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

  searchLabelAppearances(selectedLabel: string) {
    this.datasetService.getCoordinates(selectedLabel).subscribe((res: any) => {
      this.coordinates = res;
      this.setup();
    });
  }

  // k-means functions
  getDataRanges(extremes: Extreme[]): number[] {
    let ranges = [];
    for (const dimension in extremes)
    {
      ranges[dimension] = extremes[dimension].max - extremes[dimension].min;
    }
    return ranges;
  }

  getDataExtremes(): any {
    let extremes = [];
    for (const i in this.coordinates)
    {
      let point = this.coordinates[i];
      for (let dimension in point)
      {
        if (!extremes[dimension]) {
          extremes[dimension] = {min: 5000, max: 0};
        }

        if (point[dimension] < extremes[dimension].min) {
          extremes[dimension].min = point[dimension];
        }

        if (point[dimension] > extremes[dimension].max) {
          extremes[dimension].max = point[dimension];
        }
      }
    }
    return extremes;
  }

  initMeans(k: number): number[][] {

    if (!k) {
      k = 3;
    }

    while (k--) {
      let mean = [];
      for (let dimension in this.dataExtremes)
      {
        mean[dimension] = this.dataExtremes[dimension].min + (Math.random() * this.dataRange[dimension]);
      }
      this.means.push(mean);
    }
    return this.means;
  };

  makeAssignments() {
    for (let i in this.coordinates) {
      let point = this.coordinates[i];
      let distances = [];

      for (let j in this.means) {
        let mean = this.means[j];
        let sum = 0;

        for (let dimension in point) {
          let difference = point[dimension] - mean[dimension];
          difference *= difference;
          sum += difference;
        }
        distances[j] = Math.sqrt(sum);
      }
      this.assignments[i] = distances.indexOf(Math.min.apply(null, distances));
    }
  }

  moveMeans() {
    this.makeAssignments();

    let sums = Array(this.means.length);
    let counts = Array(this.means.length);
    let moved = false;

    for (let j in this.means) {
      counts[j] = 0;
      sums[j] = Array(this.means[j].length );
      for (let dimension in this.means[j]) {
        sums[j][dimension] = 0;
      }
    }

    for (let pointIndex in this.assignments)
    {
      let meanIndex = this.assignments[pointIndex];
      let point = this.coordinates[pointIndex];
      let mean = this.means[meanIndex];

      counts[meanIndex]++;

      for (let dimension in mean)
      {
        sums[meanIndex][dimension] += point[dimension];
      }
    }

    for (let meanIndex in sums)
    {
      console.log(counts[meanIndex]);
      if (counts[meanIndex] === 0) {
        sums[meanIndex] = this.means[meanIndex];
        console.log("Mean with no points");
        console.log(sums[meanIndex]);

        for (let dimension in this.dataExtremes)
        {
          sums[meanIndex][dimension] = this.dataExtremes[dimension].min + ( Math.random() * this.dataRange[dimension]);
        }
        continue;
      }

      for (let dimension in sums[meanIndex])
      {
        sums[meanIndex][dimension] /= counts[meanIndex];
      }
    }

    if (this.means.toString() !== sums.toString())
    {
      moved = true;
    }
    this.means = [];
    this.means = sums;

    return moved;
  }

  setup() {
    let canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.ctx = canvas.getContext('2d');

    this.dataExtremes = this.getDataExtremes();
    this.dataRange = this.getDataRanges(this.dataExtremes);
    this.means = this.initMeans(2);

    this.makeAssignments();
    this.draw();

    setTimeout(this.run, this.drawDelay);
  }

  run() {

    let moved = this.moveMeans();
    this.draw();

    if (moved)
    {
      setTimeout(this.run, this.drawDelay);
    }
  }

  draw() {

    let width = 400;
    let height = 400;
    this.ctx.clearRect(0,0, width, height);

    this.ctx.globalAlpha = 0.3;
    for (let pointIndex in this.assignments) {
      let meanIndex = this.assignments[pointIndex];
      let point = this.coordinates[pointIndex];
      let mean = this.means[meanIndex];

      this.ctx.save();

      this.ctx.strokeStyle = 'blue';
      this.ctx.beginPath();
      this.ctx.moveTo(
        (point[0] - this.dataExtremes[0].min + 1) * (width / (this.dataRange[0] + 2) ),
        (point[1] - this.dataExtremes[1].min + 1) * (height / (this.dataRange[1] + 2) )
      );
      this.ctx.lineTo(
        (mean[0] - this.dataExtremes[0].min + 1) * (width / (this.dataRange[0] + 2) ),
        (mean[1] - this.dataExtremes[1].min + 1) * (height / (this.dataRange[1] + 2) )
      );
      this.ctx.stroke();
      this.ctx.closePath();

      this.ctx.restore();
    }
    this.ctx.globalAlpha = 1;

    for (let i in this.coordinates)
    {
      this.ctx.save();

      let point = this.coordinates[i];

      let x = (point[0] - this.dataExtremes[0].min + 1) * (width / (this.dataRange[0] + 2) );
      let y = (point[1] - this.dataExtremes[1].min + 1) * (height / (this.dataRange[1] + 2) );

      this.ctx.strokeStyle = '#333333';
      this.ctx.translate(x, y);
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 5, 0, Math.PI*2, true);
      this.ctx.stroke();
      this.ctx.closePath();

      this.ctx.restore();
    }

    for (let i in this.means)
    {
      this.ctx.save();

      let point = this.means[i];

      let x = (point[0] - this.dataExtremes[0].min + 1) * (width / (this.dataRange[0] + 2) );
      let y = (point[1] - this.dataExtremes[1].min + 1) * (height / (this.dataRange[1] + 2) );

      this.ctx.fillStyle = 'red';
      this.ctx.translate(x, y);
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 5, 0, Math.PI*2, true);
      this.ctx.fill();
      this.ctx.closePath();

      this.ctx.restore();
    }
  }
}
