import { MusicalCompositionConfig, MusicalCompositionStepConfig, MusicalCompositionLinesConfig, MusicalCompositionOptionConfig, MusicalCompositionLineConfig } from "../model/musical-composition-config";
import { MusicalCompositionSource } from "../model/musical-composition-source";
import { FileProvider } from "../providers/file/file";
import { Midi, MidiTimeDivisionMetrical } from "../model/midi";
import { MidiControl } from "./midi";

export class MusicalCompositionConfigControl {

    //static constants
    public static DEFAULT_COMPOSITION_SOURCES_RELATIVE_PATH: string = 'www/assets/composition-sources/'
    public static CUSTOM_COMPOSITION_SOURCES_RELATIVE_PATH: string = 'Tagarela/Musicoterapia/Composicoes/'

    //private constants
    private CONFIG_FILE_NAME: string = 'config.json';

    private CONFIG_DEFAULT_MIN_TEMPO: number = 40 
    private CONFIG_DEFAULT_MAX_TEMPO: number = 240
    private CONFIG_DEFAULT_STEP_TEMPO: number = 1
    private CONFIG_DEFAULT_DEFAULT_TEMPO: number = 120

    private CONFIG_DEFAULT_QUANTITY_OF_QUARTER_NOTE: number = 8

    private CONFIG_DEFAULT_MUSICAL_INSTRUMENTS_ALLOWED: number[] = [0, 11, 13, 21, 24, 26, 33, 41, 46, 56, 57, 61, 65, 73, 105]
    private CONFIG_DEFAULT_DRUMS_MUSICAL_INSTRUMENTS_ALLOWED: number[] = [-1]

    private CONFIG_DEFAULT_MIN_VOLUME: number = 0 
    private CONFIG_DEFAULT_MAX_VOLUME: number = 200
    private CONFIG_DEFAULT_STEP_VOLUME: number = 10
    private CONFIG_DEFAULT_DEFAULT_VOLUME: number = 100

    private CONFIG_DEFAULT_KEY_SIGNATURE: number = 0;

    private CONFIG_DEFAULT_SHOW_COMPOSITION_DATA: boolean = true;

    //variables
    private _fileProvider: FileProvider;

    private _config: MusicalCompositionConfig;

    private _baseFileSystemComposition: string;
    private _baseFileSystemConfig: string;
    private _relativePath: string;

    private _midiControl: MidiControl;

    private _isCustomSource: boolean;

    constructor(file: FileProvider, baseFileSystem: string, relativePath: string, isCustomSource: boolean){
        this.midiControl = new MidiControl();
        this.fileProvider = file;
        this.baseFileSystemComposition = baseFileSystem;
        this.baseFileSystemConfig = (isCustomSource ? baseFileSystem : file.getDataDirectory());
        this.relativePath = relativePath;
    }

    get fileProvider(): FileProvider {
        return this._fileProvider;
    }
    
    set fileProvider(fileProvider: FileProvider) {
        this._fileProvider = fileProvider;
    }
    
    get config(): MusicalCompositionConfig {
        return this._config;
    }
    
    set config(config: MusicalCompositionConfig) {
        this._config = config;
    }
    
    get baseFileSystemComposition(): string {
        return this._baseFileSystemComposition;
    }
    
    set baseFileSystemComposition(baseFileSystemComposition: string) {
        this._baseFileSystemComposition = baseFileSystemComposition;
    }
    
    get baseFileSystemConfig(): string {
        return this._baseFileSystemConfig;
    }
    
    set baseFileSystemConfig(baseFileSystemConfig: string) {
        this._baseFileSystemConfig = baseFileSystemConfig;
    }
    
    get relativePath(): string {
        return this._relativePath;
    }
    
    set relativePath(relativePath: string) {
        this._relativePath = relativePath;
    }

    get midiControl(): MidiControl {
        return this._midiControl;
    }
    
    set midiControl(midiControl: MidiControl) {
        this._midiControl = midiControl;
    }

    get isCustomSource(): boolean {
        return this._isCustomSource;
    }

    set isCustomSource(isCustomSource: boolean) {
        this._isCustomSource = isCustomSource;
    }

    public async persistConfig() {
        if (!this.config)
            throw Error('As configurações não estão carregadas');
        
        await this.fileProvider.writeFile(this.baseFileSystemConfig, this.relativePath, this.CONFIG_FILE_NAME, JSON.stringify(this.config));
    }

    public async getConfig(baseFileSystem: string): Promise<string> {
        if (!baseFileSystem)
            throw Error('A base do caminho é necessária');
        return await this.fileProvider.readFileTextContentIfExists(baseFileSystem, this.relativePath, this.CONFIG_FILE_NAME);
    }

