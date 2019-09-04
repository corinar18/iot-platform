import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { DatasetPositionsComponent } from './dataset-positions/dataset-positions.component';
import { SensorsComponent } from './sensors/sensors.component';
import { FacesComponent } from "./faces/faces.component";
import { AppComponent } from './app.component';

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: '', component: HomeComponent },
  { path: 'dataset-positions', component: DatasetPositionsComponent},
  { path: 'sensors', component: SensorsComponent},
  { path: 'faces', component: FacesComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
