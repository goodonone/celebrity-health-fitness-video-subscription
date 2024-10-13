import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import * as WebFont from 'webfontloader';

WebFont.load({
  custom: {
    families: ['Outfit'],
    urls: ['./assets/Fonts/Outfit.css']
  }
}); 


platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
