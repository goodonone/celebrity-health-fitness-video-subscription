# Celebrity Health & Fitness App
![Design preview for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Home/BannerOne.jpg)

A platform that empowers a Celebrity/Fitness Personality to generate revenue by distributing their brand specific workout videos using a Subscription-Pricing Model. The videos can be hosted on any Cloud platform easily accessible throughout the globe. 

## Built with
<img src="https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular icon" height="30" /> <img src="https://img.shields.io/badge/Material--UI-0081CB?style=for-the-badge&logo=material-ui&logoColor=white" alt="Material UI icon" height="30" /> <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript icon" height="30" /> <img src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E" alt="JavaScript icon" height="30" /> <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML icon" height="30" /> <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS icon" height="30" /> <img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white" alt="Figma icon" height="30" />

## Site Map:
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

The signup form here is an Angular multi-page form that can be broken down into three main parts:

### The Progress Tracker: 
Located on the left of the form, keeps track of the current step in the form.

### The Next and Back Buttons: 
The next and back buttons are enabled only when the inputs are filled and each filled to specifications unique to each input and when the requirements are fulfilled, the Next button is enabled. 

### The Form Itself:

The inputs have some level error checking and error messages pop up when an error is triggered. 
The Password Field of Personal Info of the form has a level of password mismatch checking. *More work needs to be done here to ensure all edge cases.
<br/>
<br/>
![Design Personal Info for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Sign-Up/PersonalInfoPage.jpg)
<br/>
![Design Personal Info Errors for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Sign-Up/PersonalInfoPageErrors.jpg)


The Billing Frequency Toggle in the Plan Details Page changes the information seen on each plan and adjusts pricing accordingly providing an attractive promo. 
Each page of the form forms its own Component in Angular. The toggle in the plan

# Backend
The Backend for Celebrity Health & Fitness App was developed using MVC based Node.js and Express.js, utilizing Sequalize. With a RESTful API that can scale based on demands reliably; with MySQL as the database.

## Backend: https://github.com/goodonone/celebrity-health-fitness-video-subscription-backend-nodejs
