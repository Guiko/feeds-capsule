import { Component, OnInit, NgZone } from '@angular/core';
import { Events} from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { HttpService } from 'src/app/services/HttpService';
import { ActionSheetController } from '@ionic/angular';
import { TranslateService } from "@ngx-translate/core";
import { ApiUrl } from 'src/app/services/ApiUrl';
import { MenuService } from 'src/app/services/MenuService';
import { UtilService } from 'src/app/services/utilService';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

class Attribute {
  constructor(
    public iconName: string,
    public attrName: string,
    public attrValue: string
  ) {}
}

@Component({
  selector: 'page-server-info',
  templateUrl: 'server-info.html',
  styleUrls: ['server-info.scss'],
})

export class ServerInfoPage implements OnInit {
  public developerMode:boolean =  false;
  public connectionStatus = 1;
  public buttonDisabled: boolean = true;
  public friendRequest = 'Feeds/0.1';
  public carrierAddress: string;

  public address: string = '';
  public isOwner: string = "false";
  public serverStatus:number = 1;
  public clientNumber:number = 0;
  public nodeId:string = "";

  public isBindServer: boolean = false;
  public didString: string = "";
  public name: string = "";
  public owner: string = "";
  public introduction: string = null;
  public feedsUrl: string = null;

  public elaAddress: string = "";

  public isPublic:string ="";
  public serverDetails: any[] = [];
  
  public isShowQrcode: boolean = true;
  public actionSheet:any = null;
  public  ownerChannelList:any = [];
  public nodeStatus: any = {};
  public channel:any =null;
  public clickbutton:string ="";
  constructor(
    private actionSheetController:ActionSheetController,
    private events: Events,
    private zone: NgZone,
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private feedService: FeedService,
    public theme: ThemeService,
    private translate: TranslateService,
    public httpService: HttpService,
    private menuService: MenuService
  ) {}

  ngOnInit() {
    this.acRoute.params.subscribe(data => {
      this.isOwner = data.isOwner || "";
      this.address = data.address || "";
  
      if (data.nodeId !== "0") {
        this.nodeId = data.nodeId || "";
      }
       
      this.initData();
      
      let didString = this.didString || "";
      if(this.checkIsMine()===0&&didString != ''){
       this.httpService.ajaxGet(ApiUrl.get+"?did="+this.didString,false).then((result)=>{
         if(result["code"] === 200){
            this.isPublic = result["data"] || "";
         }
       });
      }
      
    });
  }

  initData(){
    this.developerMode = this.feedService.getDeveloperMode();
    if (this.address !== '') {
      this.native.showLoading('common.waitMoment',2000).then(()=>{
        this.queryServer();
      });
    } else {
      let server: any;
      let bindingServer = this.feedService.getBindingServer();
      
      if (
        bindingServer !== null &&
        bindingServer !== undefined &&
        this.nodeId === bindingServer.nodeId
      ) {
        server = this.feedService.getServerbyNodeId(this.nodeId);
        this.isBindServer = true;

        this.isShowQrcode = false;
        this.feedService.checkDIDOnSideChain(server.did,(isOnSideChain)=>{
          this.zone.run(() => {
            this.isShowQrcode = isOnSideChain;
            if (!this.isShowQrcode ){
              this.native.toastWarn('common.waitOnChain');
            }
          });
        });

        
      }else{
        server = this.feedService.getServerbyNodeId(this.nodeId);
        this.isBindServer = false;
      }

      this.serverStatus = this.feedService.getServerStatusFromId(this.nodeId);
      this.clientNumber = this.feedService.getServerStatisticsNumber(this.nodeId);

      if (server === undefined) {
        return ;
      }

      this.didString = server.did;
      this.name = server.name ||  this.translate.instant('DIDdata.NotprovidedfromDIDDocument');
      this.owner = server.owner;
      this.introduction = server.introduction;
      this.feedsUrl = server.feedsUrl || "";
      this.elaAddress = server.elaAddress || this.translate.instant('DIDdata.Notprovided');
      this.collectServerData(server);
    }
  }

