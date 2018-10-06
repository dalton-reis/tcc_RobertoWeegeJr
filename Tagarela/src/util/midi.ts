import { ConvertionUtil } from "./hexa";

export class Midi {

    private _midiType: MidiType;
    private _numberOfTracks: number;
    private _timeDivision: string;
    private _midiTracks: MidiTrack[];

    get midiType(): MidiType {
        return this._midiType;
    }

    set midiType(midiType: MidiType) {
        this._midiType = midiType;
    }

    get numberOfTracks(): number {
        return this._numberOfTracks;
    }

    set numberOfTracks(numberOfTracks: number) {
        this._numberOfTracks = numberOfTracks;
    }

    get timeDivision(): string {
        return this._timeDivision;
    }

    set timeDivision(timeDivision: string) {
        this._timeDivision = timeDivision;
    }

    get midiTracks(): MidiTrack[] {
        return this._midiTracks;
    }

    set midiTracks(midiTracks: MidiTrack[]) {
        this._midiTracks = midiTracks;
    }

    public cloneMidi(): Midi{
        let midi = new Midi();
        midi.midiType = this.midiType;
        midi.numberOfTracks = this.numberOfTracks;
        midi.timeDivision = this.timeDivision;
        midi.midiTracks = []; 
        
        for (let midiTrack of this.midiTracks) {
            let newMidiTrack:MidiTrack = new MidiTrack()
            newMidiTrack.midiEvents = Object.assign([], midiTrack.midiEvents);
            midi.midiTracks.push(newMidiTrack);
        }
        return midi;
    }

    public concatenateMidi(midiToConcatenate: Midi) {
        if (this.midiType != midiToConcatenate.midiType) {
            throw Error('Erro');
        }
        if (this.numberOfTracks != midiToConcatenate.numberOfTracks) {
            throw Error('Erro');
        }        
        if (this.timeDivision != midiToConcatenate.timeDivision) {
            throw Error('Erro');
        }        
        for (let i = 0; i < this.midiTracks.length; i++) {
            this.concatenateMidiTrack(i, midiToConcatenate.midiTracks[i]);
        }
    }

    private concatenateMidiTrack(trackIndex: number, trackToConcatenate: MidiTrack) {
        this.midiTracks[trackIndex].midiEvents.pop();
        for (let midiEvent of trackToConcatenate.midiEvents) {
            this.midiTracks[trackIndex].midiEvents.push(midiEvent)
        }
    }

    public generateMidiType1(midis: Midi[]) {
        this.midiType = MidiType.TYPE_1;
        this.midiTracks = [];
        this.timeDivision = midis[0].timeDivision;
        this.numberOfTracks = 0;

        for (let midi of midis) {
            //validar
            this.midiTracks.push(midi.midiTracks[0]);
            this.numberOfTracks++;
        }
    }
    
    public setupMidiFromFile(binaryString: string) {
        if (binaryString.substr(0, 4) != 'MThd') {
            throw Error('Midi file must start with "MThd" header indication');
        }
        
        let fileMidiType: number = ConvertionUtil.convertBinaryStringToNumber(binaryString.substr(8, 2));
        if (fileMidiType > 0 || fileMidiType < 0) {
            throw Error('Midi file type must be 0');
        }
        this.midiType = fileMidiType;

        let fileNumberOfTracks: number = ConvertionUtil.convertBinaryStringToNumber(binaryString.substr(10, 2));
        this.numberOfTracks = fileNumberOfTracks;

        let fileTimeDividion: string = ConvertionUtil.convertBinaryStringToHexString(binaryString.substr(12, 2));
        this.timeDivision = fileTimeDividion;

        if (binaryString.substr(14, 4) != 'MTrk') {
            throw Error('Midi file track must start with "MTrk" header indication');
        }
        this.midiTracks = [];

        let midiTrack: MidiTrack = new MidiTrack();
        this.midiTracks.push(midiTrack);
        let deltaTime: number = 0;

        for (let i = 22; i < binaryString.length;) {

            //deltaTime
            let deltaTimeStart: number = i;
            let deltaTimeLength: number = 1;

            while (!ConvertionUtil.isLastDeltaTimeByte(binaryString.charAt(deltaTimeStart + deltaTimeLength - 1))) {
                deltaTimeLength++;
                //lança exceção se passar de 4
            }

            //let teste = binaryString.substr(deltaTimeStart, deltaTimeLength);

            //calcula delta time
            deltaTime += ConvertionUtil.calculateDeltaTime(binaryString.substr(deltaTimeStart, deltaTimeLength));

            i += deltaTimeLength;

            //create event or sum delta time
            let midiEvent: MidiEvent = MidiEvent.getMidiEventData(deltaTime, binaryString.substr(i));

            //add event to track
            if (midiEvent.loadEvent){
                deltaTime = 0;
                midiTrack.addMidiEvent(midiEvent);
            } 
            
            i += midiEvent.getDataLength();

        }
    }

