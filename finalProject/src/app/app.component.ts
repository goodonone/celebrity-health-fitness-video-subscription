import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

// Insert Service/Area where the search can Search and model here

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'finalProject';

  searchString: string = "";

  viewSearchBar: boolean = false;


  constructor(private actRoute: ActivatedRoute, private router: Router) { }


  ngOnInit(): void {

  }

// Toggles the visiblity of the search input field

  toggleSearch() {
    if (this.viewSearchBar) {
      this.viewSearchBar = false;
    }
    else {
      this.viewSearchBar = true;
    }
  }


// Search Function(INCOMPLETE)

  search(searchString: string) {
    var search = (<HTMLInputElement>document.getElementById('mySearch') ?? "").value;
    if (search !== '') {
      var input = search.charAt(0).toUpperCase() + search.slice(1);
      // window.location.assign('/search/`input`');
      // window.open("/search", "`input`");
      this.router.navigate(['/search', input]);
    }
    else {
      this.viewSearchBar = false;
    }

  }


}


