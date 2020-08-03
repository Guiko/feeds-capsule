import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from '../../../services/NativeService';
import { CameraService } from 'src/app/services/CameraService';
import { ThemeService } from '../../../services/theme.service';
import { TranslateService } from "@ngx-translate/core";
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
@Component({
  selector: 'app-comment',
  templateUrl: './comment.page.html',
  styleUrls: ['./comment.page.scss'],
})
export class CommentPage implements OnInit {
  public nodeStatus:any={};
  public channelAvatar = "";
  public channelName = "";
  public subscribers;
  private newComment: string="";
  private nodeId: string;
  private channelId: number;
  private postId: number;
  public  isNewPost:boolean = true;
  constructor(
    private events: Events,
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private navCtrl: NavController,
    private camera: CameraService,
    private zone: NgZone,
    private feedService: FeedService,
    public theme:ThemeService,
    private translate:TranslateService) { }

  ngOnInit() {

    this.acRoute.params.subscribe((data)=>{
      this.nodeId = data.nodeId;
      this.channelId = data.channelId;
      this.postId = data.postId;
    });
  }

  ionViewWillEnter() {
    let channel = this.feedService.getChannelFromId(this.nodeId,this.channelId) || {};
    this.channelName = channel["name"] || "";
    this.subscribers = channel["subscribers"] || "";
    this.channelAvatar = this.feedService.parseChannelAvatar(channel["avatar"]) || "";
    this.isNewPost = true;
    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });

    this.events.subscribe('rpcRequest:error', () => {
      this.isNewPost = true;
   });

   this.events.subscribe("feeds:friendConnectionChanged", (nodeId, status)=>{
    this.zone.run(()=>{
      this.nodeStatus[nodeId] = status;
    });
   });

    this.initTitle();
    this.initnodeStatus();
    this.native.setTitleBarBackKeyShown(true);
  }

  ionViewWillLeave(){
      this.events.unsubscribe("feeds:updateTitle");
      this.events.unsubscribe("rpcRequest:error");
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("CommentPage.newComment"));
  }

  publishComment(){ 
    if(!this.isNewPost){
      this.native.toast_trans("common.sending");
    }else{
      this.isNewPost = false;
      let newComment = this.native.iGetInnerText(this.newComment) || "";
      if(newComment===""){
        this.native.toast_trans('CommentPage.enterComments');
        this.isNewPost = true;
        return false;
      }
      this.feedService.postComment(this.nodeId,Number(this.channelId),Number(this.postId),0,this.newComment);
      this.native.pop();
    }
 
  }

  checkServerStatus(nodeId: string){
    return this.feedService.getServerStatusFromId(nodeId);
  }

  initnodeStatus(){
     let status = this.checkServerStatus(this.nodeId);
    this.nodeStatus[this.nodeId] = status;
  }

}