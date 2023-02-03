const queryLanguages = {
  clickHouse: {
    default: ''
  },
  python3: {
    default: `def process(client: Client, database: str, table: str, dest_database: str, dest_table: str):
    """Process the data from the table and insert into the dest_table
    :type client: clickhouse_driver.client.Client
    :type database: str dabase name
    :type table: str table name
    :type dest_table: str destination table name
    """
    # read data
    result_set = client.query("select count(1) as rows from \`{database}\`.\`{table}\`".format(database=database, table=table)).result_set
    rows = []
    for row in result_set:
        rows.append(row)
    # create destination table
        create_table_query = "CREATE TABLE IF NOT EXISTS \`{database}\`.\`{dest_table}\`(rows Int64) ENGINE MergeTree() ORDER BY rows".format(database=dest_database, dest_table=dest_table)
    _ = client.command(create_table_query)
    # insert data
    client.insert(database=dest_database, table=dest_table, data=rows, column_names=['rows'])
    `
  }
};

window.queryLanguages = queryLanguages;
