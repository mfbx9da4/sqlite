import BetterSqlite3Database from "better-sqlite3";

export interface Query {
  source: string;
  parameters: any[];
}

export function sql(
  template: TemplateStringsArray,
  ...substitutions: any[]
): Query {
  const sourceParts = new Array<string>();
  const parameters = new Array<any>();

  for (
    let templateIndex = 0;
    templateIndex < template.length - 1;
    templateIndex++
  ) {
    const templatePart = template[templateIndex];
    const parameter = substitutions[templateIndex];

    if (templatePart.endsWith("$")) {
      // sourceParts.push(templatePart.slice(0, -1));
    } else {
      sourceParts.push(templatePart);
      parameters.push(parameter);
    }
  }
  sourceParts.push(template[template.length - 1]);

  return { source: sourceParts.join("?"), parameters };
}

// FIXME: https://github.com/JoshuaWise/better-sqlite3/issues/551
export class Database extends BetterSqlite3Database {
  statements: Map<string, BetterSqlite3Database.Statement> = new Map();

  execute: (query: Query) => this = (query) => {
    const { source, parameters } = query;
    if (parameters.length > 0)
      throw new Error(
        `execute(${JSON.stringify(
          query,
          undefined,
          2
        )}) failed because execute() doesn’t support parameters`
      );
    return this.exec(source);
  };

  run: (query: Query) => BetterSqlite3Database.RunResult = ({
    source,
    parameters,
  }) => {
    return this.getStatement(source).run(parameters);
  };

  get: <T>(query: Query) => T = ({ source, parameters }) => {
    return this.getStatement(source).get(parameters);
  };

  all: <T>(query: Query) => T[] = ({ source, parameters }) => {
    return this.getStatement(source).all(parameters);
  };

  iterate: <T>(query: Query) => IterableIterator<T> = ({
    source,
    parameters,
  }) => {
    return this.getStatement(source).iterate(parameters);
  };

  getStatement: (source: string) => BetterSqlite3Database.Statement = (
    source
  ) => {
    let statement = this.statements.get(source);
    if (statement === undefined) {
      statement = this.prepare(source);
      this.statements.set(source, statement);
    }
    return statement;
  };
}