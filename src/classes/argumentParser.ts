import ConfigData from "./setupWizard/ConfigDataInterface";
import SetupWizard from "./setupWizard/SetupWizard";
import SetupFinalizer from "./setupWizard/SetupFinalizer";

// step instances
import ConfigOverview from "./setupWizard/ConfigOverview";
import InstallFfMpeg from "./setupWizard/InstallFfMpeg";
import SetupRole from "./setupWizard/SetupRole";
import SetupProjectID from "./setupWizard/SetupProjectID";
import EnableApis from "./setupWizard/EnableApis";
import SelectLanguage from "./setupWizard/SelectLanguage";
import SelectRepeatCount from "./setupWizard/SelectRepeatCount";
import BuildOverview from "./setupWizard/BuildOverview";

// build related
import BuildOrchestrator from "./sentenceBuilder/BuildOrchestrator";
import Sentence from "./sentenceBuilder/Sentence";


export default class ArgumentParser {
   protected commandLineArgs: string[];

   constructor(argV: string[]) {
      this.commandLineArgs = argV;
   }

   // ---------------  Public Methods


   // ---------------  Helpers

   protected countArgs() {}

   public parse() {
      // look for a flag in position 1
      // first two args are always "node" and {path}
      const arg1 = this.commandLineArgs[2];

      switch (arg1) {
         case "-c":
         case "--configure": {

            // run setup wizard
            const setupWizard: InstanceType<typeof SetupWizard>= new SetupWizard([
               new ConfigOverview()
               , new InstallFfMpeg()
               , new SetupRole()
               , new SetupProjectID()
               , new EnableApis()
               , new SelectLanguage()
               , new SelectRepeatCount()
            ]);
            
            // instruct on google cloud setup, gather config data
            const configData = setupWizard.initialSetup();

            // save & create files
            const setupFinalizer = new SetupFinalizer();
            const successfulSave: boolean = setupFinalizer.save(configData);
            const sentenceFileCreated: boolean = setupFinalizer.createSentenceFile();

            // print final instructions
            if (successfulSave && sentenceFileCreated) {
               setupFinalizer.printFinalInstructions();
            }

            break;
         }

         case "-b":
         case "--build": {
            // parses sentence file for qualified sentences on instantiation
            const buildOrchestrator = new BuildOrchestrator();

            buildOrchestrator.printCountOfValidSentences();

            // print instructions for usage
            const buildOverview = new BuildOverview();
            buildOverview.explain();
            buildOverview.prompt();


            // runs build process on all qualified sentences
            buildOrchestrator.qualifiedSentences.forEach(async sentence => {
               const folderExists = buildOrchestrator.checkForExistingFolder(sentence);

               if (folderExists === false) {
                  await buildOrchestrator.makeFolderAndAudioFile(sentence);
               }   
            });


            console.log(`Your foreign audio course has been built in the "/audioCourse" subfolder of the project root. Happy learning! 

PS: You can add more sentences or phrases to "sentences.txt" at any time, and rerun the build process to add more practice audios to your course.`)

            break;
         }

         // This case also catches undefined positional parameters
         default: {
            console.log(
`Please run this script with the -c or --configure flag to configure your project using the setup wizard. 

Or use the -b or --build flag to build the audio files and subfolders from the sentences/phrases specified in "sentences.txt" (one per line).
            
`);
         }
      }
   }
}