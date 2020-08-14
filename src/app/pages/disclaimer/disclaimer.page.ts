import { Component, OnInit } from '@angular/core';
import { Events,ModalController, } from '@ionic/angular';
import { TranslateService } from "@ngx-translate/core";
import { NativeService } from 'src/app/services/NativeService';
import { AppService } from './../../services/AppService';
import { SplashscreenPage } from './../../pages/splashscreen/splashscreen.page';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
declare let appManager: AppManagerPlugin.AppManager;
@Component({
  selector: 'app-disclaimer',
  templateUrl: './disclaimer.page.html',
  styleUrls: ['./disclaimer.page.scss'],
})
export class DisclaimerPage implements OnInit {

  constructor(
    private modalCtrl: ModalController,
    private appService: AppService,
    private events: Events,
    private native: NativeService,
    private translate:TranslateService,){

     }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });
  }

  ionViewDidEnter(){
    this.initTitle();
    this.native.setTitleBarBackKeyShown(false);
    appManager.setVisible('show');
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("DisclaimerPage.disclaimer"));
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:updateTitle");
  }

  cancel(){
      appManager.close();
  }

  confirm(){
    localStorage.setItem('org.elastos.dapp.feeds.disclaimer',"11");
    this.init();
  }

  init(){
        let isFirst = localStorage.getItem('org.elastos.dapp.feeds.first') || "";
        if(isFirst!=""){
          this.appService.addright();
          this.appService.initializeApp();
        }else{
          localStorage.setItem('org.elastos.dapp.feeds.first',"11");
          this.splash();
        }
  }

  async splash() {
    const splash = await this.modalCtrl.create({component: SplashscreenPage});
    return await splash.present();
  }

}