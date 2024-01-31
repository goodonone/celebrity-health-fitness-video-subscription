# Celebrity Health & Fitness App
![Design preview for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Home/BannerOne.jpg)

A platform that empowers a Celebrity/Fitness Personality to generate revenue by distributing their brand specific workout videos using a Subscription-Pricing Model. The videos can be hosted on any Cloud platform easily accessible throughout the globe. 

## Built with
<img src="https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular icon" height="30" /> <img src="https://img.shields.io/badge/Material--UI-0081CB?style=for-the-badge&logo=material-ui&logoColor=white" alt="Material UI icon" height="30" /> <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript icon" height="30" /> <img src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E" alt="JavaScript icon" height="30" /> <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML icon" height="30" /> <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS icon" height="30" /> <img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white" alt="Figma icon" height="30" />

## Contents:
   - [Home](#Home-Page)
   - [Sign-Up Form](#Sign-Up-Page)
   - [Content](#Content-Page)
   - [Store](#Store-Page)
   - [Cart](#Cart-Page)
   - [About](#About-Page)
   - [Contact Us](#Contact-Us-Page)
   - [404/Not Found Page](#Not-Found-Page)

## Home Page:

The page is divided into banners, each banner with specific intent showcasing the features of the app. 

### Motivation:
![Design Banner Two for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Home/BannerTwo.jpg)

### Fresh Weekly Recipes To Keep Workouts Going:
![Design Banner Three for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Home/BannerThree.jpg)

### New Celebrity Workouts, Posted Weekly and Live One-On-Ones For Highest Tier Members:
![Design Banner Four for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Home/BannerFour.jpg)

### A Carousel Showcasing Current And Past Members' 'Success Stories' Using The App:
![Design Banner Five the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Home/BannerFive.jpg)

## Sign-Up Page:
The Signup form here is an Angular multi-page form that can be broken down into three main parts:

### Part I The Progress Tracker: 
Located on the left of the form, keeps track of the current step in the form.

### Part II The Next and Back Buttons: 
The next and back buttons are enabled only when the inputs are filled and each filled to specifications unique to each input and when the requirements are fulfilled, the Next button is enabled. 

### Part III The Form Itself:
The form is divided into 5 steps, each step being its very own Angular Component which is navigated to with the afore mentioned Next & Confirm buttons, the current step is maintained using observables in the form.service.ts file.

### Form Step 1: Personal Info Page
The inputs have a level error checking, errors messages are triggered when an error requirement is met. 
The Password Field of the Personal Info page of the form has a level of password mismatch checking. *More work needs to be done here to cover all edge cases.
<br/>
<br/>
![Design Personal Info for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Sign-Up/PersonalInfoPage.jpg)
<br/>
![Design Personal Info Errors for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Sign-Up/PersonalInfoPageErrors.jpg)
<br/>

### Form Step 2: Plan Details Page
The plans are laid out here for the prospective customer to make a choice.
<br/>
<br/>
![Design Plan Details for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Sign-Up/PlanDetailsPage.jpg)
<br/>
The toggle switches the price from Monthly to Yearly billing and offers the client a promo (2 months free). The choices are retained in the UI in case the customer decides to change the selected plan after going to the next page. 
![Design Plan Details Yearly View for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Sign-Up/PlanDetailsYearlyViewPage.jpg)
<br/>

### Form Step 3: Summary Page
This step offers the customer a summary of what they will be paying monthly/yearly. 
<br/>
<br/>
![Design Summary View for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Sign-Up/SummaryPage.jpg)
<br/>

### Form Step 4: Payment Page
This is where the client inputs their card info so the subscription billing can begin. Here we are storing the card information as an example, but in production we will be using the Stripe JS to mount a customizable Credit Card Form directly into this page for seamless and secure payments. This page also has validation for each input and will throw errors similar to Step 1 of the form.
<br/>
<br/>
![Design Payment View for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Sign-Up/PaymentPage.jpg)
<br/>

### Form Step 5: Confirmation Page
Here we have the confirmation messsage displayed with support contact info and will automatically route to the login page just as the customer finishes reading the text. 
<br/>
<br/>
![Design Confirmation View for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Sign-Up/ConfirmationPage.jpg)

## Sign-Up Form Responsive:
<br/>
### Personal Info Page Responsive
<br/>
<img src="finalProject/Design/Screenshots/Sign-Up/PersonalInfoResponsive.jpg" width=50% height=50%>
<br/>
### Plan Details Page Responsive
<br/>
<img src="finalProject/Design/Screenshots/Sign-Up/PlanDetailsResponsive.jpg" width=50% height=50%>
<br/>
### Summary Page Responsive
<br/>
<img src="finalProject/Design/Screenshots/Sign-Up/SummaryPageResponsive.jpg" width=50% height=50%>
<br/>
### Payment Page Responsive
<br/>
<img src="finalProject/Design/Screenshots/Sign-Up/PaymentPageResponsive.jpg">
<br/>
### Confirmation Page Responsive
<br/>
<img src ="finalProject/Design/Screenshots/Sign-Up/ConfirmationPageResponsive.jpg">
<br/>


The Billing Frequency Toggle in the Plan Details Page changes the information seen on each plan and adjusts pricing accordingly providing an attractive promo. 
Each page of the form forms its own Component in Angular. The toggle in the plan

# Backend
The Backend for Celebrity Health & Fitness App was developed using MVC based Node.js and Express.js, utilizing Sequalize. With a RESTful API that can scale based on demands reliably; with MySQL as the database.

## Backend: https://github.com/goodonone/celebrity-health-fitness-video-subscription-backend-nodejs
