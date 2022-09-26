import { Vue } from 'vue-property-decorator';

export abstract class SuggestionCommand {
  abstract load(): Promise<string[]>;
}
