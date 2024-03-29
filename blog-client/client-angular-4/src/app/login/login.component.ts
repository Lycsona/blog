import {Component, OnInit} from "@angular/core";
import {AppLoginService} from "../service/app.login.service";
import {Router} from "@angular/router";
import * as jwtDecode from 'jwt-decode';
import {AppSharedService} from '../service/app.shared.service';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {StompService} from "@stomp/ng2-stompjs/index";

@Component({
  selector: 'login',
  templateUrl: './login.component.html',

})
export class LoginComponent implements OnInit {

  private login: string;
  private password: string;
  private loginCounter: number;
  stomp_subscription: any;

  formErrors: any;
  createLoginForm: FormGroup;

  readonly validationMessages = {
    'login': {
      'required': 'Required',
      'minlength': 'Min 6 chars',
      'maxlength': 'Max 12 chars',
    },
    'password': {
      'required': 'Required',
      'minlength': 'Min 6 chars',
      'maxlength': 'Max 12 chars',
    }
  };


  constructor(private appLoginService: AppLoginService,
              private appSharedService: AppSharedService,
              private router: Router,
              private _stompService: StompService,
              private fb: FormBuilder) {
    this.loginCounter = 0;
  };

  public ngOnInit() {
    this.buildForm();
  }

  private buildForm(): void {
    this.formErrors = {
      'login': '',
      'password': ''
    };

    this.createLoginForm = this.fb.group({
      'login': [this.login,
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ],
      'password': [this.password, [
        Validators.required,
        Validators.minLength(6)
      ]
      ],
    });

    this.createLoginForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

    this.onValueChanged();
  }


  private onValueChanged(data?: any) {
    if (!this.createLoginForm) {
      return;
    }
    const form = this.createLoginForm;

    for (const field in this.formErrors) {
      // clear previous error message (if any)
      this.formErrors[field] = '';
      const control = form.get(field);
      if (control && (control.dirty) && !control.valid) {
        const messages = this.validationMessages[field];
        for (const key in control.errors) {
          if (!(<string>this.formErrors[field]).includes(messages[key])) {
            this.formErrors[field] += messages[key] + ' ';
          }
        }
      }
    }
  }

  public onChange(e, type) {

  }

  public changeLoginButton() {
    this.appSharedService.change();
  }

  public onSubmit() {
    if (this.createLoginForm.valid) {

      this.appLoginService.login(this.login, this.password)
        .subscribe((res: any) => {
          this.changeLoginButton();

          let jsonLogin = JSON.parse(res._body);
          let token = jsonLogin.token;
          let decodedToken = jwtDecode(token);

          localStorage.setItem("mv_token_odsfkgsmkn4nkwkjk2nn3", token);

          if (decodedToken.roles.includes('ROLE_ADMIN')) {
            localStorage.setItem("mv_admin", 'yes');
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/home']);
          }
        }, (err) => {
          this.loginCounter++;
          if (this.loginCounter % 3 == 0) {
            this.stomp_subscription = this._stompService.publish('/queue/incorrect-login', this.loginCounter.toString());
          }
          let json = JSON.parse(err._body);
          this.formErrors['login'] = json.message;
          this.formErrors['password'] = json.message;
        })
    }
  }
}
