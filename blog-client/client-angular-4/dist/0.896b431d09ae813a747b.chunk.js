webpackJsonp([0],{"M/y8":function(n,t,e){"use strict";e.d(t,"a",(function(){return s}));var a=e("TToO"),r=e("2Je8"),o=e("NVOs"),i=e("3j3K"),c=e("5oXY"),l=e("PeBX"),u=e("VmGV"),s=(function(){function n(){}return n.routes=l.a,n=a.a([e.i(i.NgModule)({declarations:[u.a],imports:[r.CommonModule,o.FormsModule,o.ReactiveFormsModule,c.a.forChild(l.a)]})],n)})()},PeBX:function(n,t,e){"use strict";e.d(t,"a",(function(){return r}));var a=e("VmGV"),r=[{path:"",children:[{path:"",component:a.a},{path:"create-article",loadChildren:function(){return e.e(3).then(e.bind(null,"wwha")).then((function(n){return n.CreateArticleModule}))}},{path:"update-article/:id",loadChildren:function(){return e.e(2).then(e.bind(null,"tqdi")).then((function(n){return n.UpdateArticleModule}))}},{path:"list-of-articles",loadChildren:function(){return e.e(5).then(e.bind(null,"I/dt")).then((function(n){return n.ListOfArticlesModule}))}},{path:"manage-tags",loadChildren:function(){return e.e(4).then(e.bind(null,"OnQD")).then((function(n){return n.ManageTagsModule}))}}]}]},VmGV:function(n,t,e){"use strict";e.d(t,"a",(function(){return l}));var a=e("TToO"),r=e("3j3K"),o=e("Qbdm"),i=e("5oXY"),c=e("cRbg"),l=(function(){function n(n,t,e){this.meta=n,this.router=t,this.appCacheService=e,this.meta.addTag({name:"robots",content:"noindex"})}return n.prototype.ngOnInit=function(){localStorage.getItem("mv_token_odsfkgsmkn4nkwkjk2nn3")||this.router.navigate(["/login"])},n.prototype.clearAllCaches=function(){this.appCacheService.clearAllCaches().subscribe()},n=a.a([e.i(r.Component)({selector:"admin",template:e("fcrN")}),a.b("design:paramtypes",[o.d,i.c,c.a])],n)})()},fcrN:function(n,t){n.exports='<div class="container">\n    <div class="btn-group col-lg-12">\n        <a [routerLink]="[\'./create-article\']" class="btn btn-brown col-lg-3"> Create Article </a>\n        <a [routerLink]="[\'./list-of-articles\']" class="btn btn-grey col-lg-3">List of Articles</a>\n        <a [routerLink]="[\'./manage-tags\']" class="btn btn-elegant col-lg-3">Manage Tags</a>\n        <a (click)="clearAllCaches()" class="btn btn-blue-grey col-lg-3">Clear All Caches</a>\n    </div>\n</div>\n'},gOdG:function(n,t,e){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var a=e("M/y8");e.d(t,"AdminModule",(function(){return a.a}))}});