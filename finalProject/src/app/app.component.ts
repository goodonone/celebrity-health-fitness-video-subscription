import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

// Insert Service/area where the search can Search and model here

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'finalProject';

  searchString: string = "";

  viewSearchBar: boolean = false;

  constructor(private actRoute: ActivatedRoute, private router: Router) { }


  toggleTable() {
    if (this.viewSearchBar) {
      this.viewSearchBar = false;
    }
    else {
      this.viewSearchBar = true;
    }
  }


  search(searchString: string) {
    var search = (<HTMLInputElement>document.getElementById('mySearch') ?? "").value;
    var input = search.charAt(0).toUpperCase() + search.slice(1);
    // window.location.assign('/search/`input`');
    // window.open("/search", "`input`");
    this.router.navigate(['/search', input]);
  }


}





