# Celebrity Health & Fitness App
![Design preview for the Celebrity Health & Fitness App](celebrityFitnessProject/Design/Screenshots/Home/BannerOne.jpg)

A platform that empowers a Celebrity/Fitness Personality to generate revenue by distributing their brand specific workout videos using a Subscription-Pricing Model. The videos can be hosted on any Cloud platform easily accessible throughout the globe. The App can be integrated with Stripe and will be ready for production. 

## Built with
<img src="https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular icon" height="30" /> <img src="https://img.shields.io/badge/Material--UI-0081CB?style=for-the-badge&logo=material-ui&logoColor=white" alt="Material UI icon" height="30" /> <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript icon" height="30" /> <img src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E" alt="JavaScript icon" height="30" /> <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML icon" height="30" /> <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS icon" height="30" /> <img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white" alt="Figma icon" height="30" />

## Contents:
   - [Home](#Home-Page)
   - [Sign-Up](#Sign-Up-Page)
     - [Sign-Up Page Responsive](#Sign-Up-Page-Responsive)
   - [Login](#Login-Page)
     - [Login Page Responsive](#Login-Page-Responsive)
   - [Content](#Content-Page)
   - [Profile](#Profile-Page)
     - [Upgrade](#Upgrade-Page)
     - [Profile Page Responsive](#Profile-Page-Responsive)
   - [Store](#Store-Page)
     - [Store Page Responsive](#Store-Page-Responsive)
   - [Cart](#Cart-Page)
     - [Cart Page Responsive](#Cart-Page-Responsive)
   - [About](#About-Page)
   - [Contact Us](#Contact-Us-Page)
     - [Contact Page Responsive](#Contact-Page-Responsive)
   - [404/Not Found Page](#Not-Found-Page)

## Home Page

The page is divided into banners, each banner with specific intent showcasing the features of the app. For an impactful first impression, the background of the landing page is a cool looped video.

**Motivational Content:**
<br/>
<br/>
![Design Banner Two for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Home/BannerTwo.jpg)

**Fresh Weekly Recipes To Keep Workouts Going:**
<br/>
<br/>
![Design Banner Three for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Home/BannerThree.jpg)

**New Celebrity Workouts, Posted Weekly and Live One-On-Ones For Highest Tier Members:**
<br/>
<br/>
![Design Banner Four for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Home/BannerFour.jpg)

**A Carousel Showcasing Current And Past Members' 'Success Stories' Using The App:**
<br/>
<br/>
![Design Banner Five the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Home/BannerFive.jpg)

## Sign-Up Page
The Signup form here is an Angular multi-page form that can be broken down into three main parts:

**Part I The Progress Tracker Icons:**
Located on the left of the form, keeps track of the current step in the form using Observables.

**Part II The Next and Back Buttons:**
The next and back buttons are enabled only when the inputs are filled and each filled to specifications unique to each input and when the requirements are fulfilled, the Next button is enabled. 

**Part III The Form Itself:**
The form is divided into 5 steps, each step being its very own Angular Component which is navigated to with the afore mentioned Next & Confirm buttons, the current step is maintained using observables in the form.service.ts file.

_Form Step 1:_ Personal Info Page
The inputs have a level error checking, errors messages are triggered when an error requirement is met. 
The Password Field of the Personal Info page of the form has a level of password mismatch checking. *More work needs to be done here to cover all edge cases.
<br/>
<br/>
![Design Personal Info for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Sign-Up/PersonalInfoPage.jpg)
<br/>
![Design Personal Info Errors for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Sign-Up/PersonalInfoPageErrors.jpg)
<br/>

_Form Step 2:_ Plan Details Page
The plans are laid out here for the prospective customer to make a choice.
<br/>
<br/>
![Design Plan Details for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Sign-Up/PlanDetailsPage.jpg)
<br/>
<br/>
The toggle switches the billing from Monthly to Yearly billing and offers the customer a promo (2 months free). The choices are retained in the UI in case the customer decides to change their mind after going to the next page. 
<br/>
<br/>
![Design Plan Details Yearly View for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Sign-Up/PlanDetailsYearlyViewPage.jpg)
<br/>

_Form Step 3:_ Summary Page
This step offers the customer a summary of what they will be paying monthly/yearly. 
<br/>
<br/>
![Design Summary View for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Sign-Up/SummaryPage.jpg)
<br/>

_Form Step 4:_ Payment Page
This is where the client inputs their card info so the subscription billing can begin. Here we are storing the card information as an example, but in production we will be using the Stripe JS to mount a customizable Credit Card Form directly into this page for seamless and secure payments. This page also has validation for each input and will throw errors similar to Step 1 of the form. The First Tier being free, the Next button on the Summary page will be a Confirm Button and will bypass the Payment Page altogether and go straight to the Confirmation Page. 
<br/>
<br/>
![Design Payment View for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Sign-Up/PaymentPage.jpg)
<br/>

_Form Step 5:_ Confirmation Page
Here we have the confirmation messsage displayed with support contact info and will automatically route to the login page just as the customer finishes reading the text. 
<br/>
<br/>
![Design Confirmation View for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Sign-Up/ConfirmationPage.jpg)

The background of the Sign-Up Page is a cool looped video. 

## Sign-Up Page Responsive

**Personal Info Page Responsive**
<br/>
<br/>
<img src="finalProject/Design/Screenshots/Sign-Up/PersonalInfoResponsive.jpg" width=50% height=50%>

**Plan Details Page Responsive**
<br/>
<br/>
<img src="finalProject/Design/Screenshots/Sign-Up/PlanDetailsResponsive.jpg" width=50% height=50%>

**Summary Page Responsive**
<br/>
<br/>
<img src="finalProject/Design/Screenshots/Sign-Up/SummaryPageResponsive.jpg" width=50% height=50%>

**Payment Page Responsive**
<br/>
<br/>
<img src="finalProject/Design/Screenshots/Sign-Up/PaymentPageResponsive.jpg" width=50% height=50%>

**Confirmation Page Responsive**
<br/>
<br/>
<img src ="finalProject/Design/Screenshots/Sign-Up/ConfirmationPageResponsive.jpg" width=50% height=50%>

## Login Page
![Design Login for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/LoginPage.jpg)

**Login Error**
<br/>
<br/>
![Design Login Error for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/LoginError.jpg)

## Login Page Responsive
Here the password is toggled to visible using an Angular directive. 
<br />
<br />
<img src="finalProject/Design/Screenshots/ShowOrHidePassword.jpg" width=50% height=50%>

## Content Page
The concept behind the content page is, it is all One page, and the view for each tier is contextually loaded, for one free tier and two paid tiers. Only the highest tier has access to the Monthly Live Workouts. There is a persistent fixed countdown timer ticking away reminding the lower tier members to upgrade. The workouts here are categorized by year of release, every video being released every week wihtin that year. 

**Free Tier View**
<br/>
<br/>
The free tier only gets a weeks worth of workouts and the rest of the page is hidden behind a blurred out paywall, encouraging the customer to upgrade to get access to all the content from weeks and years past. 
<br/>
<br/>
![Design Free Tier for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Content/FreeTierView.jpg)

**Paywall**
<br/>
<br/>
![Design Free Tier Paywall for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Content/FreeTierPaywallView.jpg)

![Design Free Tier Paywall Continued for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Content/FreeTierPaywallViewcontinued.jpg)

**Second Tier View**
<br/>
<br/>
Fresh weekly recipes can be accesssed from the button under the Year. 

![Design Second Tier for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Content/TierTwoPaidTierView.jpg)

For tier two and three, the workouts can also be categorized by workout type by flipping the toggle. 

![Design Workout by type Continued for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Content/WorkoutsByType.jpg)

![Design Workout by type Continued for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Content/WorkoutsByTypeContinued.jpg)

**Third Tier View**
<br/>
<br/>

![Design Tier Three View for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Content/TierThreeView.jpg)

When the timer hits 00:00:00s, the Live Workout begins.

![Design Tier Three Live Video Continued for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Content/TierThreeLiveWorkoutView.jpg)

## Profile Page

The Profile Page reflects the tier the customer is in, in a bold, large font. Apart from the free tier, this functions as a personal "mantra". For example, Hi Shermon, You are MOTIVATED! Or for the third tier, Hi Shermon, You are ALL IN!

**Free Tier Profile View**
<br/>
<br/>
![Design Free Tier Profile for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Profile/ProfilePageViewTierOne.jpg)

**Second Tier Profile View**
<br/>
<br/>
![Design Second Tier Profile for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Profile/ProfilePageViewTierTwo.jpg)

**Third Tier Profile View**
<br/>
<br/>
![Design Third Tier Profile for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Profile/ProfilePageViewTierThree.jpg)

**Edit Profile View**
<br/>
<br/>
![Design Edit Profile for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Profile/EditProfileView.jpg)

**Change Picture View**
<br/>
<br/>
![Design Change Picture for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Profile/ChangeProfilePictureView.jpg)

**Cancel/Delete Subscription View**
<br/>
<br/>

This view comes with a message of warning to the customer as to what they are about to do. 
<br/>
<br/>
![Design Cancel Subscription for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Profile/CancelDeleteSubscriptionView.jpg)

## Profile Page Responsive

<img src="finalProject/Design/Screenshots/Profile/ProfilePageResponsive.jpg" width=50% height=50%>

## Upgrade Page

The customer can Upgrade their membership either using the Upgrade button within the Content/Workouts page or by using the Change button in the Profile Page. Here we reuse the same Multi-Page Sign-Up Form contextually, where we remove any unnecessary steps from the Form contextually, for the paid tiers we skip the Payment Page as we already have their card number on file but for the Free Tier we need to get the customers Card info and then proceed with the Upgrade. We use a different set of Progress Tracker Icons to cover only 2 steps for the Paid Tiers and 3 for the Free Tier (instead of the 5 from the Sign-Up Form). Downgrading can also be done through the same page and the content in the content page will change contextually. 

**Free Tier Upgrade**
<br/>
<br/>
![Design Free Tier Upgrade for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Upgrade/FreeTierUpgradeView.jpg)

**Paid Tiers Upgrade**
<br/>
<br/>
![Design Paid Tiers Upgrade for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Upgrade/PaidTierUpgradeView.jpg)

## Store Page

**All Products View**
<br/>
<br/>
![Design All Products for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Store/AllProductsView.jpg)

**Specific Product Description**
<br/>
<br/>
![Design Specific Product for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Store/SpecificProductView.jpg)

## Store Page Responsive

<img src ="finalProject/Design/Screenshots/Store/SpecificProductResponsive.jpg" height=50% width=50%>

## Cart Page

The cart in this project was designed to be stored in Local Storage. The original intent was to store the cart in the backend, this feature is currently [In-Development]. For the Paid Tiers, the Proceed To Checkout button is just Checkout and on cliking it, the purchase is completed with the Card number on file. For the free First Tier, the Proceed to Checkout takes the customer through the process of inputting their information into the Form and then completing their purchase. Again, we can mount a customizable Credit Card Form directly into this page for seamless and secure payments.

**Cart View**
<br/>
<br/>
![Design Cart View for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Store/CartView.jpg)

**Empty Cart View**
<br/>
<br/>
![Design Empty Cart View for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Store/CartEmptyView.jpg)

**Checkout For Paid Tiers Confirmation Message**
<br/>
<br/>
![Design Checkout Free Tier for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Store/CheckoutPaidTiersView.jpg)

The First Tier being free, we need to take the customer through the checkout process where they input their payment info to complete the purchase. We reuse the same Multi-Page Sign-Up form contextually to remove unnecessary steps, with a different set of Progress Tracker Icons to cover only 2 steps (instead of the 5 from the Sign-Up Form). 

![Design Payment Free Tier Payment for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Store/CheckoutPageFreeTierView.jpg)

### Confirmation for First Tier Checkout
![Design Confirmation Free Tier for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Store/CheckoutFreeTierView.jpg)

## Cart Page Responsive
<img src ="finalProject/Design/Screenshots/Store/CartResponsive.jpg" width=50% height=50%>

**Checkout For Paid Tiers View**
<br/>
<br/>
<img src ="finalProject/Design/Screenshots/Store/ChekoutPaidTiersResponsiveView.jpg" width=50% height=50%>

## About Page

The About page covers the most pertinent information about our Celebrity. 

![Design About Page for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/About/AboutCelebrity.jpg)

## Contact Us Page

The Contact Us page provides the Customer or prospective customer with a Contact Form and a map to locate the Offices and Business Hours of the Celebrity and links to His/Her Social Media accounts. 

**Contact Form**
<br/>
<br/>
![Design Contact Form for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Contact-Us/ContactForm.jpg)

**Contact Form Submitted**
<br/>
<br/>
The Form will revert back to its original state in a set amount of time.
![Design Contact Page Form Submitted for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Contact-Us/ContactFormSend.jpg)

**Office Location and Social Media**
<br/>
<br/>
![Design Offices and Social Media for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/Contact-Us/MapandSocialInfo.jpg)

## Contact Page Responsive

<img src="finalProject/Design/Screenshots/Contact-Us/ContactFormResponsive.jpg" width=50% height=50%>

**Office Location and Social Media**
<br/>
<br/>
<img src="finalProject/Design/Screenshots/Contact-Us/MapResponsive.png" width=50% height=50%>

<img src="finalProject/Design/Screenshots/Contact-Us/MapResponsiveContinued.png" width=50% height=50%>

## Not Found Page

404 or Not Found Page

![Design Not Found for the Celebrity Health & Fitness App](finalProject/Design/Screenshots/NotFound.jpg)


## Future Development:
- [In-Progress] Store the cart in the backend, so if the user doesn't checkout and logs out and logs back in their cart is still intact with all the items they added. 
- Complete Search functionlity, to be able to search for specific videos and do a site-wide search for items in the store.
- Check for all edge cases in the Password Missmatch check in the Sign-Up Form.


# Backend
The Backend for Celebrity Health & Fitness App was developed using MVC based Node.js and Express.js, utilizing Sequalize. With a RESTful API that can scale based on demands reliably; with MySQL as the database.

## Backend: https://github.com/goodonone/celebrity-health-fitness-video-subscription-backend-nodejs
