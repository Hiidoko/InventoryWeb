import { Routes } from '@angular/router';
import { ProductListComponent } from './components/product-list.component';
import { ProductFormComponent } from './components/product-form.component';
import { AnalyticsDashboardComponent } from './components/analytics-dashboard.component';

export const routes: Routes = [
	{ path: '', component: ProductListComponent },
	{ path: 'dashboard', component: AnalyticsDashboardComponent },
	{ path: 'new', component: ProductFormComponent }
];
