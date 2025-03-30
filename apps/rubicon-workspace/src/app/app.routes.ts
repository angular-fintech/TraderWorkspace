import { Route } from '@angular/router';


export const appRoutes: Route[] = [
  {
    path: 'app',
    loadComponent: () => import('./provider/app.component').then(m => m.AppComponent),
  },
  {
    path:'order',
    loadComponent: () => import('./views/order-blotter/order-blotter.component').then(m => m.OrderBlotterComponent)
  }
];
