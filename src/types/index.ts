/**
 * Describes the change that needs to be made.
 */
export enum ChangeType
{ // eslint-disable-line @typescript-eslint/indent
  /** No change. */
  NONE = "none",
  /** A value was inserted. */
  INSERT = "insert",
  /** A value was replaced. */
  UPDATE = "update",
  /** A value was deleted. */
  DELETE = "delete",
  /** The value requires a recursive diff to identify further changes. */
  PENDING = "pending"
}

/**
 * A record that documents a change to an entry in an array or object.
 */
export type Change = [
  ChangeType,
  string | number,
  any
];