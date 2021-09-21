import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.page.html',
  styleUrls: ['./tutorial.page.scss'],
})
export class TutorialPage implements OnInit {

  constructor() { }

  ngOnInit() {
    console.log("we in the tutorial!!");
    console.log(this);
    //TODO: look at how to pass to navigate['']
    //Promise.all(this.r.navigate(['']));
  }

}
