import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { User } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit{

  

  currentUser: User = new User();

  constructor(private userService: UserService, private router: Router, private actRoute: ActivatedRoute) { }

  ngOnInit(): void {
    const userId = this.actRoute.snapshot.paramMap.get("id") ?? "";
    this.userService.getUser(userId).subscribe(user => {
      this.currentUser = user;
      console.log(user);
    });
  }

  

  editProfile() {
    this.userService.updateUser(this.currentUser).subscribe(() => {
      window.alert("Edited Profile Successfully");
      this.router.navigate(['profile/', this.currentUser.userId]);
    }, error => {
      console.log('Error: ', error)
      if (error.status === 401 || error.status === 403) {
        this.userService.logoutUser();
        this.router.navigate(['signin']);
  
      }
    });  
  }

}
