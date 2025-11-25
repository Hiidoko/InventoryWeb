import { Routes } from '@angular/router';
import { ProductListComponent } from './components/product-list.component';
import { ProductFormComponent } from './components/product-form.component';

export const routes: Routes = [
	{ path: '', component: ProductListComponent },
	{ path: 'new', component: ProductFormComponent }
];
