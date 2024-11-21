import { Log } from '@core/utils';
import { OpenAiMessageRole } from '@core/chat-bot/domain/OpenAiMessageRole';
import { ChatbotController } from '@/shared/components/chat/controller/ChatbotController';
import { ShortInfoDatabaseSchema } from '@/shared/components/chat/controller/functions/TableSchemaPicker';
import { ChatMessageData } from '@/shared/components/chat/controller/ChatMessageData';
import { MessageType } from '@/shared/components/chat/controller/MessageType';
import { OpenAiModels } from '@/shared/components/chat/controller/OpenAiModels';

export class ColumnDescriptionFunction {
  private controller: ChatbotController;

  constructor(controller: ChatbotController) {
    this.controller = controller;
  }

  async execute(db: ShortInfoDatabaseSchema, tblName: string, column: string): Promise<string> {
    try {
      await this.init();
      const message = this.buildMessage(db, tblName, column);
      return (await this.controller.completion(message)).text;
    } catch (error) {
      Log.error(error);
      throw error;
    }
  }

  private buildMessage(db: ShortInfoDatabaseSchema, tblName: string, column: string): ChatMessageData[] {
    return [
      {
        text: `Act as a Data Engineer.
        Your task is to take the provided database schema, table name, a column name to write column's description.
        The database schema is defined as a JSON object with the following structure:
        - "database": The name of the database.
        - "displayName": The display name of the database.
        - "tables": An array of tables, each with the following fields:
            + "database": The name of the database.
            + "table": The name of the table (e.g., "sale").
            + "columns": An array of columns, each with:
                * "name": The column name.
                * "type": The column type (e.g., "String", "Date", "Double", "Float", "Int").
                * "description": The column description.
        The column name, table name, the database schema will be delimited by triple equals signs.
        ###Example 1:
        Table name: ===customer===
        Column name: ===Balance===
        Database Schema: ===${JSON.stringify(this.getMockDb())}===\n\n
        Output:
        The customer's account balance
        `,
        type: MessageType.text,
        role: OpenAiMessageRole.system
      },
      {
        text: `Table name: ===${tblName}===\nColumn===${column}===\nDatabase schema===${JSON.stringify(db)}===\n`,
        type: MessageType.text,
        role: OpenAiMessageRole.system
      }
    ];
  }

  private init(): Promise<void> {
    if (this.controller.initiated) {
      return Promise.resolve();
    }

    return this.controller.init(this.model);
  }

  private get model(): OpenAiModels {
    return OpenAiModels.GPT35Turbo;
  }

  private getMockDb(): any {
    return {
      database: 'bank_db',
      displayName: 'Bank Database',
      tables: [
        {
          database: 'bank_db',
          table: 'customer',
          columns: [
            {
              name: 'CustomerId',
              type: 'Int',
              description: 'A unique identifier for each customer'
            },
            {
              name: 'Surname',
              type: 'String',
              description: "The customer's last name"
            },
            {
              name: 'CreditScore',
              type: 'Int',
              description: "A numerical value representing the customer's credit score"
            },
            {
              name: 'Geography',
              type: 'String',
              description: 'The country where the customer resides'
            },
            {
              name: 'Gender',
              type: 'String',
              description: "The customer's gender (Male or Female)"
            },
            {
              name: 'Age',
              type: 'Int',
              description: "The customer's age"
            },
            {
              name: 'Tenure',
              type: 'Int',
              description: 'The number of years the customer has been with the bank'
            },
            {
              name: 'Balance',
              type: 'Double'
            },
            {
              name: 'NumOfProducts',
              type: 'Int',
              description: 'The number of bank products the customer uses'
            },
            {
              name: 'HasCrCard',
              type: 'Int',
              description: 'Whether the customer has a credit card (1 = yes)'
            },
            {
              name: 'IsActiveMember',
              type: 'Int',
              description: 'Whether the customer is an active member (1 = yes)'
            },
            {
              name: 'EstimatedSalary',
              type: 'Double',
              description: 'The estimated salary of the customer'
            },
            {
              name: 'Exited',
              type: 'Int',
              description: 'Whether the customer has churned (1 = yes)'
            }
          ]
        }
      ]
    };
  }
}