    public async removeConfig(baseFileSystem: string) {
        if (!baseFileSystem)
            throw Error('A base do caminho é necessária');
        await this.fileProvider.removeFile(baseFileSystem, this.relativePath, this.CONFIG_FILE_NAME);
    }

    public async loadConfigs(){

        let config = new MusicalCompositionConfig();
        let lineQuantity: number;

        //set default values
        config.baseFileSystem = this.baseFileSystemComposition;
        config.relativePath = this.relativePath;
        config.minTempo = this.CONFIG_DEFAULT_MIN_TEMPO;
        config.maxTempo = this.CONFIG_DEFAULT_MAX_TEMPO;
        config.stepTempo = this.CONFIG_DEFAULT_STEP_TEMPO;
        config.defaultTempo = this.CONFIG_DEFAULT_DEFAULT_TEMPO;
        config.baseKeySignaturesAllowed = Midi.KEY_SIGNATURES_ARRAY;
        config.keySignaturesAllowed = Midi.KEY_SIGNATURES_ARRAY;
        config.keySignature = this.CONFIG_DEFAULT_KEY_SIGNATURE;
        config.showCompositionData = this.CONFIG_DEFAULT_SHOW_COMPOSITION_DATA
    
        let stepDirectoriesList: string[] = await this.fileProvider.getListOfDirectories(config.baseFileSystem, config.relativePath);
        
        //steps validation
        if (stepDirectoriesList.length < 1) {
            throw new Error('É necessário ao menos um passo para realizar a composição');
        }

        let stepConfig: MusicalCompositionStepConfig;
        let stepPath: string;
        let lineDirectoriesList: string[];
        let linesConfig: MusicalCompositionLinesConfig;
        let linePath: string;
        let optionFilesList: string[];
        let optionConfig: MusicalCompositionOptionConfig;

        //steps
        for (let stepDirectory of stepDirectoriesList) {
            stepConfig = new MusicalCompositionStepConfig();
            stepConfig.relativePath = stepDirectory; 
            stepConfig.quantityOfQuarterNote = this.CONFIG_DEFAULT_QUANTITY_OF_QUARTER_NOTE;

            stepPath = this.fileProvider.concatenatePath(config.relativePath, stepDirectory);
            lineDirectoriesList = await this.fileProvider.getListOfDirectories(config.baseFileSystem, stepPath);

            //lines validation
            if (lineDirectoriesList.length < 1) {
                throw new Error('É necessário ao menos um grupo para realizar a composição');
            }
            if (!lineQuantity) {
                lineQuantity = lineDirectoriesList.length;
            } else if (lineQuantity != lineDirectoriesList.length ){
                throw new Error('O número de grupos de composição deve ser igual em todos os passos');
            }

            //lines
            for (let lineDirectory of lineDirectoriesList) {
                linesConfig = new MusicalCompositionLinesConfig();
                linesConfig.relativePath = lineDirectory;

                linePath = this.fileProvider.concatenatePath(stepPath, lineDirectory);
                optionFilesList = await this.fileProvider.getListOfFiles(config.baseFileSystem, linePath)

                //options validation
                if (optionFilesList.length < 1) {
                    throw new Error('É necessário ao menos um grupo para realizar a composição');
                }

                //options
                for (let optionFile of optionFilesList) {
                    optionConfig = new MusicalCompositionOptionConfig();
                    optionConfig.fileName = optionFile;
                    linesConfig.optionsConfig.push(optionConfig);
                }
                stepConfig.linesConfig.push(linesConfig);
            }
            config.stepsConfig.push(stepConfig)
        }

        let newLineConfig: MusicalCompositionLineConfig;

        //lines config
        for (let stepConfig of config.stepsConfig) {
            for (let lineConfig of stepConfig.linesConfig) {
                if (!(config.linesConfig.find((element) => {
                    return element.name == lineConfig.relativePath
                }))) {
                    newLineConfig = new MusicalCompositionLineConfig();
                    newLineConfig.name = lineConfig.relativePath;
                    newLineConfig.minVolume = this.CONFIG_DEFAULT_MIN_VOLUME;
                    newLineConfig.maxVolume = this.CONFIG_DEFAULT_MAX_VOLUME;
                    newLineConfig.stepVolume = this.CONFIG_DEFAULT_STEP_VOLUME;
                    newLineConfig.defaultVolume = this.CONFIG_DEFAULT_DEFAULT_VOLUME;
                    config.linesConfig.push(newLineConfig);
                }
            }
            if (config.linesConfig.length != stepConfig.linesConfig.length) {
                throw Error("Exite inconsistência entre nome ou quantidade de grupos em cada etapa de composição")
            } 
        }
        this.config = config;
    }