    public getBinaryString(): string {
        
        let midiHeaderString: string;
        let midiTracksString: string = '';
        let midiEndBinaryString: string = '';

        let midiType: string = this.midiType + '';
        while(midiType.length < 4) {
            midiType = '0' + midiType;
        }

        let trackQuantity: string = this.midiTracks.length + '';
        while(trackQuantity.length < 4) {
            trackQuantity = '0' + trackQuantity;
        }

        midiHeaderString = 'MThd' + ConvertionUtil.convertHexStringToBinararyString('00000006'       
        + midiType + trackQuantity + this.timeDivision);

        for (let midiTrack of this.midiTracks) {
            midiTracksString += 'MTrk';
            midiEndBinaryString = '';

            for (let midiEvent of midiTrack.midiEvents) {
                midiEndBinaryString += midiEvent.deltaTime + midiEvent.midiEventData;
            }
            midiEndBinaryString = ConvertionUtil.convertHexStringToBinararyString(midiEndBinaryString);
            let midiSizeBinaryString: string = ConvertionUtil.convertNumberToBinararyString(midiEndBinaryString.length, 4);
            midiTracksString += midiSizeBinaryString + midiEndBinaryString;
        }
       
        return midiHeaderString + midiTracksString;
    }

    public getMidiDescription(): string {
 
    let description: string = `Midi Type: ${this.midiType}
Number of Tracks: ${this.midiType}
Time division: ${this.timeDivision}
Midi Events:`

    for (let midiTrack of this.midiTracks) {
        for (let midiEvent of midiTrack.midiEvents) {
            description += `    DeltaTime: ${midiEvent.deltaTime} - Data: ${midiEvent.midiEventData}`;
        }
    }
    return description;
    }

}

export class MidiTrack {
    private _midiEvents: MidiEvent[];

    constructor() {
        this.midiEvents = [];
    }

    get midiEvents(): MidiEvent[]{
        return this._midiEvents;
    }
    
    set midiEvents(midiEvents: MidiEvent[]){
        this._midiEvents = midiEvents;
    }

    public addMidiEvent(midiEvent: MidiEvent){
        this.midiEvents.push(midiEvent);
    }

}

export class MidiEvent {
    private _deltaTime: string;
    private _midiEventType: MidiEventType;
    private _midiEventData: string;
    private _loadEvent: boolean;

    constructor(deltaTime: string, midiEventType: MidiEventType, midiEventData: string, loadEvent: boolean){
        this.deltaTime = deltaTime;
        this.midiEventType = midiEventType;
        this.midiEventData = midiEventData;
        this.loadEvent = loadEvent;
    }

    get deltaTime(): string{
        return this._deltaTime;
    }
    
    set deltaTime(deltaTime: string){
        this._deltaTime = deltaTime;
    }

    get midiEventType(): MidiEventType{
        return this._midiEventType;
    }
    
