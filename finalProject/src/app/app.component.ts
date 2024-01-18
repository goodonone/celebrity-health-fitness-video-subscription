import { Component, OnInit} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { UserService } from './services/user.service';
import { CartService } from './services/cart.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {


  title = 'finalProject';

  searchString: string = "";

  viewSearchBar: boolean = false;

  userIsLoggedIn : boolean = false;

  UserId : string = "";

  cartQuantity=0;


  constructor(private actRoute: ActivatedRoute, private router: Router, private userService: UserService, private cartService: CartService) { 
    this.router.events.subscribe((event) =>{
      if(event instanceof NavigationEnd) {
        this.UpdateStatus();
      }
    });
    this.cartService.getCartObservable().subscribe((newCart) => {
      this.cartQuantity = newCart.totalCount;
    });
  }


  ngOnInit(): void {
    this.UpdateStatus();

  }

// Toggles the visiblity of the search input field

  toggleSearch() {
    if (this.viewSearchBar) {
      this.viewSearchBar = false;
    }
    else {
      this.viewSearchBar = true;
    }
    setTimeout(() => {
       this.viewSearchBar = false;
    }, 10000);
  }

// Search Function(INCOMPLETE)

  search(searchString: string) {
    var search = (<HTMLInputElement>document.getElementById('mySearch') ?? "").value;
    if (search !== '') {
      var input = search.charAt(0).toUpperCase() + search.slice(1);
      this.router.navigate(['/search', input]);
    }
    else {
      this.viewSearchBar = false;
    }

  }
  
  UpdateStatus() {
    this.userIsLoggedIn = this.userService.isloggedIn();
    if (this.userIsLoggedIn) {
      this.UserId = this.userService.getUserId() ?? "";
    }
    
  }

  logOut() {
    this.cartService.clearCart();
    this.userService.logoutUser();
    this.UpdateStatus();
  }

  minimize(){
    const toggle = document.querySelector("#toggle") as HTMLInputElement;
    setTimeout(() => {
      toggle.checked = false;
    }, 2000);
  }

}






