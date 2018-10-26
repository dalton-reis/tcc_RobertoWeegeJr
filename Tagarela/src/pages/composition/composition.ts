import { Component } from '@angular/core';
import { NavParams, LoadingController, AlertController, PopoverController, ToastController } from 'ionic-angular';
import { MusicalCompositionControl } from '../../control/musical-composition';
import { GenericComponent } from '../../control/generic-component';

@Component({
  selector: 'page-composition',
  templateUrl: 'composition.html',
})
export class CompositionPage extends GenericComponent{

    private _compositionControl: MusicalCompositionControl;

    constructor(private navParams: NavParams, 
                private loadingCtrl: LoadingController,
                private alertCtrl: AlertController,
                private popoverCtrl: PopoverController,
                private toastCtrl: ToastController) { 

        super(loadingCtrl,
              alertCtrl,
              popoverCtrl,
              toastCtrl);
            
    }

    get compositionControl(): MusicalCompositionControl {
        return this._compositionControl;
    }
    
    set compositionControl(compositionControl: MusicalCompositionControl) {
        this._compositionControl = compositionControl;
    }

    private ngOnInit(){
        try {
            this.compositionControl = this.navParams.get('compositionControl');
        } catch (e) {
            this.errorHandler(e);
        }
    }

}
