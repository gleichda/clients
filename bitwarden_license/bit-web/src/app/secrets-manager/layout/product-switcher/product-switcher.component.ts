import { Overlay, OverlayConfig, OverlayRef } from "@angular/cdk/overlay";
import { TemplatePortal } from "@angular/cdk/portal";
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from "@angular/core";
import {
  BehaviorSubject,
  filter,
  mergeWith,
  Observable,
  Subject,
  Subscription,
  takeUntil,
} from "rxjs";

import { OrganizationService } from "@bitwarden/common/abstractions/organization/organization.service.abstraction";
import { Provider } from "@bitwarden/common/models/domain/provider";

type ProductKeys =
  | "passwordManagement"
  | "secretsManagement"
  | "provider"
  | "admin"
  | "organizations";

type ProductDetails = {
  name: string;
  icon: string;
  appRoute?: string | any[];
  marketingRoute?: string;
};

const allProducts: Record<ProductKeys, ProductDetails> = {
  passwordManagement: {
    name: "Password Manager",
    icon: "bwi-lock",
    appRoute: "/vault",
    marketingRoute: "https://bitwarden.com/products/personal/",
  },
  secretsManagement: {
    name: "Secrets Manager Beta",
    icon: "bwi-cli",
    // TODO: remove key
    appRoute: "/sm/8018e10a-871f-403a-bea2-af4a013ccc73",
    marketingRoute: "#",
  },
  provider: {
    name: "Admin Console",
    icon: "bwi-dashboard",
    appRoute: "#",
  },
  admin: {
    name: "Provider Portal",
    icon: "bwi-provider",
    appRoute: "#",
  },
  organizations: {
    name: "Organizations",
    icon: "bwi-business",
    marketingRoute: "https://bitwarden.com/products/business/",
  },
} as const;

@Component({
  selector: "product-switcher",
  templateUrl: "./product-switcher.component.html",
})
export class ProductSwitcherComponent implements OnInit, OnDestroy {
  private _destroy$ = new Subject<void>();

  private isOpen = false;

  @ViewChild(TemplateRef)
  private templateRef!: TemplateRef<any>;

  private overlayRef: OverlayRef;
  private defaultMenuConfig: OverlayConfig = {
    panelClass: "bit-menu-panel",
    hasBackdrop: true,
    backdropClass: "cdk-overlay-transparent-backdrop",
    scrollStrategy: this.overlay.scrollStrategies.reposition(),
    positionStrategy: this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions([
        {
          originX: "start",
          originY: "bottom",
          overlayX: "start",
          overlayY: "top",
        },
        {
          originX: "end",
          originY: "bottom",
          overlayX: "end",
          overlayY: "top",
        },
      ])
      .withLockedPosition(true)
      .withFlexibleDimensions(false)
      .withPush(false),
  };

  private closedEventsSub: Subscription;

  protected bentoProducts$ = new BehaviorSubject<ProductDetails[]>([]);
  protected otherProducts$ = new BehaviorSubject<ProductDetails[]>([]);

  protected providers: Provider[] = [];
  private singleOrgMode = false;

  // TODO bind to routerEvents
  private visibility$ = new BehaviorSubject<Record<ProductKeys, boolean>>({
    // TODO how is are these determined?
    passwordManagement: true,
    secretsManagement: true,
    // TODO remove key
    provider: this.organizationService.getByIdentifier("8018e10a-871f-403a-bea2-af4a013ccc73")
      ?.isProviderUser,
    // canAccessOrgAdmin
    admin: true,
    organizations: this.organizationService.hasOrganizations(),
  });

  constructor(
    private organizationService: OrganizationService,
    private overlay: Overlay,
    private elementRef: ElementRef<HTMLElement>,
    private viewContainerRef: ViewContainerRef
  ) {}

  protected toggleMenu() {
    this.isOpen ? this.destroyMenu() : this.openMenu();
  }

  ngOnInit() {
    this.visibility$
      .asObservable()
      .pipe(takeUntil(this._destroy$))
      .subscribe((vis) => {
        const nextBento: ProductDetails[] = [];
        const nextOther: ProductDetails[] = [];
        Object.entries(vis).forEach(([productKey, isInBento]: [ProductKeys, boolean]) => {
          const product = allProducts[productKey];

          /**
           * ------ Bento Products ------
           * Passwords: IF user is passwordManagement
           * Secrets: IF user is secretsManagement
           * Provider: IF user is Provider role
           * Admin: IF user has administrative permissions
           * ------ Other Products ------
           * Organizations: Single org policy NOT in effect for logged in user
           * Secrets: IF user NOT secretsManagement
           * Passwords: IF user NOT passwordManagement
           */

          if (productKey === "organizations") {
            !isInBento && !this.singleOrgMode && nextOther.push(allProducts[productKey]);
          } else if (isInBento) {
            nextBento.push(product);
          } else if (product.marketingRoute) {
            nextOther.push(product);
          }
        });
        this.bentoProducts$.next(nextBento);
        this.otherProducts$.next(nextOther);
      });
  }

  private openMenu() {
    this.isOpen = true;
    this.overlayRef = this.overlay.create(this.defaultMenuConfig);

    const templatePortal = new TemplatePortal(this.templateRef, this.viewContainerRef);
    this.overlayRef.attach(templatePortal);

    this.closedEventsSub = this.getClosedEvents()
      .pipe(takeUntil(this._destroy$))
      .subscribe((event: KeyboardEvent | undefined) => {
        if (event?.key === "Tab") {
          // Required to ensure tab order resumes correctly
          this.elementRef.nativeElement.focus();
        }
        this.destroyMenu();
      });
  }

  ngOnDestroy() {
    this.disposeAll();
    this._destroy$.next();
    this._destroy$.complete();
  }

  private destroyMenu() {
    if (this.overlayRef == null || !this.isOpen) {
      return;
    }

    this.isOpen = false;
    this.disposeAll();
  }

  private getClosedEvents(): Observable<any> {
    const detachments = this.overlayRef.detachments();
    const escKey = this.overlayRef
      .keydownEvents()
      .pipe(filter((event: KeyboardEvent) => event.key === "Escape"));
    const backdrop = this.overlayRef.backdropClick();
    return detachments.pipe(mergeWith(escKey, backdrop));
  }

  private disposeAll() {
    this.closedEventsSub?.unsubscribe();
    this.overlayRef?.dispose();
  }
}
