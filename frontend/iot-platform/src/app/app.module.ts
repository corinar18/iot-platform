import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { DatasetPositionsComponent } from './dataset-positions/dataset-positions.component';
import { SensorsComponent } from './sensors/sensors.component';
import { FacesComponent } from './faces/faces.component';

import { MatButtonModule } from '@angular/material';
import { MatMenuModule } from '@angular/material';
import { HttpClientModule } from '@angular/common/http';
import {MatSelectModule} from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule, MatInputModule } from '@angular/material';
import { DatasetPositionService } from './services/dataset-positions.service';
import { SensorsService } from './services/sensors.service';
import { ChartModule } from 'angular2-highcharts';
import {HighchartsStatic} from 'angular2-highcharts/dist/HighchartsService';
import * as Highcharts from 'highcharts';
import { chart } from 'highcharts';

export function highchartsFactory() {
  var hc = require('highcharts');
  var hcm = require('highcharts/highcharts-more');
  var exp = require('highcharts/modules/exporting');

  hcm(hc);
  exp(hc);
  return hc;
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DatasetPositionsComponent,
    SensorsComponent,
    FacesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatButtonModule,
    MatSelectModule,
    HttpClientModule,
    MatMenuModule,
    BrowserAnimationsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ChartModule
  ],
  providers: [
    DatasetPositionService,
    SensorsService,
    {provide: HighchartsStatic, useFactory: highchartsFactory},
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
