import { Component, OnInit, HostListener } from '@angular/core';

interface Member {
  name: string;
  team: string;
  bio: string;
  work: string;
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
      name: 'Wenjun (Jane) Jiang',
      team: 'Backend Development',
      bio: 'Jane is a 3rd year at UCLA majoring in Financial Actuarial Mathematics with a Specialization in Computing. Some of Jane\'s hobbies include hiking, playing the flute, traveling, eating GOOD food, karaoke, watching movies/shows and doing almost anything with friends.',
      work: 'Jane has worked on the authentication & authorization component of the user profile, as well as the API. ',
      photo: 'assets/team/Jane.jpeg', // path;
      facebook: "./team",
      instagram: "./team",
      linkedin: 'https://www.linkedin.com/in/wenjun-jiang-000615/',
      email: "https://mail.google.com/mail/?view=cm&fs=1&to=wenjunjanejiang@gmail.com", //email compose
    },
    {
      name: 'Yash Shah',
      team: 'Backend, Mobile, UI/UX',
      bio: 'Yash is a first year computer science major who contributes web and mobile app design for the ui/ux team and code development for the backend team. In his spare time, he enjoys spending time with friends and adventuring to find cool spots to chill and eat food.',
      work: 'Yash has worked on ideating and designing mobile and web components for the Data Grid\'s app and website, and has been developing query parsing architecture.',
      photo: 'assets/team/Yash.jpeg', // path;
      facebook: null,
      instagram: "https://www.instagram.com/yashs2020/",
      linkedin: "https://www.linkedin.com/in/yash-shah-4184211a1/",
      email: "https://mail.google.com/mail/?view=cm&fs=1&to=ybshah@g.ucla.edu",
    },
    {
      name: 'Cheryl Ma',
      team: 'PR/Marketing',
      bio: 'Cheryl is a third year Economics Major and the director of PR and Marketing for the Data Grid. She is passionate about environmental justice and the intersections of sustainability and equity, and also loves doing yoga and taking care of her plants.',
      work: 'Cheryl works on internal projects such as recruiting and hiring, as well as management of the social media accounts.',
      photo: 'assets/team/Cheryl.PNG', // path;
      facebook: "https://www.facebook.com/profile.php?id=100006323773917",
      instagram: "instagram.com/c.mah",
      linkedin: "https://www.linkedin.com/in/cheryl-ma-b0b88014b/",
      email: "https://mail.google.com/mail/?view=cm&fs=1&to=lechuanm@gmail.com",
    },
    {
      name: 'Kian Nikzad',
      team: 'Project Manager, UI/UX Lead',
      bio: 'Kian is a third year Computer Science major who enjoys mountain runs, fried food, and local history. He believes pragmatic improvements to infrastructure like utilities is the best way to become sustainable.',
      work: 'In addition to guiding the vision and management, he has worked on design specs, API, and the production environment.',
      photo: 'assets/team/Kian.jpg', // path;
      facebook: "https://www.facebook.com/kian.nikzad.1/",
      instagram: "https://www.instagram.com/kian_nikzad/",
      linkedin: "https://www.linkedin.com/in/kiannikzad/",
      email: "https://mail.google.com/mail/?view=cm&fs=1&to=kian.nikzad@gmail.com",
    },
    {
      name: 'Tanya Zhong',
      team: 'Frontend Lead',
      bio: 'Tanya is a third year Computer Science major and the Frontend Team Lead for TDG. Her hobbies are baking, making jewelry, and listening to podcasts.',
      work: 'Tanya has worked on the Frontend infrastructure, which lets users view and interact with content on TDG.',
      photo: 'assets/team/Tanya.png', // path;
      facebook: './team',
      instagram: './team',
      linkedin: "https://www.linkedin.com/in/tanyazhong/",
      email: "https://mail.google.com/mail/?view=cm&fs=1&to=tanyazhong1@gmail.com",
    },
    {
      name: 'Tessa Holzmann',
      team: 'UI/UX',
      bio: 'Tessa is a second year double majoring in Geology and Marine Biology who works on the graphic design for UI/UX. In her free time she hikes excessively and spends lots of money on matcha lattes.',
      work: 'She works on the style guide, elements, and logos for the website and mobile app',
      photo: 'assets/team/Tessa.jpg', // path;
      facebook: 'https://www.facebook.com/tessa.holzmann.7/',
      instagram: 'https://www.instagram.com/tessa_holzmann/',
      linkedin: "https://www.linkedin.com/in/tessa-holzmann-b541a4208/",
      email: "https://mail.google.com/mail/?view=cm&fs=1&to=tessaholzmann@gmail.com",
    },
    {
      name: 'Bhavna Sreekumar',
      team: 'UI/UX',
      bio: 'Bhavna is a third year cognitive science major who is a UX designer for UI/UX. In her spare time she sings and occasionally writes music.',
      work: 'Bhavna has worked on the design specs for the data grid website and app.',
      photo: 'assets/team/Bhavna.jpg', // path;
      facebook: "https://www.facebook.com/bhavna.sreekumar/",
      instagram: "https://www.instagram.com/bhavnaa.s/",
      linkedin: "https://www.linkedin.com/in/bhavna-sreekumar-54b162196",
      email: "https://mail.google.com/mail/?view=cm&fs=1&to=sreekumarbhavna@gmail.com",
    },
    {
      name: 'Oliver Melgrove',
      team: 'Backend Lead',
      bio: 'Oliver like to do pottery and write code. In his spare time he hopes it starts raining so he can go for a run!',
      work: 'Oliver has worked on developing the web server, database, and API. He has worked with Kian and the backend team to design the system architecture.',
      photo: 'assets/team/Oliver.png', // path;
      facebook:'',
      instagram:'',
      linkedin:'https://www.linkedin.com/in/melgrove',
      email:'https://mail.google.com/mail/?view=cm&fs=1&to=oliver@melgrove.com'
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
    if (this.innerWidth > 650) {return 'row span'};
    return 'column';
  }

}
