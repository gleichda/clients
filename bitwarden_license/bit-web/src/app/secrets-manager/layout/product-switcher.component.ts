import { Component } from "@angular/core";
import { BehaviorSubject } from "rxjs";

type ProductDetails = {
  name: string;
  icon: string;
  appRoute?: string;
  marketingRoute?: string;
};

// const allProducts: Record<string, ProductDetails> = {
//     passwordManagement: {
//         name: 'Password Manager',
//         icon: 'bwi-lock',
//         appRoute: '#',
//         marketingRoute: 'https://bitwarden.com/products/personal/'
//     },
//     secretsManagement: {
//         name: 'Secrets Manager Beta',
//         icon: 'bwi-cli',
//         appRoute: ''
//     },
//     provider: {
//         name: 'Admin Console',
//         icon: 'bwi-dashboard',
//         appRoute: '#',
//     },
//     admin: {
//         name: 'Provider Portal',
//         icon: 'bwi-provider',
//         appRoute: '#',
//     },
//     organizations: {
//         name: 'Organizations',
//         icon: 'bwi-business',
//         marketingRoute: 'https://bitwarden.com/products/business/',
//     }
// };

@Component({
  selector: "product-switcher",
  templateUrl: "./product-switcher.component.html",
})
export class ProductSwitcherComponent {
  visibility$ = new BehaviorSubject({
    passwordManagement: true,
    secretsManagement: true,
    provider: true,
    admin: true,
    organizations: true,
  });

  bentoProducts$ = new BehaviorSubject<ProductDetails[]>([]);
  otherProducts$ = new BehaviorSubject<ProductDetails[]>([]);
}
