export type SqlRow = Record<string, unknown>;

export interface SqlDb {
  <T extends SqlRow = SqlRow>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>;
  unsafe(sql: string): Promise<void>;
  begin<T>(fn: (db: SqlDb) => Promise<T>): Promise<T>;
  end(): Promise<void>;
}
