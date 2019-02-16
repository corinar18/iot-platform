import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SensorsService } from '../services/sensors.service';
import { chart } from 'highcharts';
import * as Highcharts from 'highcharts';

export class NodeInfo {
  constructor (public id: string,
              public sensorsCount: number,
              public avgTemp: number) {}
}

@Component({
  selector: 'app-sensors',
  templateUrl: './sensors.component.html',
  styleUrls: ['./sensors.component.css']
})

export class SensorsComponent implements OnInit {
  nodes: string[];
  avgTemperature: number;
  totalAvgTemperatures: any;
  temperaturesPerYear: any[] = [];
  chart: Highcharts.ChartObject;

  constructor(private http: HttpClient, private sensorsService: SensorsService) {
    this.sensorsService.getNodes().subscribe((res: string[]) => {
      console.log(res);
      this.nodes = res;
    });
  }


  ngOnInit() {
  }

  @ViewChild('chartTarget') chartTarget: ElementRef;

  ngAfterViewInit() {
    const options: Highcharts.Options = {
      chart: {
        type: 'spline'
      },
      title: {
        text: 'Temperatures recorded over one year (2024)'
      },
      subtitle: {
        text: ''
      },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: { // don't display the dummy year
          month: '%e. %b',
          year: '%b'
        },
        title: {
          text: 'Date (Unix format)'
        }
      },
      yAxis: {
        title: {
          text: 'Temperature (Celsius degrees)'
        },
        min: 0
      },
      tooltip: {
        headerFormat: '<b>{series.name}</b><br>',
        pointFormat: '{point.x:%e. %b}: {point.y:.2f} m'
      },

      plotOptions: {
        spline: {
          marker: {
            enabled: true
          }
        }
      },

      colors: ['#FF0000', '#8B0000', '#FA8072', '#CD5C5C', '#DC143C'],

      series: [{
        name: "",
        data: [
          [1710988894, 25],
          [1712177206, 24],
          [1712273846, 32],
          [1722840715, 26]
        ]
      }]
    };
    this.chart = chart(this.chartTarget.nativeElement, options);
  }

  searchAverageTemperature(selectedNode: string) {
    this.sensorsService.getAverageTemperatureForNode(selectedNode).subscribe((res: any) => {
      this.avgTemperature = parseInt(res[0]["value"]["average"]);
    });
  }

  searchTotalAverageTemperature() {
    this.totalAvgTemperatures = new Array<NodeInfo>();
    this.sensorsService.getAverageTemperatures().subscribe((res:any) => {
      res.forEach((node) => {
        let id = node["_id"];
        let count = node["value"]["count"];
        let avgTemp = node["value"]["average"];
        let nodeInfo = new NodeInfo(id, count, avgTemp);
        this.totalAvgTemperatures.push(nodeInfo);
      });
    });
  }

  searchTemperaturesPerYear(year: number) {
    this.sensorsService.getTemperaturesPerYear(year).subscribe((res:any) => {
      res.forEach((obj) => {
        let timestamp = obj["timestamp"];
        let temperature = obj["temperature"];
        let tempInfo = [timestamp, temperature];
        console.log(tempInfo);
        this.temperaturesPerYear.push(tempInfo);
      });
    });
  }
}
