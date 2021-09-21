import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';


@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.page.html',
  styleUrls: ['./tutorial.page.scss'],
})
export class TutorialPage implements OnInit {

  constructor(public router: Router) { }

  ngOnInit() {
    console.log("we in the tutorial!!");
    console.log(this);
    //TODO: look at how to pass to navigate['']
    //Promise.all(this.r.navigate(['']));
  }

  endTutorial(){
    console.log(this.router);
    this.router.navigate(['']);
    console.log("ended");
  }

}