  ionViewWillEnter() {
    this.initTitle();
    if(this.address === ''){
      this.initMyFeeds();
    }
    this.native.setTitleBarBackKeyShown(true);
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.events.subscribe('feeds:connectionChanged', (status) => {
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe("feeds:updateServerList", () => {
      this.zone.run(() => {
      this.native.navigateForward('/menu/servers',""); 
      });
    });
  
    this.events.subscribe('feeds:serverConnectionChanged', serversStatus => {
      this.zone.run(() => {
          if (this.address === ""){
            this.serverStatus = this.feedService.getServerStatusFromId(this.nodeId);
          }
      });
    });

    this.events.subscribe('feeds:serverConnectionChanged', serversStatus => {
      this.zone.run(() => {
          if (this.address === ""){
            this.serverStatus = this.feedService.getServerStatusFromId(this.nodeId);
          }
      });
    });

    this.events.subscribe('feeds:login_finish',  () => {
      this.zone.run(() => { 
        this.initData();
        this.native.hideLoading();
      });
    });

    this.events.subscribe("feeds:updateTitle", () => {
      if(this.menuService.postDetail!=null){
        this.menuService.hideActionSheet();
     
        if(this.clickbutton === "unsubscribe"){
           this.unsubscribe(this.channel);
           return;
        }
        //this.menuMore();
      }
      this.initTitle();
    });

    this.events.subscribe("feeds:editServer", () => {
      if(!this.isShowQrcode){
        this.native.toastWarn('common.waitOnChain');
        return;
      }
      this.clickEdit();
    });

    this.events.subscribe("feeds:removeFeedSourceFinish", () => {
      this.native.hideLoading();
    });

    this.events.subscribe('feeds:subscribeFinish', (nodeId, channelId, name)=> {
      // this.native.toast(name + " subscribed");
      this.zone.run(() => {
        this.initMyFeeds();
      });
    });

    this.events.subscribe('feeds:unsubscribeFinish', (nodeId, channelId, name) => {
      // this.native.toast(name + " unsubscribed");
      this.zone.run(() => {
        this.clickbutton ="";
        this.initMyFeeds();
      });
    });

    this.events.subscribe("feeds:friendConnectionChanged", (nodeId, status)=>{
      this.zone.run(()=>{
        this.nodeStatus[nodeId] = status;
      });
    });
  }

  ionViewDidEnter(){
  }

  ionViewWillLeave(){
    titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_RIGHT, null);

    this.native.hideLoading();
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:updateServerList");
    this.events.unsubscribe("feeds:serverConnectionChanged");
    this.events.unsubscribe("feeds:removeFeedSourceFinish");
    this.events.unsubscribe("feeds:updateTitle");
    this.events.unsubscribe("feeds:editServer");
    this.events.unsubscribe('feeds:subscribeFinish');
    this.events.unsubscribe('feeds:unsubscribeFinish');
    this.events.unsubscribe('feeds:friendConnectionChanged');
    this.clickbutton = "";
    if(this.actionSheet!=null)
      this.actionSheet.dismiss();
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant('ServerInfoPage.title'));

    if (this.address === '' && this.checkIsMine() == 0) {
      titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_RIGHT, {
        key: "editServer",
        iconPath: TitleBarPlugin.BuiltInIcon.EDIT
      });
    } else {
      titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_RIGHT, null);
    }
  }

  navigateBackPage() {
    this.native.pop();
  }

  collectServerData(server) {

    this.serverDetails = [];

    this.serverDetails.push({
      type: this.translate.instant('ServerInfoPage.name'),
      details: server.name ||  this.translate.instant('DIDdata.NotprovidedfromDIDDocument')
    });

    if (this.isOwner == 'true'){
      this.serverDetails.push({
        type: this.translate.instant('ServerInfoPage.owner'),
        details: server.owner || ""
      });  
    }

    if(this.developerMode){
      this.serverDetails.push({
        type: this.translate.instant('ServerInfoPage.UserId'),
        details: server.nodeId || ""
      });
    }

    this.serverDetails.push({
      type: this.translate.instant('ServerInfoPage.introduction'),
      details: server.introduction || ""
    });

    let version = this.feedService.getServerVersionByNodeId(server.nodeId)
    if (version != ""){
      this.serverDetails.push({
        type: this.translate.instant('ServerInfoPage.version'),
        details: version || this.translate.instant('common.infoObtaining'),
      });
    }
    
    
    this.serverDetails.push({
      type: this.translate.instant('IssuecredentialPage.elaaddress'),
      details: server.elaAddress || ""
    });
    this.serverDetails.push({
      type: this.translate.instant('ServerInfoPage.did'),
      details: this.feedService.rmDIDPrefix(server.did)
    }); 
    this.serverDetails.push({
      type: this.translate.instant('ServerInfoPage.feedsSourceQRCode'),
      details: server.feedsUrl || "",
      qrcode: true
    });
 
  }

  menuMore() {
    this.clickbutton ="";
    const shareableUrl = "https://scheme.elastos.org/addsource?source="+encodeURIComponent(this.feedsUrl);
    this.menuService.showQRShareMenu(this.translate.instant('ServerInfoPage.des'),shareableUrl);
  }

  /* getShareableUrl(qrcode: string) {
    let url = "https://scheme.elastos.org/addsource?source="+encodeURIComponent(qrcode);
  } */


  queryServer(){
    if (
      this.address.length > 53 &&
      this.address.startsWith('feeds://') &&
      this.address.indexOf("did:elastos:")
    ) this.resolveDid();
    else {
      this.native.toastWarn("ServerInfoPage.Feedurlmaybeerror");
      this.navigateBackPage();
    }
  }

  resolveDid(){
    this.feedService.resolveDidDocument(this.address, null,
      (server) => {
        this.zone.run(() => {
          this.native.hideLoading();
          this.buttonDisabled = false;
          this.name = server.name || this.translate.instant('DIDdata.NotprovidedfromDIDDocument');
          this.owner = server.owner;
          this.introduction = server.introduction;
          this.didString = server.did;
          this.carrierAddress = server.carrierAddress;
          this.feedsUrl = server.feedsUrl || "";
          this.collectServerData(server);
        });
      }, (err) => {
        this.native.hideLoading();
        this.native.toastWarn("ServerInfoPage.error");
        this.buttonDisabled = true;
        this.navigateBackPage();
      }
    );
  }

  addFeedSource() {
    if(this.connectionStatus !== 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.feedService.addServer(
      this.carrierAddress,
      this.friendRequest,
      this.name,
      this.owner,
      this.introduction,
      this.didString,
      this.feedsUrl, 
    () => {
      this.native.navigateForward('/menu/servers',""); 
    }, (err) => {
      this.native.pop();
    });
  }

  async deleteFeedSource(){
    if(this.connectionStatus != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.actionSheet = await this.actionSheetController.create({
      cssClass:'editPost',
      buttons: [{
        text: this.translate.instant("ServerInfoPage.DeletethisFeedSource"),
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.native.showLoading('common.waitMoment');
          this.feedService.deleteFeedSource(this.nodeId).then(() => {
            this.native.toast("ServerInfoPage.removeserver"); 
            this.native.hideLoading();
            this.navigateBackPage();
          });
        }
      }, {
        text: this.translate.instant("ServerInfoPage.cancel"),
        icon: 'close',
        handler: () => {
        }
      }]
    });

    this.actionSheet.onWillDismiss().then(()=>{
      if(this.actionSheet !=null){
        this.actionSheet  = null;
      }
  });

    await this.actionSheet.present();

  }

  async removeFeedSource(){
    if(this.connectionStatus !== 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.actionSheet = await this.actionSheetController.create({
      cssClass:'editPost',
      buttons: [{
        text: this.translate.instant("ServerInfoPage.RemovethisFeedSource"),
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.native.showLoading('common.waitMoment');
          this.feedService.removeFeedSource(this.nodeId).then(() => {
            this.native.toast("ServerInfoPage.removeserver"); 
            this.native.hideLoading();
            this.navigateBackPage();
          });
        }
      },{
        text: this.translate.instant("ServerInfoPage.cancel"),
        icon: 'close',
        handler: () => {
        }
      }]
    });
    this.actionSheet.onWillDismiss().then(()=>{
      if(this.actionSheet !=null){
        this.actionSheet  = null;
      }
  });
    await this.actionSheet.present();
  }

  clickEdit(){
    if(this.feedService.getConnectionStatus() !== 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    if(this.feedService.getServerStatusFromId(this.nodeId) !== 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.native.go(
      "/editserverinfo", 
      { 
        "address": this.address,
        "name": this.name,
        "introduction": this.introduction,
        "elaAddress": this.elaAddress,
        "nodeId": this.nodeId,
        "did": this.didString,
      }
    )
  }

  checkIsMine(){
    let bindingServer = this.feedService.getBindingServer();
    if (bindingServer === null || bindingServer === undefined) {
      return 1;
    }
    
    let bindServerDid = bindingServer.did || '';
    if (this.didString === bindServerDid)
      return 0;

    return 1;
  }

  clickPublic(){
    if(this.isPublic === ""){
       this.publicFeeds();
    }else{
       this.unPublicFeeds();
    }
  }

  publicFeeds(){
    let obj = {
      "did":this.didString,
      "name":this.name,
      "description":this.introduction,
      "url":this.feedsUrl
    };
   
    this.httpService.ajaxPost(ApiUrl.register,obj).then((result)=>{
      if(result["code"] === 200){
          this.isPublic = "111";
          this.native.toast_trans("ServerInfoPage.publicTip");
      }
    });
  }

  unPublicFeeds(){ 
    this.httpService.ajaxGet(ApiUrl.remove+"?did="+this.didString).then((result)=>{
      if(result["code"] === 200){
          this.isPublic = "";
          this.native.toast_trans("ServerInfoPage.unpublicTip");
      }
    });
  }

  updatePublic(){
    let obj = {
      "did":this.didString,
      "name":this.name,
      "description":this.introduction,
      "url":this.feedsUrl
    };
    this.httpService.ajaxPost(ApiUrl.update,obj).then((result)=>{
      if(result["code"]=== 200){
        this.native.toast("test update");
      }
    });
  }

  initMyFeeds(){
    //this.ownerChannelList = this.feedService.getMyChannelList();
    this.ownerChannelList = this.feedService.getChannelsListFromNodeId(this.nodeId);
    this.initnodeStatus();
  }

  parseChannelAvatar(avatar: string): string{
    return this.feedService.parseChannelAvatar(avatar);
  }

  moreName(name:string){
    return UtilService.moreNanme(name);
 }

 pressName(channelName:string){
  let name =channelName || "";
  if(name != "" && name.length>15){
    this.native.createTip(name);
  }
 }
//channel.nodeId, channel.name, channel.id
  unsubscribe(channel:any){
    this.clickbutton = "unsubscribe";
    this.channel = channel;
    this.menuService.showUnsubscribeMenu(channel.nodeId, channel.id,channel.name);
  }
//channel.nodeId, channel.id
  subscribe(channel:any){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }
    
    this.feedService.subscribeChannel(channel.nodeId, channel.id);
  }

  initnodeStatus(){
    for(let index =0 ;index<this.ownerChannelList.length;index++){
           let nodeId = this.ownerChannelList[index]['nodeId'];
           let status = this.checkServerStatus(nodeId);
           this.nodeStatus[nodeId] = status;
    }
 }

 checkServerStatus(nodeId: string){
  return this.feedService.getServerStatusFromId(nodeId);
 }

 navTo(nodeId:string, channelId:number){
  this.native.navigateForward(['/channels', nodeId, channelId],"");
 }

 copytext(text:any){
  let textdata = text || "";
  if(textdata!=""){
    this.native.copyClipboard(text).then(()=>{
      this.native.toast_trans("common.copysucceeded");
  }).catch(()=>{

  });;
  }
}
}
