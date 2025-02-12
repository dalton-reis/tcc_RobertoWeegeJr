import { Component } from '@angular/core';
import { Midi } from '../../model/midi';
import { GenericComponent } from '../../control/generic-component';
import { NavController, NavParams, LoadingController, AlertController, PopoverController, ToastController } from 'ionic-angular';
import { FileProvider } from '../../providers/file/file';
import { MidiFileControl } from '../../control/midi';
import { ValidatorFn, FormControl, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Device } from '@ionic-native/device';

@Component({
  selector: 'download-midi',
  templateUrl: 'download-midi.html'
})
export class DownloadMidiComponent extends GenericComponent{

    private _title: string;
    private _fileName: string;
    private _midi: Midi;
    private _midiControl: MidiFileControl;
    private _fileNameForm: FormGroup;

    constructor(private navCtrl: NavController, 
                private navParams: NavParams, 
                private fileProvider: FileProvider, 
                private loadingCtrl: LoadingController,
                private alertCtrl: AlertController,
                private popoverCtrl: PopoverController,
                private toastCtrl: ToastController,
                private formBuilder: FormBuilder,
                private dev: Device) {

        super(loadingCtrl,
            alertCtrl,
            popoverCtrl,
            toastCtrl,
            dev);
    
    }
    
    get title(): string {
        return this._title;
    }
    
    set title(title: string) {
        this._title = title;
    }

    get fileName(): string {
        return this._fileName;
    }

    set fileName(fileName: string) {
        this._fileName = fileName;
    }

    get midi(): Midi {
        return this._midi;
    }

    set midi(midi: Midi) {
        this._midi = midi;
    }

    get midiControl(): MidiFileControl {
        return this._midiControl;
    }
    
    set midiControl(midiControl: MidiFileControl) {
        this._midiControl = midiControl;
    }

    get fileNameForm(): FormGroup {
        return this._fileNameForm;
    }
    
    set fileNameForm(fileNameForm: FormGroup) {
        this._fileNameForm = fileNameForm;
    }

    private ngOnInit(): void {
        try { 
            this.midiControl = new MidiFileControl();
            this.midi = this.navParams.get("midi");
            this.title = 'Baixar Composição';
            this.fileName = 'Minha Composição';
            this.fileNameForm = this.formBuilder.group({
                fileName: [this.fileName, Validators.compose([this.required(this.errorHandler.bind(this)), this.fileNameRegex(this.errorHandler.bind(this))])],
            });

        } catch (e) {
            this.errorHandler(e);
        }
    }

    private async downloadMidi(): Promise<void> {
        try {

            if (await this.fileProvider.verifyFileToDownloadMidi(this.fileName)) {
                this.startAlert({
                    title: 'Sobrescrever?',
                    subTitle: `O arquivo ${this.fileName} já existe. Deseja sobrescrever?`,
                    buttons: [ {
                            text: 'Cancelar',
                            role: 'cancel'
                        },
                        {
                            text: 'Sim',
                            handler: this.whiteMidiFileAndExit.bind(this) 
                        },
                    ]
                });
            } else {
                this.whiteMidiFileAndExit();
            }
        } catch (e) {
            this.errorHandler(e);
        }

    }

    private async whiteMidiFileAndExit(): Promise<void> {
        try {
            this.createLoading('Baixando Arquivo');
            await this.fileProvider.writeBinaryStringDownloadArea(this.fileName, this.midiControl.getBinaryString(this.midi));
            this.dismissLoading();
            this.createDefaultToast('Arquivo Salvo com Sucesso!');
            this.navCtrl.pop();
        } catch (e) {
            this.errorHandler(e);
            this.navCtrl.pop();
        }
    }

    private required(errorHandlerFunction: Function): ValidatorFn {
        return (control: FormControl) => {
            try {
               return Validators.required(control);
            } catch (e) {
                errorHandlerFunction(e);
                return {
                    "validation_error": true
                };
            }
        }
    }

    private fileNameRegex(errorHandlerFunction: Function): ValidatorFn {
        return (control: FormControl) => {
            try {
                let regexp = new RegExp('[a-zA-Z0-9_-]+[a-zA-Z0-9 _-]*');
                if (!regexp.test(control.value)) {
                    return {
                        "format_error": true
                    };    
                }
            } catch (e) {
                errorHandlerFunction(e);
                return {
                    "validation_error": true
                };
            }
        }
    }

}