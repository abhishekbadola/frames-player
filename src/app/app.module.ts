import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { NgxUiLoaderModule } from 'ngx-ui-loader';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    NgxUiLoaderModule.forRoot({
        "bgsColor": "red",
        "bgsOpacity": 0.3,
        "bgsPosition": "bottom-right",
        "bgsSize": 60,
        "bgsType": "ball-spin-clockwise",
        "blur": 1,
        "delay": 0,
        "fgsColor": "#ff9735",
        "fgsPosition": "center-center",
        "fgsSize": 60,
        "fgsType": "rectangle-bounce-pulse-out-rapid",
        "gap": 24,
        "logoPosition": "center-center",
        "logoSize": 120,
        "logoUrl": "",
        "masterLoaderId": "master",
        "overlayBorderRadius": "0",
        "overlayColor": "rgba(40, 40, 40, 0.8)",
        "pbColor": "#ff9735",
        "pbDirection": "ltr",
        "pbThickness": 3,
        "hasProgressBar": false,
        "text": "Buffering...",
        "textColor": "#FFFFFF",
        "textPosition": "center-center",
        "maxTime": -1,
        "minTime": 300
      }),
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