    public async loadSavedConfigs(){
        
        let defaultConfigFile: boolean = false;
        let actualConfigString = await this.getConfig(this.baseFileSystemConfig);

        if (!actualConfigString && !this.isCustomSource) { 
            defaultConfigFile = true;
            actualConfigString = await this.getConfig(this.baseFileSystemComposition);
        }

        if (actualConfigString) {
            try {
                this.loadConfigFromJSON(actualConfigString);
            } catch (e) {
                if (!defaultConfigFile) {
                    this.removeConfig(this.baseFileSystemConfig);
                    throw new Error('O arquivo de configuração continha inconsistências, portanto foi removido. Temte novamente.');
                } else {
                    throw e;
                }
            }
        } 
    }

    private loadConfigFromJSON(actualConfigString: string) {
        
        let actualConfig = JSON.parse(actualConfigString);

        if (this.validateSavedConfig(this.config, actualConfig)) {
        
            this.config.minTempo = +actualConfig._minTempo;
            this.config.maxTempo = +actualConfig._maxTempo;
            this.config.stepTempo = +actualConfig._stepTempo;
            this.config.defaultTempo = +actualConfig._defaultTempo;

            this.config.keySignaturesAllowed = actualConfig._keySignaturesAllowed;
            this.config.keySignature = +actualConfig._keySignature;
            this.config.showCompositionData = actualConfig._showCompositionData;

            for (let i = 0; i < this.config.stepsConfig.length; i++) {
                this.config.stepsConfig[i].quantityOfQuarterNote = +actualConfig._stepsConfig[i]._quantityOfQuarterNote;
                for (let j = 0; j < this.config.stepsConfig[i].linesConfig.length; j++) {
                    for (let k = 0; k < this.config.stepsConfig[i].linesConfig[j].optionsConfig.length; k++) {
                        this.config.stepsConfig[i].linesConfig[j].optionsConfig[k].baseMusicalInstrumentsAllowed = actualConfig._stepsConfig[i]._linesConfig[j]._optionsConfig[k]._baseMusicalInstrumentsAllowed.map((item) => {return parseInt(item, 10);});
                        this.config.stepsConfig[i].linesConfig[j].optionsConfig[k].defaultMusicalInstrument = +actualConfig._stepsConfig[i]._linesConfig[j]._optionsConfig[k]._defaultMusicalInstrument;
                        this.config.stepsConfig[i].linesConfig[j].optionsConfig[k].musicalInstrumentsAllowed = actualConfig._stepsConfig[i]._linesConfig[j]._optionsConfig[k]._musicalInstrumentsAllowed.map((item) => {return parseInt(item, 10);});
                    }
                }
            }

            for (let i = 0; i < this.config.linesConfig.length; i++) {
                this.config.linesConfig[i].minVolume = +actualConfig._linesConfig[i]._minVolume;
                this.config.linesConfig[i].maxVolume = +actualConfig._linesConfig[i]._maxVolume;
                this.config.linesConfig[i].stepVolume = +actualConfig._linesConfig[i]._stepVolume;
                this.config.linesConfig[i].defaultVolume = +actualConfig._linesConfig[i]._defaultVolume;
            }
        } else {
            throw new Error('Arquivo em formato inválido');
        }
    }

    private validateSavedConfig(config: MusicalCompositionConfig, actualConfig: any): boolean {
        
        if (config.baseFileSystem != actualConfig._baseFileSystem || config.relativePath != actualConfig._relativePath) {
            return false;
        }

        if (config.stepsConfig.length != actualConfig._stepsConfig.length 
            || config.stepsConfig[0].linesConfig.length != actualConfig._stepsConfig[0]._linesConfig.length
            || config.stepsConfig[0].linesConfig[0].optionsConfig.length != actualConfig._stepsConfig[0]._linesConfig[0]._optionsConfig.length
            || config.linesConfig.length != actualConfig._linesConfig.length ) {
                return false;
        }
        
        for (let i = 0; i < config.stepsConfig.length; i++) {
            
            if (config.stepsConfig[i].relativePath != actualConfig._stepsConfig[i]._relativePath) {
                return false;
            }

            for (let j = 0; j < config.stepsConfig[i].linesConfig.length; j++) {
           
                if (config.stepsConfig[i].linesConfig[j].relativePath != actualConfig._stepsConfig[i]._linesConfig[j]._relativePath) {
                    return false;
                }
           
                for (let k = 0; k < config.stepsConfig[i].linesConfig[j].optionsConfig.length; k++) {
                    
                    if (config.stepsConfig[i].linesConfig[j].optionsConfig[k].fileName != actualConfig._stepsConfig[i]._linesConfig[j]._optionsConfig[k]._fileName) {
                        return false;
                    }

                }
            }
        }
        for (let i = 0; i < config.linesConfig.length; i++) {
            if (config.linesConfig[i].name != actualConfig._linesConfig[i]._name) {
                return false;
            }
        }

        return true;
    }

