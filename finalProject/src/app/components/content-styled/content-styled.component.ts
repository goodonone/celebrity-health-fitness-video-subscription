import { Component, OnInit } from '@angular/core';
import * as $ from 'jquery';

interface JQuery {
  chosen(options?: any): JQuery;
}

@Component({
  selector: 'app-content-styled',
  templateUrl: './content-styled.component.html',
  styleUrls: ['./content-styled.component.css']
})
export class ContentStyledComponent implements OnInit {
  // count: any;


  ngOnInit(): void {
    this.startCountDownTierOneTwo();
    this.startCountDownTierThree();
    this.checked = false;

    // Checking what tier we are on
    let tier = localStorage.getItem('tier');

    // Tier One, Two and Three Logic
    // if (tier == "Just Looking") {
    //   this.tierName = "Motivated & All In";
    //   this.tierOne = true;
    //   this.tierOneTwo = true;
    //   this.tierTwoThree = true;
    //   this.tierThree = false;
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
    // }    
    

    // Try to do this where the latest year updates automatically

    // const yearSpan = document.getElementById('#currentYear');
    // const currentYear = new Date();
    // yearSpan!.innerText = currentYear.getFullYear();


    // only run if Tier = 'Just Looking'
    // if(tierName == 'Just Looking')
    var $ = require("jquery");
    var windw = this;

    $.fn.followTo = function (pos: number) {
      var $this = this,
        $window = $(windw);

      $window.scroll(function (e: any) {
        if ($window.scrollTop() > pos) {
          $this.css({
            position: 'absolute',
            top: pos
          });
        } else {
          $this.css({
            position: 'fixed',
            top: 0
          });
        }
      });
    };

    $('#fixed').followTo(250);
    //   $(window).scroll(() =>{
    //     $("#fixed").css("top",Math.max(0,0-$(this).scrollTop()));
    // });


  }

  // Conditionally activate these

  tierOne: boolean = true;
  tierOneTwo: boolean = true;
  tierTwoThree: boolean = true;
  tierThree: boolean = true;
  showLiveVideo: boolean = false;
  tier: string = "";
  tierName: string = "";
  checked: boolean = false;

  // Add logic to only show one timer based on tier

  testCards: number[] = [1, 2, 3, 4, 5, 6, 7]
  testCardsTwo: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 43, 44, 45, 46, 47, 48, 49, 50]
  testCardsThree: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25]
  startCountDownTierOneTwo() {
    var countDownDate = new Date("Jan 7, 2024 15:37:25").getTime();

    // Update the count down every 1 second
    var x = setInterval(function () {

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
      document.getElementById("timer")!.innerHTML = "Next Live Workout in:" + " " + days + "d " + hours + "h "
        + minutes + "m " + seconds + "s. " + "Upgrade For Live Access!"

      // If the count down is finished, write some text
      if (distance < 0) {
        clearInterval(x);
        document.getElementById("timer")!.innerHTML = "EXPIRED";
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
      document.getElementById("timerTierThree")!.innerHTML = "Next Live Workout in:" + " " + days + "d " + hours + "h "
        + minutes + "m " + seconds + "s. ";

      // If the count down is finished, write some text
      if (distance < 0) {
        clearInterval(x);
        document.getElementById("timerTierThree")!.innerHTML = "EXPIRED";
        this.showLiveVideo = true;
      }
    }, 1000);
  }

  // Condition to display various items on page
  // localStorage.getItem('tier') === 'Just Looking';

  toggleBilling() {
    this.checked = !this.checked;
  }

  // Upgrade Follow scroll 




}





