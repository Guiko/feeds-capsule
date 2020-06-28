import { Component, OnInit, NgZone } from '@angular/core';
import { Events, Platform, LoadingController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { CarrierService } from 'src/app/services/CarrierService';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { AppService } from 'src/app/services/AppService';
import { PopupProvider } from 'src/app/services/popup';

@Component({
  selector: 'page-add-server',
  templateUrl: 'add-server.html',
  styleUrls: ['add-server.scss'],
})

export class AddServerPage implements OnInit {
  private connectStatus = 1;
  private address: string = '';
  private friendRequest = 'Feeds/0.1';
  private buttonDisabled = true;
  private carrierAddress: string;
  private name: string;
  private owner: string;
  private introduction: string;
  private did: string;
  private feedsUrl: string;

  constructor(
    private events: Events,
    private zone: NgZone,
    private acRoute: ActivatedRoute,
    private platform: Platform,
    private native: NativeService,
    private feedService: FeedService,
    private appService: AppService,
    private popup: PopupProvider,
    private loadingController: LoadingController,
    private carrier: CarrierService) {
      this.connectStatus = this.feedService.getConnectionStatus();
      this.acRoute.params.subscribe(data => {
        this.address = data.address;
        if (this.address == null ||
          this.address == undefined||
          this.address == '')
          return;
          this.zone.run(()=>{
            this.presentLoading();
          });
        this.queryServer();
      });

      this.events.subscribe('feeds:connectionChanged', connectionStatus => {
        this.zone.run(() => {
            this.connectStatus = connectionStatus;
        });
      });

      this.events.subscribe('feeds:updateServerList', ()=>{
        this.zone.run(() => {
          this.native.pop();
        });
      });
  }

  ngOnInit() {}

  navToBack() {
    this.native.pop();
  }

  addServer() {
    this.feedService.addServer(this.carrierAddress,this.friendRequest,
      this.name, this.owner, this.introduction, 
      this.did, this.feedsUrl, ()=>{
        this.native.pop();
      },(err)=>{

      });
  }

  scanCode(){
    this.native.pop();
    this.appService.scanAddress();
  }

  alertError(error: string){
    alert (error);
  }
  
  onChange(){
    this.queryServer();
  }

  queryServer(){
    if (this.address.length > 53&&
      this.address.startsWith('feeds://') && 
      this.address.indexOf("did:elastos:")
    ){
      
      this.resolveDid();
    }
  }

  resolveDid(){
    this.feedService.resolveDidDocument(this.address,null,
      (server)=>{
        this.zone.run(()=>{
          this.buttonDisabled = false;
          this.name = server.name;
          this.owner = server.owner;
          this.introduction = server.introduction;
          this.did = server.did;
          this.carrierAddress = server.carrierAddress;
          this.feedsUrl = server.feedsUrl;
        });
      },(err)=>{
        this.buttonDisabled = true;
      }
    );
  }

  async presentLoading() {
    const loading = await this.loadingController.create({
      message: 'Please wait...',
      duration: 2000
    });
    await loading.present();

    const { role, data } = await loading.onDidDismiss();
  }
}
