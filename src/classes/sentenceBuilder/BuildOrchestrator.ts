import path from "path";
import fs from "fs";
import readLine from "readline-sync";
const audioConcat = require("audioconcat");

// dependent classes
import {translationDirection} from "../minorTypes";
import Sentence from "./Sentence";
import Utilities from "../Utilities";
import AudioMaker from "./AudioMaker";
import ConfigData from "../setupWizard/ConfigDataInterface";
import ForeignPhraseDefinitionPair from "./ForeignPhraseDefinitionPairInterface";


export default class BuildOrchestrator {
   // --------------- Instance Properties
   private configData: ConfigData;
   public qualifiedSentences: Array<Sentence> = [];

   // --------------- Constructor
   constructor() {
      this.configData = this.setConfigData();
      this.qualifiedSentences = this.setQualifiedSentences();
   }

   // --------------- Public Methods

   /* 
      This method controls the high level creation of each subfolder, along with audio contents
   */
   public async makeFolderAndAudioFile(
      sentence: Sentence
      ): Promise<void> {
      
      const audioMaker = new AudioMaker(this.configData, sentence);

      // make folder IF not already there
      const subFolderPath = audioMaker.makeSentenceFolder();

      // make word definition track
      audioMaker.makeWordAudioFile();

      // make first sentence track
      const leadSentencePrefix = `1`;
      audioMaker.makeSentenceTrack(leadSentencePrefix);

      // make the final reinforcement sentence
      const repeatSentenceFileName = `3-repeat-sentence.ogg:`;
      audioMaker.duplicateTrack(leadSentencePrefix, repeatSentenceFileName);
      
   }


   public printCountOfValidSentences(): void {
      console.log(`${this.qualifiedSentences} valid sentences (more than one character long) were found and parsed.`);
   }

   public parseSentenceFile(filepath = path.join(__dirname, "../../../sentences.txt")): Array<string> {
      const sentenceCandidates = fs
         .readFileSync(filepath)
         .toString()
         .split("\n");

      return sentenceCandidates;
   }


   public checkForExistingFolder(sentence: Sentence): boolean {
      const {folderName} = sentence;
      const suspectFolderPath = path.join(__dirname, `../../../audioCourse`, folderName);

      return fs.existsSync(suspectFolderPath);
   }

   // --------------- Internal Methods

   protected setConfigData(): ConfigData {
      // read config file
      const configData = JSON.parse(
         path.join(__dirname, 
            "../../../configuration.json"
         )
      );

      // set it to the config property
      const moddedConfig: Partial<{
         languageCode: string
         , numberOfRepeats: number
      }> = Object.keys(configData).reduce((moddedObject, currentKey) => {
         if (currentKey = "numberOfRepeats") {
            return {
               ...moddedObject
               , currentKey : Number(configData[currentKey])
            }
         }

         return {
            currentKey : configData[currentKey]
         }
      }, {})

      return moddedConfig as ConfigData;
   }


   protected setQualifiedSentences(): Sentence[] {
      const sentenceCandidates: string[] = this.parseSentenceFile();
      const validated: Sentence[] = this.validateAndSetSentenceCandidates(sentenceCandidates);
      return validated;
   }


   /* Assigns instance property `qualifiedSentences`
      If length is greater than 1 the sentence/phrase passes 
   */
   protected validateAndSetSentenceCandidates(candidates: string[]) {
      const passedAndUndefined: Array<Sentence | null> = candidates
         .map(candidate => {
            if (candidate.length >= 2) {
               return new Sentence(candidate);
            }
            
            return null;
         });

      const passedTest: Sentence[] = passedAndUndefined
         .filter((item: Sentence | null): item is Sentence => item !== undefined);

         
      if (Array.isArray(this.qualifiedSentences)) {
         return passedTest;
      }
      else {
         throw Error("Error: No qualified sentences found");
      }
   }

}