    set midiEventType(midiEventType: MidiEventType){
        this._midiEventType = midiEventType;
    }

    get midiEventData(): string{
        return this._midiEventData;
    }
    
    set midiEventData(midiEventData: string){
        this._midiEventData = midiEventData;
    }

    get loadEvent(): boolean{
        return this._loadEvent;
    }
    
    set loadEvent(loadEvent: boolean){
        this._loadEvent = loadEvent;
    }

    public getDataLength(){
        return this.midiEventData.length / 2;
    }

    public static getMidiEventData(deltaTime: number, midiData: string): MidiEvent {
        let firstEventByte: string = ConvertionUtil.convertBinaryStringToHexString(midiData.substr(0, 1)); 
        switch (firstEventByte.charAt(0)) {
            case '8':
                return new MidiEvent(ConvertionUtil.getDeltaTimeStringFromNumber(deltaTime)
                                    ,MidiEventType.MIDI_EVENT
                                    ,ConvertionUtil.convertBinaryStringToHexString(midiData.substr(0, 3))
                                    ,true);
            case '9':
                return new MidiEvent(ConvertionUtil.getDeltaTimeStringFromNumber(deltaTime)
                                    ,MidiEventType.MIDI_EVENT
                                    ,ConvertionUtil.convertBinaryStringToHexString(midiData.substr(0, 3))
                                    ,true);
            case 'a':
                return new MidiEvent(''
                                    ,MidiEventType.MIDI_EVENT
                                    ,ConvertionUtil.convertBinaryStringToHexString(midiData.substr(0, 3))
                                    ,false);    
            case 'b':
                return new MidiEvent(''
                                    ,MidiEventType.MIDI_EVENT
                                    ,ConvertionUtil.convertBinaryStringToHexString(midiData.substr(0, 3))
                                    ,false); 
            case 'c':
                return new MidiEvent(''
                                    ,MidiEventType.MIDI_EVENT
                                    ,ConvertionUtil.convertBinaryStringToHexString(midiData.substr(0, 2))
                                    ,false); 
            case 'd':
                return new MidiEvent(''
                                    ,MidiEventType.MIDI_EVENT
                                    ,ConvertionUtil.convertBinaryStringToHexString(midiData.substr(0, 2))
                                    ,false); 
            case 'e':
                return new MidiEvent(''
                                    ,MidiEventType.MIDI_EVENT
                                    ,ConvertionUtil.convertBinaryStringToHexString(midiData.substr(0, 3))
                                    ,false); 
            case 'f':
                if (firstEventByte == 'f0' || firstEventByte == 'f7') {
                    return new MidiEvent(''
                                        ,MidiEventType.SYSEX_EVENT
                                        ,ConvertionUtil.convertBinaryStringToHexString(midiData.substr(0, 2 + ConvertionUtil.convertBinaryStringToNumber(midiData.charAt(1))))
                                        ,false);

                }
                if (firstEventByte == 'ff') {
                    let eventTypeByte: string = ConvertionUtil.convertBinaryStringToHexString(midiData.charAt(1)); 
                    return new MidiEvent(ConvertionUtil.getDeltaTimeStringFromNumber(deltaTime)
                                        ,MidiEventType.META_EVENT
                                        ,ConvertionUtil.convertBinaryStringToHexString(midiData.substr(0, 3 + ConvertionUtil.convertBinaryStringToNumber(midiData.charAt(2))))
                                        ,eventTypeByte == '51' || eventTypeByte == '58' || eventTypeByte == '59' || eventTypeByte == '2f');
                }
                throw Error('Não mapeado...')
            default:
                throw Error('Não mapeado...')
        }
       //return null;
    }
    
}

enum MidiType {
    TYPE_0=0, TYPE_1=1, TYPE_2=2 
}

enum MidiEventType {
    MIDI_EVENT, SYSEX_EVENT, META_EVENT
}