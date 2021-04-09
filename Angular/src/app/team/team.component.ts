import { Component, OnInit, HostListener } from '@angular/core';

interface Member {
  name: string;
  team: string;
  bio: string;
  photo: string; // path;
  facebook: string;
  instagram: string;
  linkedin: string;
  email: string;
};

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css']
})

export class TeamComponent implements OnInit {

  public innerWidth:any;
  public layout:string;

  members:Member[] = [
    {
      name: 'Jane Doe',
      team: 'Marketing, Frontend Development',
      bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum quis sapien porttitor, feugiat tellus nec, sagittis nulla. Sed at venenatis diam, sed lacinia lacus. Mauris ac risus facilisis nulla imperdiet tincidunt. Nulla diam nibh.',
      photo: 'string', // path;
      facebook: null,
      instagram: null,
      linkedin: null,
      email: null,
    },
    {
      name: 'John Doe',
      team: 'Frontend Development',
      bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum quis sapien porttitor, feugiat tellus nec, sagittis nulla. Sed at venenatis diam, sed lacinia lacus. Mauris ac risus facilisis nulla imperdiet tincidunt. Nulla diam nibh.',
      photo: 'string', // path;
      facebook: null,
      instagram: null,
      linkedin: null,
      email: null,
    },
    {
      name: 'Janice Doe',
      team: 'Frontend Development, Project Management',
      bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum quis sapien porttitor, feugiat tellus nec, sagittis nulla. Sed at venenatis diam, sed lacinia lacus. Mauris ac risus facilisis nulla imperdiet tincidunt. Nulla diam nibh.',
      photo: 'string', // path;
      facebook: null,
      instagram: null,
      linkedin: null,
      email: null,
    },
    {
      name: 'Jacob Doe',
      team: 'Frontend Development, Backend Development',
      bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum quis sapien porttitor, feugiat tellus nec, sagittis nulla. Sed at venenatis diam, sed lacinia lacus. Mauris ac risus facilisis nulla imperdiet tincidunt. Nulla diam nibh.',
      photo: 'string', // path;
      facebook: null,
      instagram: null,
      linkedin: null,
      email: null,
    },
    {
      name: 'Jeremy Doe',
      team: 'Frontend Development, Backend Development',
      bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum quis sapien porttitor, feugiat tellus nec, sagittis nulla. Sed at venenatis diam, sed lacinia lacus. Mauris ac risus facilisis nulla imperdiet tincidunt. Nulla diam nibh.',
      photo: 'string', // path;
      facebook: null,
      instagram: null,
      linkedin: null,
      email: null,
    }



  ]
  constructor() { }

  ngOnInit(): void {
    this.innerWidth = window.innerWidth;
  }

  @HostListener('window:resize')
  onResize() {
    this.innerWidth = window.innerWidth;
  }

  checkWidth(): string {
    console.log(this.innerWidth)
    if (this.innerWidth > 650) {return 'row span'};
    return 'column';
  }

}
