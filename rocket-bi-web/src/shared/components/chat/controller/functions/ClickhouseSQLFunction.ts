import { Log } from '@core/utils';
import { ChatMessageData } from '@/shared/components/chat/controller/ChatMessageData';
import { StringUtils } from '@/utils';
import { OpenAiMessageRole } from '@core/chat-bot/domain/OpenAiMessageRole';
import { DIException } from '@core/common/domain';
import { ShortInfoDatabaseSchema } from '@/shared/components/chat/controller/functions/TableSchemaPicker';
import { ChatbotController } from '@/shared/components/chat/controller/ChatbotController';
import { OpenAiModels } from '@/shared/components/chat/controller/OpenAiModels';
import { MessageType } from '@/shared/components/chat/controller/MessageType';

export class ClickhouseSQLFunction {
  private controller: ChatbotController;

  constructor(controller: ChatbotController) {
    this.controller = controller;
  }

  async execute(prompt: string, db: ShortInfoDatabaseSchema): Promise<string> {
    try {
      await this.init();
      const messages: ChatMessageData[] = this.buildMessage(prompt, db);
      const response: ChatMessageData = await this.controller.completion(messages);
      // const response: ChatMessageData = {
      //   text: '{"sql_query":"SELECT COUNT(DISTINCT geo_country) AS country_count FROM sample.ga4"}',
      //   type: MessageType.text,
      //   role: OpenAiMessageRole.assistant
      // };
      this.ensureResponse(response);
      return this.toResponse(response);
    } catch (error) {
      Log.error(error);
      throw error;
    }
  }

  private ensureResponse(response: ChatMessageData) {
    ///Dont have any data
    if (StringUtils.isEmpty(response.text)) {
      throw new DIException("We're sorry, but it looks like there's no data available right now.");
    }
    ///Response not return as json
    if (!StringUtils.convertToJson(response.text)) {
      throw new DIException("We're sorry, but it looks like there's no data available right now.");
    }

    const responseAsJson = StringUtils.convertToJson(response.text);
    const message = responseAsJson['message'];
    const reason = responseAsJson['reason'];
    if (!!message && !!reason) {
      throw new DIException(message, 500, reason);
    }
  }

  toResponse(messageData: ChatMessageData) {
    const responseAsJson = StringUtils.convertToJson(messageData.text);
    return `\n${responseAsJson['sql_query']}`;
  }

  private buildMessage(prompt: string, db: ShortInfoDatabaseSchema): ChatMessageData[] {
    return [
      {
        text: `
        Act as a Data Engineer.
        Your task is to take the user's prompt and the provided database schema to write a SQL query using ClickHouse syntax for displaying data.
        The user's prompt and the database schema will be delimited by triple equals signs.
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
        You should:
        1. Identify and generate descriptions for any columns that are missing them before attempting to generate the SQL query. Descriptions should be concise and based on the column's name and type.
        1. Identify the table requested by the user's prompt.
        2. Identify the columns requested by the user's prompt in the table selected.
        3. Handle column and table errors as follows:
            - If the requested table is not found in the database, return a descriptive error message stating the table does not exist in the database.
            - If the requested columns are not found in the selected table, return a descriptive error message stating the column does not exist in the database.
            - Suggest valid column names if a column is misspelled or incorrectly provided (using approximate string matching techniques).
        4. Ensure the SQL query reflects the correct aggregation and grouping as required by the user's request (e.g., total profit by region).
        5. Format the SQL query using correct ClickHouse syntax, ensuring the appropriate handling of data types (e.g., Date, String) and functions specific to ClickHouse.
        6. **Important**: Do not include a semicolon at the end of the SQL query.
        Format your response as a JSON object containing the SQL query.
        Example 1:
        User: ===Show the average sale amount by product in the month of June 2023.==={"database":"sales_db","displayName":"Sales Database","tables":[{"database":"sales_db","table":"sale","columns":[{"name":"product","type":"String","description":"Product name"},{"name":"sale_amount","type":"Float"},{"name":"sale_date","type":"Date","description":"Date of the sale"}]}]}
        Assistant: {"sql_query":"SELECT product, AVG(sale_amount) AS avg_sale_amount FROM sales_db.sale WHERE sale_date BETWEEN '2023-06-01' AND '2023-06-30' GROUP BY product"}
        Example 2:
        User: ===Show total sales by region in 2023.==={"database":"sales_db","displayName":"Sales Database","tables":[{"database":"sales_db","table":"sale","columns":[{"name":"region","type":"String"},{"name":"sale_amount","type":"Float"},{"name":"sale_date","type":"Date","description":"Date of the sale"}]}]}
        Assistant: {"sql_query":"SELECT region, SUM(sale_amount) AS total_sales FROM sales_db.sale WHERE sale_date BETWEEN '2023-01-01' AND '2023-12-31' GROUP BY region"}
        Example 3:
        User: ===view total users==={"database":"bank_db","displayName":"Bank Database","tables":[{"database":"bank_db","table":"customer","columns":[{"name":"CustomerId","type":"Int"},{"name":"Surname","type":"String"},{"name":"CreditScore","type":"Int"},{"name":"Geography","type":"String"},{"name":"Gender","type":"String"},{"name":"Age","type":"Int"},{"name":"Tenure","type":"Int"},{"name":"Balance","type":"Double"},{"name":"NumOfProducts","type":"Int"},{"name":"HasCrCard","type":"Int"},{"name":"IsActiveMember","type":"Int"},{"name":"EstimatedSalary","type":"Double"},{"name":"Exited","type":"Int"}]}]}===
        Assistant: {"sql_query":"SELECT COUNT(CustomerId) AS TotalUsers FROM bank_db.customer"}
        `,
        type: MessageType.text,
        role: OpenAiMessageRole.system
      },
      {
        text: `User's prompt: ===${prompt}===\n Database Schema: ===${JSON.stringify(db)}`,
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
}
