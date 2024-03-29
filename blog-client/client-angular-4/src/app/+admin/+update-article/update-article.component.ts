import {ChangeDetectorRef, Component, OnInit} from "@angular/core";
import {ArticleDto} from "../../dto/ArticleDto";
import {AppArticleService} from "../../service/app.article.service";
import {CommonUtil} from "../../util/common.util";
import {ActivatedRoute, Router} from "@angular/router";
import {TagDto} from "../../dto/TagDto";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Meta} from "@angular/platform-browser";
import {AppTagService} from "../../service/app.tag.service";
import {Md5} from "ts-md5";


@Component({
    selector: 'update-article',
    templateUrl: './update-article.component.html',
})
export class UpdateArticleComponent implements OnInit {

    private model: ArticleDto;
    private tags: TagDto[];
    private selectedImage: string;
    private patternNoSpace = /^\S*$/;
    formErrors: any;
    updateArticleForm: FormGroup;

    constructor(private appArticleService: AppArticleService,
                private route: ActivatedRoute,
                private appTagsService: AppTagService,
                private _changeDetectionRef: ChangeDetectorRef,
                private fb: FormBuilder,
                private router: Router,
                private meta: Meta) {
        this.meta.addTag({name: 'robots', content: 'noindex'});
        this.model = new ArticleDto();
        this.tags = [];
        this.selectedImage = "";
    }

    readonly validationMessages = {
        'name': {
            'required': 'Required',
            'minlength': 'Min 2 chars',
            'maxlength': 'Max 64 chars',
        },
        'content': {
            'required': 'Required',
        },
    };

    public ngOnInit() {
        if (!localStorage.getItem("mv_token_odsfkgsmkn4nkwkjk2nn3")) {
            this.router.navigate(['/login']);
        }
        this.getAllTags();
        this.getArticle();
        this.buildForm();
    }

    private getArticle() {
        return new Promise((resolve, reject) => {
            this.route.params.subscribe(params => {
                params['id'] ? resolve(params['id']) : reject("No article found");
            });
        }).then(id => {
            this.appArticleService.getArticleByUrlId(<string>id)
                .subscribe((res: any) => {
                    let jsonArray = JSON.parse(res._body);
                    this.model.id = jsonArray.id;
                    this.model.createdAt = jsonArray.createAt;
                    this.model.updatedAt = jsonArray.updatedAt;
                    this.model.name = jsonArray.name;
                    this.model.content = jsonArray.content;
                    this.model.image = jsonArray.image;
                    this.model.tags = jsonArray.tags;
                    if(jsonArray.image){
                      this.selectedImage =  'assets/image/' + jsonArray.image;
                    }

                    this._changeDetectionRef.detectChanges();
                }, CommonUtil.handleError)
        }).catch(error => console.error(error));
    }

    private buildForm(): void {
        this.formErrors = {
            'name': '',
            'content': '',
            'image': '',
        };

        this.updateArticleForm = this.fb.group({
            'name': [this.model.name,
                [
                    Validators.required,
                    Validators.minLength(2),
                    Validators.maxLength(64)
                ]
            ],
            'content': [this.model.content,
                [
                     Validators.maxLength(3000)
                ]
            ],
            'image': [this.model.image]
        });

        this.updateArticleForm.valueChanges
            .subscribe(data => this.onValueChanged(data));

        this.onValueChanged();
    }

    private onValueChanged(data?: any) {
        if (!this.updateArticleForm) {
            return;
        }
        const form = this.updateArticleForm;

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

  public onFileChange(event) {
    let reader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
      let file = event.target.files[0];
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.model.image = {

          filename: Md5.hashStr(file.name) + '.' + file.name.split('.')[1],
          filetype: file.type,
          value: reader.result.split(',')[1]
        };
        this.selectedImage = reader.result;
      };
    }
  }

  public clearFile() {
    this.selectedImage = '';
    this.model.image = '';
    }

  public clearTags() {
    this.model.tags = [];
  }

    private getAllTags() {
        this.appTagsService.getAllTags()
            .subscribe((res: any) => {
                let jsonArray = JSON.parse(res._body);
                this.tags = [];
                jsonArray.map(tag => {
                    let t = new TagDto();
                    t.id = tag.id;
                    t.createdAt = tag.createdAt;
                    t.updatedAt = tag.updatedAt;
                    t.name = tag.name;
                    this.tags.push(t);
                });

            }, CommonUtil.handleError)
    }

    public onSubmit() {
      if(this.updateArticleForm.valid){
        this.appArticleService.updateArticle(this.model)
          .subscribe((res: any) => {
            this.router.navigate(['/admin/list-of-articles']);
          }, CommonUtil.handleError)
      }
    }

    public disableSendButton(e) {

    }
}