    public determinateMidiChannelsAttributesValues(source: MusicalCompositionSource): void {
        if (!this.config) {
            throw Error('As configurações não estão carregadas');
        }
        if (!source) {
            throw Error('A fonte de composição não pode ser nula');
        }
        let channels: string[];
        for (let i = 0; i < this.config.stepsConfig.length; i++) {
            for (let j = 0; j < this.config.stepsConfig[i].linesConfig.length; j++) {
                for (let k = 0; k < this.config.stepsConfig[i].linesConfig[j].optionsConfig.length; k++) {
                    channels = source.stepsSource[i].linesSource[j].optionsSource[k].midi.getAllUsedChannels();
                    if (channels.length > 1) {
                        throw Error('Cada midi deve possuir somente um canal.');
                    }
                    if (channels.length > 0 && Midi.DRUMS_MIDI_CHANNELS.indexOf(channels[0]) >= 0) {
                        this.config.stepsConfig[i].linesConfig[j].optionsConfig[k].musicalInstrumentsAllowed = this.CONFIG_DEFAULT_DRUMS_MUSICAL_INSTRUMENTS_ALLOWED;
                        this.config.stepsConfig[i].linesConfig[j].optionsConfig[k].baseMusicalInstrumentsAllowed = this.CONFIG_DEFAULT_DRUMS_MUSICAL_INSTRUMENTS_ALLOWED;
                        this.config.stepsConfig[i].linesConfig[j].optionsConfig[k].defaultMusicalInstrument = this.CONFIG_DEFAULT_DRUMS_MUSICAL_INSTRUMENTS_ALLOWED[0];
                    } else {
                        if (!this.config.stepsConfig[i].linesConfig[j].optionsConfig[k].musicalInstrumentsAllowed)
                            this.config.stepsConfig[i].linesConfig[j].optionsConfig[k].musicalInstrumentsAllowed = this.CONFIG_DEFAULT_MUSICAL_INSTRUMENTS_ALLOWED;
                        
                        if (!this.config.stepsConfig[i].linesConfig[j].optionsConfig[k].baseMusicalInstrumentsAllowed)
                            this.config.stepsConfig[i].linesConfig[j].optionsConfig[k].baseMusicalInstrumentsAllowed = this.CONFIG_DEFAULT_MUSICAL_INSTRUMENTS_ALLOWED;
                        
                        if (!this.config.stepsConfig[i].linesConfig[j].optionsConfig[k].defaultMusicalInstrument)
                            this.config.stepsConfig[i].linesConfig[j].optionsConfig[k].defaultMusicalInstrument = this.CONFIG_DEFAULT_MUSICAL_INSTRUMENTS_ALLOWED[0];
                    }
                }
            }
        }
    }

    public setTempoAndKeySignatureValues(midiSource: MusicalCompositionSource): void {
        
        if (!midiSource)
            throw new Error('A fonte de midis não pode ser nula.');

        if (midiSource.stepsSource.length <= 0) 
            throw new Error('A quantidade de passos deve ser maior que 1.');

        if (midiSource.stepsSource[0].linesSource.length <= 0) 
            throw new Error('A quantidade de linhas deve ser maior que 1.')
        
        if (midiSource.stepsSource[0].linesSource[0].optionsSource.length <= 0) 
            throw new Error('A quantidade de opções deve ser maior que 1.')

        this.config.numerator = midiSource.stepsSource[0].linesSource[0].optionsSource[0].midi.getNumerator(0);
        this.config.denominator = midiSource.stepsSource[0].linesSource[0].optionsSource[0].midi.getDenominator(0);
        this.config.mode = midiSource.stepsSource[0].linesSource[0].optionsSource[0].midi.getKeyMode(0);
    
    }

    public normalizeTimeDivision(midiSource: MusicalCompositionSource): void {
        
        if (!midiSource)
            throw new Error('A fonte de midis não pode ser nula.')

        let maxTimeDivicionMetric: number = Midi.MIN_TIME_DIVISION_METRIC_VALUE;

        for (let source of midiSource.stepsSource) {
            for (let line of source.linesSource) {
                for (let option of line.optionsSource) {
                    let metricalTimeDivion: MidiTimeDivisionMetrical =  <MidiTimeDivisionMetrical> option.midi.timeDivision;
                    if (metricalTimeDivion.metric > maxTimeDivicionMetric) {
                        maxTimeDivicionMetric = metricalTimeDivion.metric;
                    }
                }
            }
        }

        for (let source of midiSource.stepsSource) {
            for (let line of source.linesSource) {
                for (let option of line.optionsSource) {
                    this.midiControl.ajustMidiTimeDivision(option.midi, maxTimeDivicionMetric);
                }
            }
        }

        this.config.timeDivisionMetric = maxTimeDivicionMetric;
    }
    
}
