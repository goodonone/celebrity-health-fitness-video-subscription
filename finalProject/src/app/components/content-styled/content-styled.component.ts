
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
// import * as $ from 'jquery';
import { User } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service';

interface jquery {
  chosen(options?: any): JQuery;
}

@Component({
  selector: 'app-content-styled',
  templateUrl: './content-styled.component.html',
  styleUrls: ['./content-styled.component.css']
})
export class ContentStyledComponent implements OnInit {
  // scrollTop: number;
  // count: any;

  currentUser: User = new User;
  timerVal = '';
  timerValThree = '';
 

  constructor(private router: Router, private userService: UserService, private actRoute: ActivatedRoute) { }

  ngOnInit(): void {
    const userId = this.actRoute.snapshot.paramMap.get("id") ?? "";
    this.userService.getUser(userId).subscribe(user => {
      this.currentUser = user;
      // console.log(user);
    });



    this.startCountDownTierOneTwo();
    this.startCountDownTierThree();
    this.checked = false;

    // Checking what tier we are on
    // let tier = localStorage.getItem('tier');
    let tier = this.currentUser.tier;

    // Tier One, Two and Three Logic

    // if (tier == "Just Looking") {
    //   this.tierName = "Motivated & All In";
    //   this.tierOne = true;
    //   this.tierOneTwo = true;
    //   this.tierTwoThree = true;
    //   this.tierThree = false;
    // this.toggleClass();
    //  (document.getElementById('payWall') as HTMLFieldSetElement).setAttribute('disabled','disabled');
    // } else if(tier == "Motivated")
    // {
    //   this.tierName = "Motivated";
    //   this.tierOne = false;
    //   this.tierOneTwo = true;
    //   this.tierTwoThree = false;
    // } else {
    //   this.tierName = "All In";
    //   this.tierOne = false;
    //   this.tierOneTwo = false;
    //   this.tierTwoThree = true;
    //   this.tierThree = true;
    //   this.timerTierThree = true;
    // }    

    

    // only run if Tier = 'Just Looking'
    // if(tierName == 'Just Looking')
    // var $ = require("jquery");
    // var wrap = $("#wrap");

    // wrap.on("scroll", (e: any) => {
    //   if (document.documentElement.scrollTop > 300) {
    //     wrap.addId("fixed");
    //   } else {
    //     wrap.removeId("fixed");
    //   }
    // });




// // Delete this out when the page is ready
//     this.toggleClass();
//     (document.getElementById('payWall') as HTMLFieldSetElement).setAttribute('disabled','disabled');
    


  }

  tierOne: boolean = true;
  tierOneTwo: boolean = true;
  tierTwoThree: boolean = true;
  tierThree: boolean = true;
  timerTierThree: boolean = false;
  showLiveVideo: boolean = false;
  tier: string = "";
  tierName: string = "";
  checked: boolean = false;
  classApplied = false;

  testCards: number[] = [1, 2, 3, 4, 5, 6, 7]
  testCardsTwo: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 43, 44, 45, 46, 47, 48, 49, 50]
  testCardsThree: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25]
  startCountDownTierOneTwo() {
    var countDownDate = new Date("Jan 8, 2024 15:37:25").getTime();

    // Update the count down every 1 second
    var x = setInterval( () => {

      // Get today's date and time
      var now = new Date().getTime();

      // Find the distance between now and the count down date
      var distance = countDownDate - now;

      // Time calculations for days, hours, minutes and seconds
      var days = Math.floor(distance / (1000 * 60 * 60 * 24));
      var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);

      // Display the result in the element with id="demo"
      this.timerVal = "Next Live Workout in:" + " " + days + "d " + hours + "h "
        + minutes + "m " + seconds + "s. " + "Upgrade To 'All In' For Live Access!"

      // If the count down is finished, write some text
      if (distance < 0) {
        clearInterval(x);
        this.timerVal = "EXPIRED";
        // ngIf to open up a card for live video here
      }
    }, 1000);
  }

  startCountDownTierThree() {
    var countDownDate = new Date("Jan 7, 2024 15:37:25").getTime();

    // Update the count down every 1 second
    var x = setInterval(() => {

      // Get today's date and time
      var now = new Date().getTime();

      // Find the distance between now and the count down date
      var distance = countDownDate - now;

      // Time calculations for days, hours, minutes and seconds
      var days = Math.floor(distance / (1000 * 60 * 60 * 24));
      var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);

      // Display the result in the element with id="demo"
      this.timerValThree = "Next Live Workout in:" + " " + days + "d " + hours + "h "
        + minutes + "m " + seconds + "s. ";

      // If the count down is finished, write some text
      if (distance < 0) {
        clearInterval(x);
        this.timerValThree = "EXPIRED";
        this.timerTierThree = false;
        this.showLiveVideo = true;
      }
    }, 1000);
  }


  toggleBilling() {
    this.checked = !this.checked;
  }



// }





